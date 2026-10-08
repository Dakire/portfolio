// Orchestrateur : interroge le DNS (en parallèle, avec progression), lance chaque analyse et assemble le rapport.
import { analyzeDkim } from './dkim.js';
import { analyzeDmarc } from './dmarc.js';
import { analyzeBimi, analyzeMtaSts, analyzeTlsRpt } from './extras.js';
import { countBySeverity, finding, worst, type Finding, type Severity } from './findings.js';
import { analyzeMx, parseMx } from './mx.js';
import { detectProviders, guessSelectors } from './providers.js';
import { analyzeAddresses, analyzeCaa, analyzeDnssec, analyzeNs, analyzeSoa } from './records.js';
import {
  parseTxtData,
  RCODE,
  recordsOf,
  txtRecords,
  type DnsResult,
  type Resolver,
} from './resolver.js';
import { analyzeSpf } from './spf.js';
import { analyzeTxt } from './txt.js';

// Constats qui signalent un doublon : regroupés dans une section « Doublons » du rapport
export const DUPLICATE_CODES = new Set([
  'spf.multiple',
  'spf.includeMultiple',
  'spf.duplicateTerm',
  'spf.duplicateInclude',
  'spf.duplicateModifier',
  'dkim.multipleAtSelector',
  'dkim.sameKey',
  'dkim.duplicateTag',
  'dmarc.multiple',
  'dmarc.duplicateTag',
  'dmarc.duplicateUri',
  'mx.duplicateHost',
  'txt.duplicate',
  'addr.duplicate',
  'ns.duplicate',
]);

/** Libellés des étapes, dans l'ordre d'affichage de la progression. */
export const STEPS = [
  'addresses',
  'mx',
  'txt',
  'ns',
  'soa',
  'caa',
  'dnssec',
  'dmarc',
  'mtasts',
  'tlsrpt',
  'bimi',
  'spf',
  'mxhosts',
  'dkim',
];

/** Enregistrement affichable dans le rapport (valeur en texte). */
export interface ReportRecord {
  name: string;
  type: string;
  ttl: number | undefined;
  value: string;
}

/** Une vérification du rapport : `data` est le résultat détaillé de l'analyse correspondante (voir les modules spf, dkim, dmarc, mx…). */
export interface Check {
  id: string;
  status: Severity;
  findings: Finding[];
  data?: unknown;
  records: ReportRecord[];
}

export interface DomainReport {
  domain: string;
  tookMs: number;
  queries: number;
  exists: boolean;
  checks: Check[];
  findings: (Finding & { check?: string })[];
  counts: Record<Severity, number>;
  duplicates: (Finding & { check?: string })[];
  providers: string[];
  dkimTested?: number;
  hasMail?: boolean;
}

const raw = (res: DnsResult, types: number[]): ReportRecord[] =>
  res.answers
    .filter((a) => types.includes(a.type))
    .map((a) => ({
      name: a.name,
      type: typeName(a.type),
      ttl: a.ttl,
      value: a.type === 16 ? parseTxtData(a.data).text : a.data,
    }));
const TYPE_NAMES: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  6: 'SOA',
  15: 'MX',
  16: 'TXT',
  28: 'AAAA',
  43: 'DS',
  257: 'CAA',
};
const typeName = (code: number): string => TYPE_NAMES[code] ?? String(code);

/**
 * @param {object} o
 * @param {string} o.domain      domaine ASCII déjà validé (voir domain.js)
 * @param {string[]} [o.selectors]  sélecteurs DKIM nommés par l'utilisateur ; vide = les deviner
 * @param {{ query: Function, stats: { queries: number } }} o.resolver
 * @param {(event: { id: string, state: 'start' | 'done' }) => void} [o.onProgress]
 */
export interface ProgressEvent {
  id: string;
  state: 'start' | 'done';
}

export async function analyzeDomain({
  domain,
  selectors = [],
  resolver,
  onProgress = () => {},
  now = () => Date.now(),
}: {
  domain: string;
  /** Sélecteurs DKIM nommés par l'utilisateur ; vide = les deviner. */
  selectors?: string[];
  resolver: Resolver;
  onProgress?: (event: ProgressEvent) => void;
  now?: () => number;
}): Promise<DomainReport> {
  const started = now();
  const track = <T>(id: string, promise: Promise<T>): Promise<T> => {
    onProgress({ id, state: 'start' });
    return promise.then((value) => {
      onProgress({ id, state: 'done' });
      return value;
    });
  };
  const q = (name: string, type: 'A' | 'AAAA' | 'MX' | 'TXT' | 'NS' | 'SOA' | 'CAA' | 'DS') =>
    resolver.query(name, type);

  // Phase 1 : toutes les interrogations indépendantes en même temps
  const [
    aRes,
    aaaaRes,
    mxRes,
    txtRes,
    nsRes,
    soaRes,
    caaRes,
    dsRes,
    dmarcRes,
    stsRes,
    tlsRes,
    bimiRes,
  ] = await Promise.all([
    track('addresses', q(domain, 'A')),
    q(domain, 'AAAA'),
    track('mx', q(domain, 'MX')),
    track('txt', q(domain, 'TXT')),
    track('ns', q(domain, 'NS')),
    track('soa', q(domain, 'SOA')),
    track('caa', q(domain, 'CAA')),
    track('dnssec', q(domain, 'DS')),
    track('dmarc', q(`_dmarc.${domain}`, 'TXT')),
    track('mtasts', q(`_mta-sts.${domain}`, 'TXT')),
    track('tlsrpt', q(`_smtp._tls.${domain}`, 'TXT')),
    track('bimi', q(`default._bimi.${domain}`, 'TXT')),
  ]);

  const exists = [aRes, nsRes, soaRes, mxRes, txtRes].some(
    (r) => r.status === RCODE.NOERROR && r.answers.length > 0,
  );
  if (!exists && aRes.status === RCODE.NXDOMAIN) {
    const findings = [finding('domain.nxdomain', 'error', { domain })];
    return {
      domain,
      tookMs: now() - started,
      queries: resolver.stats.queries,
      checks: [{ id: 'domain', status: 'error', findings, records: [] }],
      findings,
      counts: countBySeverity(findings),
      duplicates: [],
      providers: [],
      exists: false,
    };
  }

  const txt = txtRecords(txtRes);
  const mxParsed = recordsOf(mxRes, 'MX');
  const hasMail = mxParsed.map((a) => parseMx(a.data)).some((m) => m && m.host !== '.');

  // Phase 2 : analyses qui interrogent davantage (alias MX, include SPF, autorisations DMARC externes)
  const [mx, spf, dmarc] = await Promise.all([
    track('mxhosts', analyzeMx({ domain, mxAnswers: mxParsed, resolver })),
    track('spf', analyzeSpf({ domain, texts: txt.map((t) => t.text), resolver })),
    analyzeDmarc({ domain, first: dmarcRes, resolver }),
  ]);
  if (!spf.record && !hasMail) {
    // Domaine sans messagerie : l'absence de SPF est un conseil, pas un défaut
    const missing = spf.findings.find((f) => f.code === 'spf.missing');
    if (missing) {
      missing.code = 'spf.missingNoMail';
      missing.severity = 'info';
    }
  }

  // Phase 3 : DKIM, dont les sélecteurs à essayer dépendent du fournisseur reconnu
  const providers = detectProviders({
    mxHosts: mx.hosts.map((h) => h.host),
    spfIncludes: spf.includes,
  });
  const explicit = selectors.length > 0;
  const toTest = explicit
    ? selectors.map((selector) => ({ selector, provider: null }))
    : guessSelectors(providers);
  const dkim = await track('dkim', analyzeDkim({ domain, selectors: toTest, explicit, resolver }));

  const addresses = analyzeAddresses({ aRes, aaaaRes });
  const ns = analyzeNs({ nsRes });
  const soa = analyzeSoa({ soaRes });
  const caa = analyzeCaa({ caaRes });
  const dnssec = analyzeDnssec({ dsRes, aRes });
  const txtAnalysis = analyzeTxt({ records: txt });
  const mtasts = analyzeMtaSts({ res: stsRes });
  const tlsrpt = analyzeTlsRpt({ res: tlsRes });
  const bimi = analyzeBimi({ res: bimiRes, dmarc });

  // Statut d'une vérification : l'erreur ou l'avertissement le plus grave l'emporte ; sinon « conforme » dès qu'un constat l'est,
  // les simples informations (fournisseur détecté, option non configurée) ne dégradent pas un résultat conforme.
  const statusOf = (findings: Finding[]): Severity => {
    const w = worst(findings);
    return w === 'info' && findings.some((f) => f.severity === 'ok') ? 'ok' : w;
  };
  const check = (
    id: string,
    findings: Finding[],
    extra: { data?: unknown; records: ReportRecord[] },
  ): Check => ({ id, status: statusOf(findings), findings, ...extra });
  const checks = [
    check('addresses', addresses.findings, {
      data: addresses,
      records: [...raw(aRes, [1, 5]), ...raw(aaaaRes, [28])],
    }),
    check('mx', mx.findings, { data: mx, records: raw(mxRes, [15]) }),
    check('spf', spf.findings, {
      data: spf,
      records: txt
        .filter((t) => /^v=spf1(\s|$)/i.test(t.text.trim()))
        .map((t) => ({ name: domain, type: 'TXT', ttl: t.ttl, value: t.text })),
    }),
    check('dkim', dkim.findings, {
      data: dkim,
      records: dkim.found.flatMap((r) =>
        r.records.map((t) => ({ name: r.name, type: 'TXT', ttl: t.ttl, value: t.text })),
      ),
    }),
    check('dmarc', dmarc.findings, {
      data: dmarc,
      records: (dmarc.records ?? []).map((t) => ({
        name: dmarc.name,
        type: 'TXT',
        ttl: t.ttl,
        value: t.text,
      })),
    }),
    check('txt', txtAnalysis.findings, { data: txtAnalysis, records: raw(txtRes, [16]) }),
    check('ns', ns.findings, { data: ns, records: raw(nsRes, [2]) }),
    check('soa', soa.findings, { data: soa, records: raw(soaRes, [6]) }),
    check('caa', caa.findings, { data: caa, records: raw(caaRes, [257]) }),
    check('dnssec', dnssec.findings, { data: dnssec, records: raw(dsRes, [43]) }),
    check('mtasts', mtasts.findings, {
      data: mtasts,
      records: mtasts.records.map((t) => ({
        name: `_mta-sts.${domain}`,
        type: 'TXT',
        ttl: t.ttl,
        value: t.text,
      })),
    }),
    check('tlsrpt', tlsrpt.findings, {
      data: tlsrpt,
      records: tlsrpt.records.map((t) => ({
        name: `_smtp._tls.${domain}`,
        type: 'TXT',
        ttl: t.ttl,
        value: t.text,
      })),
    }),
    check('bimi', bimi.findings, {
      data: bimi,
      records: bimi.records.map((t) => ({
        name: `default._bimi.${domain}`,
        type: 'TXT',
        ttl: t.ttl,
        value: t.text,
      })),
    }),
  ];

  const findings = checks.flatMap((c) => c.findings.map((f) => ({ ...f, check: c.id })));
  const duplicates = findings.filter((f) => DUPLICATE_CODES.has(f.code));
  return {
    domain,
    tookMs: now() - started,
    queries: resolver.stats.queries,
    exists: true,
    checks,
    findings,
    counts: countBySeverity(findings),
    duplicates,
    providers: providers.map((p) => p.name),
    dkimTested: toTest.length,
    hasMail,
  };
}
