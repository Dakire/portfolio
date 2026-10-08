// Propagation DNS : le même nom est demandé en parallèle à plusieurs résolveurs publics indépendants (opérateurs et caches distincts),
// depuis le navigateur du visiteur (DNS-over-HTTPS, CORS ouvert). Les réponses sont comparées entre elles et, si on le demande,
// à une valeur attendue : c'est ce qui montre si un changement DNS a été vu partout, ou s'il reste des caches à l'ancienne valeur.
// Limite assumée : un navigateur ne peut pas interroger un serveur par pays ni lire le cache d'un résolveur précis ; chaque résolveur
// est un service « anycast » qui répond depuis son point de présence le plus proche de l'utilisateur.
// Fonctions pures et `fetch` injectable : tout est testé sans réseau (tests/unit/propagation.test.js).
import { parseTxtData, RCODE, stripDot, TYPE } from './resolver.js';
import { decodeResponse, encodeQuery, toBase64Url, type WireAnswer } from './wire.js';

export const PROPAGATION_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'CAA'] as const;
export type PropagationType = (typeof PROPAGATION_TYPES)[number];

export interface PropagationResolver {
  id: string;
  name: string;
  ip?: string;
  country: string;
  format: 'json' | 'wire';
  url: string;
}

export type ResolverState = 'answer' | 'empty' | 'nxdomain' | 'servfail' | 'refused' | 'error';
export interface ResolverResult {
  id: string;
  state: ResolverState;
  values: string[];
  ttl: number | null;
  ms: number;
}
export type Verdict =
  'pending' | 'propagated' | 'partial' | 'none' | 'consistent' | 'diverging' | 'unreachable';

interface RawResolverAnswer {
  status: number;
  answers: Pick<WireAnswer, 'type' | 'ttl' | 'data'>[];
}

interface FetchOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Résolveurs interrogés. `format` : 'json' (API JSON de Google/Cloudflare) ou 'wire' (RFC 8484, binaire).
 * `country` : pays de l'opérateur (code ISO). Seuls figurent des services dont les réponses sont lisibles depuis un navigateur
 * (en-tête CORS ouvert, vérifié) ; toute adresse ajoutée ici doit l'être aussi dans `connect-src` de public/.htaccess.
 */
export const PROPAGATION_RESOLVERS: PropagationResolver[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    ip: '1.1.1.1',
    country: 'US',
    format: 'json',
    url: 'https://cloudflare-dns.com/dns-query',
  },
  {
    id: 'google',
    name: 'Google',
    ip: '8.8.8.8',
    country: 'US',
    format: 'json',
    url: 'https://dns.google/resolve',
  },
  {
    id: 'quad9',
    name: 'Quad9',
    ip: '9.9.9.9',
    country: 'CH',
    format: 'wire',
    url: 'https://dns.quad9.net/dns-query',
  },
  {
    id: 'dnssb',
    name: 'DNS.SB',
    country: 'DE',
    format: 'json',
    url: 'https://doh.dns.sb/dns-query',
  },
  {
    id: 'dnsforge',
    name: 'DNSForge',
    country: 'DE',
    format: 'wire',
    url: 'https://dnsforge.de/dns-query',
  },
  {
    id: 'nic-cz',
    name: 'CZ.NIC ODVR',
    country: 'CZ',
    format: 'wire',
    url: 'https://odvr.nic.cz/doh',
  },
  {
    id: 'controld',
    name: 'Control D',
    country: 'CA',
    format: 'wire',
    url: 'https://freedns.controld.com/p0',
  },
  {
    id: 'iij',
    name: 'IIJ',
    country: 'JP',
    format: 'wire',
    url: 'https://public.dns.iij.jp/dns-query',
  },
  {
    id: 'alidns',
    name: 'AliDNS',
    ip: '223.5.5.5',
    country: 'CN',
    format: 'json',
    url: 'https://dns.alidns.com/resolve',
  },
];

/** Enregistrement -> texte comparable (hôtes sans point final et en minuscules, TXT concaténé). */
export function formatValue(type: string, data: unknown): string {
  const text = String(data ?? '').trim();
  switch (type) {
    case 'A':
    case 'AAAA':
      return text.toLowerCase();
    case 'NS':
    case 'CNAME':
      return stripDot(text);
    case 'MX': {
      const [preference = '', ...host] = text.split(/\s+/);
      return `${preference} ${stripDot(host.join(' '))}`;
    }
    case 'TXT':
      return parseTxtData(text).text;
    case 'SOA': {
      const [primary = '', hostmaster = '', ...numbers] = text.split(/\s+/);
      return [stripDot(primary), stripDot(hostmaster), ...numbers].join(' ');
    }
    default:
      return text;
  }
}

async function fetchRaw(
  resolver: PropagationResolver,
  name: string,
  code: number,
  { fetchImpl, signal }: { fetchImpl: typeof fetch; signal: AbortSignal },
): Promise<RawResolverAnswer> {
  if (resolver.format === 'wire') {
    const response = await fetchImpl(
      `${resolver.url}?dns=${toBase64Url(encodeQuery(name, code))}`,
      { headers: { accept: 'application/dns-message' }, signal },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return decodeResponse(new Uint8Array(await response.arrayBuffer()));
  }
  const response = await fetchImpl(
    `${resolver.url}?name=${encodeURIComponent(name)}&type=${code}`,
    { headers: { accept: 'application/dns-json' }, signal },
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = (await response.json()) as {
    Status: number;
    Answer?: { type: number; TTL: number; data?: unknown }[];
  };
  return {
    status: json.Status,
    answers: (json.Answer ?? []).map((a) => ({
      type: a.type,
      ttl: a.TTL,
      data: String(a.data ?? ''),
    })),
  };
}

const STATES: Record<number, ResolverState> = {
  [RCODE.NXDOMAIN]: 'nxdomain',
  [RCODE.SERVFAIL]: 'servfail',
  [RCODE.REFUSED]: 'refused',
};

/**
 * Interroge un résolveur. Ne lève jamais d'erreur réseau (elle devient `state: 'error'`), sauf si `signal` a annulé l'opération.
 * @returns {Promise<{ id: string, state: 'answer'|'empty'|'nxdomain'|'servfail'|'refused'|'error', values: string[], ttl: number|null, ms: number }>}
 */
export async function queryResolver(
  resolver: PropagationResolver,
  name: string,
  type: PropagationType,
  { fetchImpl = globalThis.fetch?.bind(globalThis), timeoutMs = 6000, signal }: FetchOptions = {},
): Promise<ResolverResult> {
  const started = performance.now();
  const done = (
    state: ResolverState,
    values: string[] = [],
    ttl: number | null = null,
  ): ResolverResult => ({
    id: resolver.id,
    state,
    values,
    ttl,
    ms: Math.round(performance.now() - started),
  });
  try {
    const signals = [AbortSignal.timeout(timeoutMs), signal].filter((s): s is AbortSignal =>
      Boolean(s),
    );
    const raw = await fetchRaw(resolver, name, TYPE[type], {
      fetchImpl,
      signal: AbortSignal.any(signals),
    });
    if (raw.status !== RCODE.NOERROR) return done(STATES[raw.status] ?? 'error');
    const records = raw.answers.filter((a) => a.type === TYPE[type]);
    if (records.length === 0) return done('empty');
    const values = [...new Set(records.map((a) => formatValue(type, a.data)))].sort();
    return done('answer', values, Math.min(...records.map((a) => a.ttl)));
  } catch (error) {
    if (signal?.aborted) throw error;
    return done('error');
  }
}

/** Valeur saisie par l'utilisateur -> forme comparable à `formatValue` (guillemets d'un TXT retirés, hôtes en minuscules sans point final). */
export function normalizeExpected(type: string, input: unknown): string {
  const text = String(input ?? '').trim();
  if (!text) return '';
  if (type === 'TXT') return parseTxtData(text).text;
  if (type === 'MX') return /^\d+\s/.test(text) ? formatValue('MX', text) : stripDot(text); // la priorité est facultative
  return formatValue(type, text);
}

/** La valeur attendue figure-t-elle dans les réponses ? (TXT : contenue dans l'un des enregistrements ; MX : la priorité est facultative.) */
export function matchesExpected(type: string, values: string[], expected: string): boolean | null {
  if (!expected) return null;
  return values.some((value) => {
    if (type === 'TXT') return value.includes(expected);
    if (type === 'MX' && !/^\d+\s/.test(expected))
      return value.split(' ').slice(1).join(' ') === expected;
    return value === expected;
  });
}

/**
 * Compare les réponses. `results` peut être partiel (analyse en cours) : un résolveur sans résultat est « en attente ».
 * Verdicts : 'pending', 'propagated' (tous les résolveurs qui répondent ont la valeur attendue), 'partial', 'none' (aucun ne l'a),
 * 'consistent' (même réponse partout, sans valeur attendue), 'diverging' (réponses différentes), 'unreachable' (aucune réponse exploitable).
 */
export interface PropagationRow {
  resolver: PropagationResolver;
  state: ResolverState | 'pending';
  values: string[];
  ttl: number | null;
  ms: number | null;
  match: boolean | null;
}

export function summarize(
  resolvers: PropagationResolver[],
  results: ResolverResult[],
  type: string,
  expectedInput = '',
) {
  const expected = normalizeExpected(type, expectedInput);
  const byId = new Map(results.map((r) => [r.id, r]));
  const rows = resolvers.map((resolver): PropagationRow => {
    const result = byId.get(resolver.id);
    if (!result)
      return { resolver, state: 'pending', values: [], ttl: null, ms: null, match: null };
    const reachable =
      result.state !== 'error' && result.state !== 'servfail' && result.state !== 'refused';
    return {
      resolver,
      ...result,
      match: reachable ? matchesExpected(type, result.values, expected) : null,
    };
  });

  const pending = rows.filter((r) => r.state === 'pending').length;
  const usable = rows.filter(
    (r) => r.state === 'answer' || r.state === 'empty' || r.state === 'nxdomain',
  );
  const failed = rows.filter(
    (r) => r.state === 'error' || r.state === 'servfail' || r.state === 'refused',
  ).length;

  const groups = new Map<string, { state: string; values: string[]; ids: string[] }>();
  for (const row of usable) {
    const key = `${row.state}|${row.values.join('\n')}`;
    if (!groups.has(key)) groups.set(key, { state: row.state, values: row.values, ids: [] });
    groups.get(key)?.ids.push(row.resolver.id);
  }
  const ranked = [...groups.values()].sort((a, b) => b.ids.length - a.ids.length);
  const majority = ranked[0]?.ids ?? [];
  const matches = rows.filter((r) => r.match === true).length;

  let verdict: Verdict = 'pending';
  if (pending === 0) {
    if (usable.length === 0) verdict = 'unreachable';
    else if (expected)
      verdict = matches === usable.length ? 'propagated' : matches === 0 ? 'none' : 'partial';
    else verdict = ranked.length === 1 ? 'consistent' : 'diverging';
  }

  return {
    rows: rows.map((row) => ({ ...row, inMajority: majority.includes(row.resolver.id) })),
    verdict,
    counts: {
      total: rows.length,
      pending,
      failed,
      usable: usable.length,
      matches,
      agree: majority.length,
      groups: ranked.length,
    },
    expected,
  };
}

/**
 * Interroge tous les résolveurs en parallèle. `onResult(result)` est appelé à chaque réponse (affichage progressif).
 * @returns {Promise<Array>} les résultats, dans l'ordre des résolveurs
 */
export function checkPropagation({
  domain,
  type,
  resolvers = PROPAGATION_RESOLVERS,
  onResult,
  ...options
}: {
  domain: string;
  type: PropagationType;
  resolvers?: PropagationResolver[];
  onResult?: (result: ResolverResult) => void;
} & FetchOptions): Promise<ResolverResult[]> {
  return Promise.all(
    resolvers.map(async (resolver) => {
      const result = await queryResolver(resolver, domain, type, options);
      onResult?.(result);
      return result;
    }),
  );
}
