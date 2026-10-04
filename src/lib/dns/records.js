// Enregistrements de base : adresses (A, AAAA, alias), serveurs de noms, SOA, CAA et DNSSEC.
import { finding } from './findings.js';
import { isPrivateIPv4, isPrivateIPv6 } from './ip.js';
import { cnameChain, recordsOf, stripDot } from './resolver.js';

export function analyzeAddresses({ aRes, aaaaRes }) {
  const findings = [];
  const a = recordsOf(aRes, 'A').map((r) => ({ value: r.data, ttl: r.ttl }));
  const aaaa = recordsOf(aaaaRes, 'AAAA').map((r) => ({ value: r.data, ttl: r.ttl }));
  const chain = cnameChain(aRes).length ? cnameChain(aRes) : cnameChain(aaaaRes);

  if (chain.length) findings.push(finding('addr.cname', 'info', { target: chain.at(-1).to, count: chain.length }));
  if (!a.length && !aaaa.length) findings.push(finding('addr.none', 'info'));
  for (const list of [a, aaaa]) {
    const values = list.map((r) => r.value);
    for (const v of new Set(values.filter((x, i) => values.indexOf(x) !== i))) findings.push(finding('addr.duplicate', 'warn', { value: v }));
  }
  const priv = [...a.filter((r) => isPrivateIPv4(r.value)), ...aaaa.filter((r) => isPrivateIPv6(r.value))];
  for (const r of priv) findings.push(finding('addr.private', 'error', { value: r.value }));
  if (a.length && !aaaa.length) findings.push(finding('addr.noIpv6', 'info'));
  if (!findings.some((f) => f.severity === 'error' || f.severity === 'warn')) findings.push(finding('addr.ok', 'ok', { v4: a.length, v6: aaaa.length }));
  return { a, aaaa, cname: chain, findings };
}

export function analyzeNs({ nsRes }) {
  const findings = [];
  const hosts = recordsOf(nsRes, 'NS').map((r) => ({ host: stripDot(r.data), ttl: r.ttl }));
  if (!hosts.length) {
    findings.push(finding('ns.none', 'error'));
    return { hosts, findings };
  }
  const names = hosts.map((h) => h.host);
  for (const d of new Set(names.filter((n, i) => names.indexOf(n) !== i))) findings.push(finding('ns.duplicate', 'warn', { host: d }));
  if (new Set(names).size < 2) findings.push(finding('ns.single', 'warn'));
  if (!findings.length) findings.push(finding('ns.ok', 'ok', { count: hosts.length }));
  return { hosts, findings };
}

/** « ns1. hostmaster. 2024010101 7200 3600 1209600 3600 » -> champs numériques. */
export function parseSoa(data) {
  const p = data.trim().split(/\s+/);
  if (p.length < 7) return null;
  const [mname, rname, serial, refresh, retry, expire, minimum] = p;
  return { mname: stripDot(mname), rname: stripDot(rname), serial: Number(serial), refresh: Number(refresh), retry: Number(retry), expire: Number(expire), minimum: Number(minimum) };
}

export function analyzeSoa({ soaRes }) {
  const findings = [];
  const record = recordsOf(soaRes, 'SOA')[0];
  const soa = record ? parseSoa(record.data) : null;
  if (!soa) {
    findings.push(finding('soa.none', 'warn'));
    return { soa: null, findings };
  }
  if (soa.expire < 604800) findings.push(finding('soa.expireLow', 'warn', { value: soa.expire }));
  if (soa.minimum > 86400) findings.push(finding('soa.minimumHigh', 'info', { value: soa.minimum }));
  if (soa.refresh < soa.retry) findings.push(finding('soa.refreshRetry', 'info', { refresh: soa.refresh, retry: soa.retry }));
  if (!findings.length) findings.push(finding('soa.ok', 'ok'));
  return { soa, ttl: record.ttl, findings };
}

/** `0 issue "letsencrypt.org"` (ou la forme générique `\# 22 00056973737565…`) -> { flags, tag, value }. */
export function parseCaa(data) {
  const text = /^(\d+)\s+([a-z0-9]+)\s+"?(.*?)"?$/i.exec(data.trim());
  if (text && !data.startsWith('\\#')) return { flags: Number(text[1]), tag: text[2].toLowerCase(), value: text[3] };
  const generic = /^\\#\s+(\d+)\s+([0-9a-f\s]+)$/i.exec(data.trim());
  if (!generic) return null;
  const bytes = generic[2].replace(/\s+/g, '').match(/../g)?.map((h) => parseInt(h, 16)) ?? [];
  const tagLength = bytes[1];
  if (bytes.length < 2 + tagLength) return null;
  const str = (arr) => String.fromCharCode(...arr);
  return { flags: bytes[0], tag: str(bytes.slice(2, 2 + tagLength)).toLowerCase(), value: str(bytes.slice(2 + tagLength)) };
}

const CAA_TAGS = new Set(['issue', 'issuewild', 'iodef', 'contactemail', 'contactphone']);

export function analyzeCaa({ caaRes }) {
  const findings = [];
  const records = recordsOf(caaRes, 'CAA').map((r) => ({ ...parseCaa(r.data), raw: r.data, ttl: r.ttl }));
  if (!records.length) {
    findings.push(finding('caa.none', 'info'));
    return { records, findings };
  }
  for (const r of records) if (!r.tag || !CAA_TAGS.has(r.tag)) findings.push(finding('caa.invalid', 'warn', { value: r.raw }));
  const issuers = [...new Set(records.filter((r) => r.tag === 'issue' && r.value).map((r) => r.value.split(';')[0].trim()).filter(Boolean))];
  if (!findings.length) findings.push(finding('caa.present', 'ok', { issuers: issuers.join(', ') || '—' }));
  return { records, issuers, findings };
}

export function analyzeDnssec({ dsRes, aRes }) {
  const signed = recordsOf(dsRes, 'DS').length > 0;
  if (!signed) return { signed: false, validated: false, findings: [finding('dnssec.unsigned', 'info')] };
  const validated = aRes.ad || dsRes.ad;
  return { signed, validated, findings: [validated ? finding('dnssec.validated', 'ok') : finding('dnssec.notValidated', 'warn')] };
}
