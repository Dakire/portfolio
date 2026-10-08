// Protections de transport et d'image de marque : MTA-STS (RFC 8461), TLS-RPT (RFC 8460) et BIMI.
import { finding, type Finding } from './findings.js';
import { txtRecords, type DnsResult } from './resolver.js';
import type { DmarcAnalysis } from './dmarc.js';

const tagsOf = (text: string): Record<string, string> =>
  Object.fromEntries(
    text
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf('=');
        return i < 0
          ? [p.toLowerCase(), '']
          : [p.slice(0, i).trim().toLowerCase(), p.slice(i + 1).trim()];
      }),
  );

export interface ExtraAnalysis {
  records: { text: string; parts: string[]; ttl: number; name: string }[];
  tags?: Record<string, string>;
  findings: Finding[];
}

const select = (res: DnsResult, version: string) =>
  txtRecords(res).filter((t) => new RegExp(`^\\s*v\\s*=\\s*${version}\\s*(;|$)`, 'i').test(t.text));

export function analyzeMtaSts({ res }: { res: DnsResult }): ExtraAnalysis {
  const found = select(res, 'STSv1');
  if (!found.length) return { records: [], findings: [finding('mtasts.none', 'info')] };
  if (found.length > 1)
    return {
      records: found,
      findings: [finding('mtasts.multiple', 'error', { count: found.length })],
    };
  const tags = tagsOf(found[0]?.text ?? '');
  const ok = /^[A-Za-z0-9]{1,32}$/.test(tags.id ?? '');
  return {
    records: found,
    tags,
    findings: [
      ok ? finding('mtasts.ok', 'ok', { id: tags.id }) : finding('mtasts.invalid', 'warn'),
    ],
  };
}

export function analyzeTlsRpt({ res }: { res: DnsResult }): ExtraAnalysis {
  const found = select(res, 'TLSRPTv1');
  if (!found.length) return { records: [], findings: [finding('tlsrpt.none', 'info')] };
  const tags = tagsOf(found[0]?.text ?? '');
  const uris = (tags.rua ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const ok =
    found.length === 1 &&
    uris.length > 0 &&
    uris.every((u) => /^(mailto:[^@\s]+@[^@\s]+|https:\/\/\S+)$/i.test(u));
  return {
    records: found,
    tags,
    findings: [ok ? finding('tlsrpt.ok', 'ok') : finding('tlsrpt.invalid', 'warn')],
  };
}

/** BIMI exige un DMARC appliqué (quarantine ou reject, pct=100) : `dmarc` est le résultat de analyzeDmarc. */
export function analyzeBimi({
  res,
  dmarc,
}: {
  res: DnsResult;
  dmarc?: Pick<DmarcAnalysis, 'parsed'>;
}): ExtraAnalysis {
  const found = select(res, 'BIMI1');
  if (!found.length) return { records: [], findings: [finding('bimi.none', 'info')] };
  const tags = tagsOf(found[0]?.text ?? '');
  const findings: Finding[] = [];
  const logoOk = /^https:\/\/\S+\.svg(\?.*)?$/i.test(tags.l ?? '');
  if (found.length > 1 || !logoOk) findings.push(finding('bimi.invalid', 'warn'));
  const parsed = dmarc?.parsed;
  const enforced =
    parsed &&
    !!parsed.policy &&
    ['quarantine', 'reject'].includes(parsed.policy) &&
    (parsed.tags.pct === undefined || Number(parsed.tags.pct) === 100);
  if (!enforced) findings.push(finding('bimi.needsDmarc', 'warn'));
  if (!findings.length) findings.push(finding('bimi.ok', 'ok'));
  return { records: found, tags, findings };
}
