// Résolveur DNS-over-HTTPS (format JSON) : Cloudflare en premier, Google en secours. Les requêtes partent du navigateur
// du visiteur vers ces résolveurs publics (CORS ouvert) : le site n'héberge aucun relais DNS.
// `fetch` est injectable, ce qui permet de tester toutes les analyses sans réseau.

export const TYPE = { A: 1, NS: 2, CNAME: 5, SOA: 6, PTR: 12, MX: 15, TXT: 16, AAAA: 28, DS: 43, CAA: 257 };
export const RCODE = { NOERROR: 0, SERVFAIL: 2, NXDOMAIN: 3, REFUSED: 5 };

export const ENDPOINTS = [
  { name: 'Cloudflare', url: 'https://cloudflare-dns.com/dns-query' },
  { name: 'Google', url: 'https://dns.google/resolve' },
];

export const stripDot = (s) => String(s).replace(/\.$/, '').toLowerCase();

/** « "abc" "def" » ou « abc » -> { text: 'abcdef', parts: ['abc', 'def'] } (les chaînes d'un TXT se concatènent sans séparateur). */
export function parseTxtData(data) {
  const s = String(data ?? '').trim();
  if (!s.startsWith('"')) return { text: s, parts: [s] };
  const parts = [...s.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) =>
    m[1].replace(/\\(\d{3})/g, (_, d) => String.fromCharCode(Number(d))).replace(/\\(.)/g, '$1'),
  );
  return { text: parts.join(''), parts };
}

const normalize = (raw, name, qtype, endpoint) => ({
  name,
  qtype,
  status: raw.Status,
  ad: Boolean(raw.AD),
  endpoint,
  answers: (raw.Answer ?? []).map((a) => ({ name: stripDot(a.name), type: a.type, ttl: a.TTL, data: String(a.data ?? '') })),
  authority: (raw.Authority ?? []).map((a) => ({ name: stripDot(a.name), type: a.type, ttl: a.TTL, data: String(a.data ?? '') })),
});

export class DnsUnavailableError extends Error {
  constructor(cause) {
    super('Aucun résolveur DNS public joignable');
    this.name = 'DnsUnavailableError';
    this.cause = cause;
  }
}

/**
 * @param {object} [options]
 * @param {typeof fetch} [options.fetchImpl]
 * @param {number} [options.timeoutMs]
 * @param {AbortSignal} [options.signal]  annule toutes les requêtes en cours
 */
export function createResolver({ fetchImpl = globalThis.fetch?.bind(globalThis), timeoutMs = 6000, signal, endpoints = ENDPOINTS } = {}) {
  const cache = new Map();
  const stats = { queries: 0 };

  async function ask(endpoint, name, type) {
    const url = `${endpoint.url}?name=${encodeURIComponent(name)}&type=${type}&do=1`;
    const signals = [AbortSignal.timeout(timeoutMs), signal].filter(Boolean);
    const res = await fetchImpl(url, { headers: { accept: 'application/dns-json' }, signal: AbortSignal.any(signals) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return normalize(await res.json(), name, type, endpoint.name);
  }

  async function run(name, type) {
    let lastError;
    let servfail;
    for (const endpoint of endpoints) {
      try {
        const result = await ask(endpoint, name, type);
        if (result.status !== RCODE.SERVFAIL) return result;
        servfail = servfail ?? result; // SERVFAIL : on demande à l'autre résolveur avant de conclure
      } catch (error) {
        if (signal?.aborted) throw error;
        lastError = error;
      }
    }
    if (servfail) return servfail;
    throw new DnsUnavailableError(lastError);
  }

  return {
    stats,
    /** Interroge `name` pour le type `type` (nom ou code). Les réponses identiques sont mises en cache pendant l'analyse. */
    query(name, type) {
      const code = typeof type === 'number' ? type : TYPE[type];
      const key = `${stripDot(name)}|${code}`;
      if (!cache.has(key)) {
        stats.queries += 1;
        cache.set(key, run(stripDot(name), code));
      }
      return cache.get(key);
    },
  };
}

// --- Aides de lecture des réponses ---

/** Enregistrements d'un type donné qui répondent au nom demandé (en suivant les alias CNAME). */
export const recordsOf = (result, type) => result.answers.filter((a) => a.type === (typeof type === 'number' ? type : TYPE[type]));

/** Chaîne d'alias CNAME traversée pour répondre (nom -> cible), dans l'ordre. */
export const cnameChain = (result) => recordsOf(result, 'CNAME').map((a) => ({ from: a.name, to: stripDot(a.data) }));

/** Valeurs TXT d'une réponse : { text, parts, ttl, name }. */
export const txtRecords = (result) => recordsOf(result, 'TXT').map((a) => ({ ...parseTxtData(a.data), ttl: a.ttl, name: a.name }));

export const exists = (result) => result.status === RCODE.NOERROR && result.answers.length > 0;

/** Exécute `fn` sur chaque élément, `limit` à la fois (évite de saturer les résolveurs publics). */
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    }),
  );
  return results;
}
