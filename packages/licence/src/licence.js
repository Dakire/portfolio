// Vérification des licences grichard.eu, côté produit (extensions Chrome, Worker Cloudflare, Node) : ADR 0017, docs/licences.md.
// Sans dépendance : WebCrypto Ed25519 (Chrome 113+, Cloudflare Workers, Node 20+). Le jeton se vérifie HORS LIGNE avec la clé
// publique intégrée au produit ; l'API n'est appelée que pour le renouveler (abonnement prolongé, mises à jour étendues).
//
// Format : « GRL1.<charge utile base64url>.<signature Ed25519 base64url> », signature portant sur « GRL1.<charge utile> ».
// Charge utile : { v, kid, lic, prod, plan, iat, exp, upd } (secondes Unix ; exp et upd valent null quand il n'y a pas de limite).

const PREFIX = 'GRL1';
/** Renouveler le jeton quand l'échéance approche (3 jours), ou quand il a plus de 7 jours (révocations prises en compte). */
const REFRESH_BEFORE = 3 * 86400;
const REFRESH_AFTER = 7 * 86400;

const fromBase64Url = (text) => {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
};

const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

/**
 * @typedef {object} LicencePayload
 * @property {number} v
 * @property {string} kid
 * @property {string} lic
 * @property {string} prod
 * @property {string} plan
 * @property {number} iat
 * @property {number | null} exp
 * @property {number | null} upd
 */

/**
 * @typedef {object} LicenceCheck
 * @property {boolean} valid licence utilisable maintenant pour ce produit
 * @property {'ok' | 'format' | 'signature' | 'produit' | 'expiree'} reason
 * @property {LicencePayload | null} payload
 * @property {boolean} needsRefresh à renouveler auprès de l'API (sans bloquer l'usage tant que valid est vrai)
 */

/**
 * Vérifie un jeton de licence hors ligne.
 *
 * @param {string} token jeton « GRL1.… » (collé par l'utilisateur ou rendu par l'API)
 * @param {object} options
 * @param {string} options.publicKey clé publique Ed25519 en base64 (GET /espace/api/licence/cle-publique), intégrée au produit
 * @param {string} options.product identifiant du produit (ex. « youtube-regarder-plus-tard »)
 * @param {number} [options.now] secondes Unix (tests)
 * @returns {Promise<LicenceCheck>}
 */
export async function verifyLicence(
  token,
  { publicKey, product, now = Math.floor(Date.now() / 1000) },
) {
  const parts = String(token ?? '')
    .trim()
    .split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX) return result('format');
  let payload;
  let signature;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[1])));
    signature = fromBase64Url(parts[2]);
  } catch {
    return result('format');
  }
  if (!payload || typeof payload !== 'object' || payload.v !== 1) return result('format');

  const key = await crypto.subtle.importKey(
    'raw',
    fromBase64(publicKey),
    { name: 'Ed25519' },
    false,
    ['verify'],
  );
  const signed = new TextEncoder().encode(`${PREFIX}.${parts[1]}`);
  if (!(await crypto.subtle.verify({ name: 'Ed25519' }, key, signature, signed)))
    return result('signature');
  if (payload.prod !== product) return result('produit', payload);
  if (payload.exp !== null && payload.exp <= now) return result('expiree', payload, true);

  const needsRefresh =
    (payload.exp !== null && payload.exp - now < REFRESH_BEFORE) ||
    now - payload.iat > REFRESH_AFTER;
  return { valid: true, reason: 'ok', payload, needsRefresh };
}

/**
 * Le jeton donne-t-il droit à une version publiée à cette date ? (Mises à jour incluses jusqu'à `upd`.)
 *
 * @param {LicencePayload} payload
 * @param {number} publishedAt secondes Unix
 */
export function coversUpdate(payload, publishedAt) {
  return payload.upd === null || payload.upd >= publishedAt;
}

/**
 * Demande un nouveau jeton à l'API. Renvoie le nouveau jeton, `null` si la licence n'est plus valable (expirée, résiliée
 * au-delà de sa période, remboursée), et lève une erreur si le site est injoignable (garder alors l'ancien jeton).
 *
 * @param {string} token
 * @param {object} [options]
 * @param {string} [options.api] base de l'API
 * @param {typeof fetch} [options.fetch]
 * @returns {Promise<string | null>}
 */
export async function refreshLicence(
  token,
  { api = 'https://grichard.eu/espace/api', fetch: doFetch = fetch } = {},
) {
  const response = await doFetch(`${api}/licence/renouveler`, {
    method: 'POST',
    headers: { Authorization: `Licence ${token}` },
  });
  if (response.status === 401 || response.status === 410) return null;
  if (!response.ok) throw new Error(`API des licences : ${response.status}`);
  const body = await response.json();
  return typeof body.jeton === 'string' ? body.jeton : null;
}

/** @returns {LicenceCheck} */
function result(reason, payload = null, needsRefresh = false) {
  return { valid: false, reason, payload, needsRefresh };
}
