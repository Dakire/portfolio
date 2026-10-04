// MX : syntaxe, hôtes qui doivent résoudre (et ne pas être des CNAME), adresses non routables, doublons, MX nul (RFC 7505).
import { finding } from './findings.js';
import { isIPv4, isIPv6, isPrivateIPv4, isPrivateIPv6 } from './ip.js';
import { detectProviders } from './providers.js';
import { mapLimit, RCODE, recordsOf, stripDot } from './resolver.js';

/** « 10 mx.example.com. » -> { priority, host } (host '.' = MX nul). */
export function parseMx(data) {
  const m = /^\s*(\d+)\s+(\S+)\s*$/.exec(data);
  if (!m) return null;
  return { priority: Number(m[1]), host: m[2] === '.' ? '.' : stripDot(m[2]) };
}

export async function analyzeMx({ domain, mxAnswers, resolver }) {
  const findings = [];
  const parsed = mxAnswers.map((a) => ({ ...parseMx(a.data), ttl: a.ttl, raw: a.data })).filter((m) => m.host !== undefined);
  const invalid = mxAnswers.length - parsed.length;
  if (invalid) findings.push(finding('mx.invalidSyntax', 'error', { count: invalid }));

  if (parsed.length === 0 && !invalid) {
    findings.push(finding('mx.none', 'warn', { domain }));
    return { records: [], hosts: [], findings, providers: [] };
  }

  const nullMx = parsed.filter((m) => m.host === '.');
  if (nullMx.length) {
    findings.push(parsed.length > nullMx.length ? finding('mx.nullMixed', 'error') : finding('mx.null', 'info'));
    if (parsed.length === nullMx.length) return { records: parsed, hosts: [], findings, providers: [] };
  }

  const real = parsed.filter((m) => m.host !== '.').sort((a, b) => a.priority - b.priority || a.host.localeCompare(b.host));
  const seenHosts = new Set();
  for (const m of real) {
    if (seenHosts.has(m.host)) findings.push(finding('mx.duplicateHost', 'warn', { host: m.host }));
    seenHosts.add(m.host);
  }
  if (real.length === 1) findings.push(finding('mx.single', 'info', { host: real[0].host }));
  const priorities = real.map((m) => m.priority);
  if (real.length > 1 && new Set(priorities).size < priorities.length) findings.push(finding('mx.samePriority', 'info'));

  // Chaque hôte : doit être un nom (pas une IP), ne pas être un alias, et résoudre vers une adresse publique
  const hosts = await mapLimit([...seenHosts].slice(0, 10), 5, async (host) => {
    const entry = { host, a: [], aaaa: [], cname: null, findings: [] };
    if (isIPv4(host) || isIPv6(host)) {
      entry.findings.push(finding('mx.ip', 'error', { host }));
      return entry;
    }
    const [a, aaaa] = await Promise.all([resolver.query(host, 'A'), resolver.query(host, 'AAAA')]);
    entry.a = recordsOf(a, 'A').map((r) => r.data);
    entry.aaaa = recordsOf(aaaa, 'AAAA').map((r) => r.data);
    const alias = recordsOf(a, 'CNAME').find((r) => r.name === host);
    if (alias) {
      entry.cname = stripDot(alias.data);
      entry.findings.push(finding('mx.cname', 'error', { host, target: entry.cname }));
    }
    if (entry.a.length + entry.aaaa.length === 0) {
      entry.findings.push(finding('mx.unresolved', 'error', { host, nxdomain: a.status === RCODE.NXDOMAIN }));
    } else if (entry.a.some(isPrivateIPv4) || entry.aaaa.some(isPrivateIPv6)) {
      entry.findings.push(finding('mx.private', 'error', { host }));
    }
    return entry;
  });
  for (const h of hosts) findings.push(...h.findings);

  const providers = detectProviders({ mxHosts: real.map((m) => m.host) });
  if (providers.length) findings.push(finding('mx.provider', 'info', { names: providers.map((p) => p.name).join(', ') }));
  if (!findings.some((f) => f.severity === 'error' || f.severity === 'warn')) findings.push(finding('mx.ok', 'ok', { count: real.length }));

  return { records: parsed, hosts, findings, providers };
}
