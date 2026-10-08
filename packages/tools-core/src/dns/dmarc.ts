// DMARC (RFC 7489) : syntaxe de chaque balise, cohérence de la politique, adresses de rapport (y compris l'autorisation des
// adresses hébergées sur un autre domaine) et repli sur le domaine d'organisation pour les sous-domaines.
import { orgDomain } from './domain.js';
import { finding, type Finding, type Severity } from './findings.js';
import { RCODE, txtRecords, type DnsResult, type Resolver } from './resolver.js';

export const isDmarcRecord = (text: unknown): boolean =>
  /^\s*v\s*=\s*DMARC1\s*(;|$)/i.test(String(text));

const KNOWN_TAGS = new Set([
  'v',
  'p',
  'sp',
  'pct',
  'adkim',
  'aspf',
  'fo',
  'rf',
  'ri',
  'rua',
  'ruf',
  'np',
  'psd',
  't',
]);
const POLICIES = ['none', 'quarantine', 'reject'];
const EMAIL =
  /^[^\s@<>,;()[\]\\"]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

/** « v=DMARC1; p=none; rua=… » -> balises dans l'ordre, avec les doublons relevés. */
export function parseDmarcTags(text: unknown) {
  const tags: Record<string, string> = {};
  const order: string[] = [];
  const duplicates: string[] = [];
  const malformed: string[] = [];
  for (const part of String(text).split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const i = trimmed.indexOf('=');
    if (i < 1) {
      malformed.push(trimmed);
      continue;
    }
    const name = trimmed.slice(0, i).trim().toLowerCase();
    const value = trimmed.slice(i + 1).trim();
    if (name in tags) duplicates.push(name);
    tags[name] = value;
    order.push(name);
  }
  return { tags, order, duplicates, malformed };
}

/** Adresses de rapport « mailto:a@b.c!10m, mailto:… » -> [{ uri, address, domain, valid }] */
export interface ReportUri {
  uri: string;
  address: string | null;
  domain: string | null;
  valid: boolean;
}

export function parseReportUris(value: string): ReportUri[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((uri) => {
      const m = /^mailto:([^!]+)(?:!(\d+[kmgt]?))?$/i.exec(uri);
      const address = m?.[1] ?? null;
      const valid = Boolean(address && EMAIL.test(address));
      return {
        uri,
        address,
        domain: valid && address ? (address.split('@')[1] ?? '').toLowerCase() : null,
        valid,
      };
    });
}

/** Constats sur un enregistrement DMARC (sans requête DNS). */
export function analyzeDmarcRecord(text: string) {
  const { tags, order, duplicates, malformed } = parseDmarcTags(text);
  const findings: Finding[] = [];
  const f = (code: string, severity: Severity, params?: Finding['params']) =>
    findings.push(finding(code, severity, params));

  for (const part of malformed) f('dmarc.syntax', 'error', { part });
  if (order[0] !== 'v') f('dmarc.versionFirst', 'error');
  else if (tags.v !== 'DMARC1') f('dmarc.versionCase', 'warn', { value: tags.v });
  for (const name of new Set(duplicates)) f('dmarc.duplicateTag', 'error', { name });
  for (const name of order) if (!KNOWN_TAGS.has(name)) f('dmarc.unknownTag', 'info', { name });

  const policy = tags.p?.toLowerCase();
  if (policy === undefined) {
    if (tags.rua) f('dmarc.pMissing', 'warn');
    else f('dmarc.pMissing', 'error');
  } else if (!POLICIES.includes(policy)) {
    f('dmarc.pInvalid', 'error', { value: tags.p });
  } else if (policy === 'none') {
    f('dmarc.policyNone', 'warn');
  } else if (policy === 'quarantine') {
    f('dmarc.policyQuarantine', 'info');
  } else {
    f('dmarc.policyReject', 'ok');
  }

  if (tags.sp !== undefined) {
    const sp = tags.sp.toLowerCase();
    if (!POLICIES.includes(sp)) f('dmarc.spInvalid', 'error', { value: tags.sp });
    else if (sp === 'none' && policy && ['quarantine', 'reject'].includes(policy))
      f('dmarc.spWeaker', 'warn');
  }

  if (tags.pct !== undefined) {
    const n = Number(tags.pct);
    if (!/^\d+$/.test(tags.pct) || n > 100) f('dmarc.pctInvalid', 'error', { value: tags.pct });
    else if (n < 100 && policy && policy !== 'none') f('dmarc.pctPartial', 'warn', { value: n });
  }
  for (const name of ['adkim', 'aspf']) {
    if (tags[name] === undefined) continue;
    const v = tags[name].toLowerCase();
    if (!['r', 's'].includes(v))
      f(name === 'adkim' ? 'dmarc.adkimInvalid' : 'dmarc.aspfInvalid', 'error', {
        value: tags[name],
      });
    else if (v === 's') f('dmarc.strictAlignment', 'info', { tag: name });
  }
  if (
    tags.fo !== undefined &&
    !tags.fo.split(':').every((x) => ['0', '1', 'd', 's'].includes(x.toLowerCase()))
  )
    f('dmarc.foInvalid', 'error', { value: tags.fo });
  if (tags.ri !== undefined && !/^[1-9]\d*$/.test(tags.ri))
    f('dmarc.riInvalid', 'error', { value: tags.ri });
  if (tags.rf !== undefined && tags.rf.toLowerCase() !== 'afrf')
    f('dmarc.rfInvalid', 'error', { value: tags.rf });

  const reports: { rua: ReportUri[]; ruf: ReportUri[] } = { rua: [], ruf: [] };
  for (const tag of ['rua', 'ruf'] as const) {
    const value = tags[tag];
    if (value === undefined) continue;
    reports[tag] = parseReportUris(value);
    const seen = new Set<string>();
    for (const r of reports[tag]) {
      if (!r.valid) f('dmarc.uriInvalid', 'error', { tag, uri: r.uri });
      else if (r.address && seen.has(r.address.toLowerCase()))
        f('dmarc.duplicateUri', 'warn', { tag, uri: r.address });
      if (r.address) seen.add(r.address.toLowerCase());
    }
  }
  if (!tags.rua) f('dmarc.noRua', 'info');
  if (tags.ruf) f('dmarc.rufPrivacy', 'info');

  return { tags, order, policy, reports, findings };
}

/**
 * Cherche le DMARC applicable à `domain` : `_dmarc.<domaine>`, sinon `_dmarc.<domaine d'organisation>` (RFC 7489 §6.6.3).
 * `first` est la réponse déjà obtenue pour `_dmarc.<domaine>` ; les requêtes suivantes passent par `resolver`.
 */
export interface DmarcAnalysis {
  found: boolean;
  name: string;
  inherited?: boolean;
  records: { text: string; parts: string[]; ttl: number; name: string }[];
  parsed?: ReturnType<typeof analyzeDmarcRecord>;
  findings: Finding[];
  multiple: boolean;
  external?: { reportDomain: string; ok: boolean }[];
}

export async function analyzeDmarc({
  domain,
  first,
  resolver,
}: {
  domain: string;
  first: DnsResult;
  resolver: Resolver;
}): Promise<DmarcAnalysis> {
  const org = orgDomain(domain);
  let lookup = { name: `_dmarc.${domain}`, res: first };
  let inherited = false;
  const candidates = txtRecords(first).filter((t) => isDmarcRecord(t.text));

  if (candidates.length === 0 && org !== domain) {
    const res = await resolver.query(`_dmarc.${org}`, 'TXT');
    const orgCandidates = txtRecords(res).filter((t) => isDmarcRecord(t.text));
    if (orgCandidates.length) {
      lookup = { name: `_dmarc.${org}`, res };
      inherited = true;
      candidates.push(...orgCandidates);
    }
  }

  const policyDomain = inherited ? org : domain;
  if (candidates.length === 0) {
    return {
      found: false,
      name: lookup.name,
      records: txtRecords(first),
      findings: [finding('dmarc.missing', 'error', { domain })],
      multiple: false,
    };
  }

  const findings: Finding[] = [];
  if (inherited) findings.push(finding('dmarc.inherited', 'info', { domain, org }));
  if (candidates.length > 1)
    findings.push(finding('dmarc.multiple', 'error', { count: candidates.length }));

  const parsed = analyzeDmarcRecord(candidates[0]?.text ?? '');
  findings.push(...parsed.findings);

  // Un domaine qui reçoit les rapports d'un autre doit l'avoir autorisé : <domaine>._report._dmarc.<domaine destinataire>
  const external = new Set<string>();
  for (const r of [...parsed.reports.rua, ...parsed.reports.ruf])
    if (r.valid && r.domain && orgDomain(r.domain) !== orgDomain(policyDomain))
      external.add(r.domain);
  const authorizations = await Promise.all(
    [...external].map(async (reportDomain) => {
      const res = await resolver.query(`${policyDomain}._report._dmarc.${reportDomain}`, 'TXT');
      const ok = res.status === RCODE.NOERROR && txtRecords(res).some((t) => isDmarcRecord(t.text));
      return { reportDomain, ok };
    }),
  );
  for (const a of authorizations)
    findings.push(
      a.ok
        ? finding('dmarc.externalOk', 'ok', { domain: a.reportDomain })
        : finding('dmarc.externalNotAuthorized', 'error', { domain: a.reportDomain, policyDomain }),
    );

  return {
    found: true,
    name: lookup.name,
    inherited,
    records: candidates,
    parsed,
    findings,
    multiple: candidates.length > 1,
    external: authorizations,
  };
}
