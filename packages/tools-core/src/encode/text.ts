// Encodages de texte : Base64 (classique et URL-safe), URL, hexadécimal, entités HTML. Fonctions pures, UTF-8 partout.
const encoder = new TextEncoder();

export const toBytes = (text: string): Uint8Array<ArrayBuffer> => encoder.encode(text);

/** Octets -> texte UTF-8, ou null s'ils ne forment pas de l'UTF-8 valide (données binaires). */
export function bytesToText(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export const bytesToHex = (bytes: Uint8Array, separator = ''): string =>
  [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(separator);

// --- Base64 ---

export interface Base64Options {
  urlSafe?: boolean;
  padding?: boolean;
}

export function bytesToBase64(
  bytes: Uint8Array,
  { urlSafe = false, padding = true }: Base64Options = {},
): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  let out = btoa(binary);
  if (urlSafe) out = out.replace(/\+/g, '-').replace(/\//g, '_');
  return padding ? out : out.replace(/=+$/, '');
}

export const encodeBase64 = (text: string, options?: Base64Options): string =>
  bytesToBase64(toBytes(text), options);

/** Décode du Base64 ou du Base64 URL-safe (espaces, retours à la ligne et « = » manquants tolérés). */
export function decodeBase64(
  input: unknown,
):
  | { ok: true; bytes: Uint8Array<ArrayBuffer>; text: string | null; urlSafe: boolean }
  | { ok: false } {
  const cleaned = String(input).replace(/\s+/g, '');
  if (
    !cleaned ||
    !/^[A-Za-z0-9+/_-]*={0,2}$/.test(cleaned) ||
    (/[+/]/.test(cleaned) && /[-_]/.test(cleaned))
  )
    return { ok: false };
  const urlSafe = /[-_]/.test(cleaned);
  const normal = cleaned.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  if (normal.length % 4 === 1) return { ok: false };
  try {
    const binary = atob(normal + '='.repeat((4 - (normal.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return { ok: true, bytes, text: bytesToText(bytes), urlSafe };
  } catch {
    return { ok: false };
  }
}

// --- URL ---

export const encodeUrlComponent = (text: string): string => encodeURIComponent(text);
export const encodeUrlFull = (text: string): string => encodeURI(text);

/** Décodage d'un composant d'URL ; `plusAsSpace` traite « + » comme une espace (formulaires). */
export function decodeUrl(
  text: string,
  { plusAsSpace = false }: { plusAsSpace?: boolean } = {},
): { ok: true; text: string } | { ok: false } {
  try {
    return { ok: true, text: decodeURIComponent(plusAsSpace ? text.replace(/\+/g, ' ') : text) };
  } catch {
    return { ok: false };
  }
}

/** Décompose une URL en parties lisibles (protocole, hôte, chemin, paramètres, ancre). */
export interface ParsedUrl {
  ok: true;
  protocol: string;
  username: string;
  password: string;
  host: string;
  port: string;
  path: string;
  hash: string;
  params: [string, string][];
}

export function parseUrl(text: string): ParsedUrl | { ok: false } {
  try {
    const u = new URL(text.trim());
    return {
      ok: true,
      protocol: u.protocol,
      username: u.username,
      password: u.password,
      host: u.hostname,
      port: u.port,
      path: u.pathname,
      hash: u.hash,
      params: [...u.searchParams.entries()],
    };
  } catch {
    return { ok: false };
  }
}

// --- Hexadécimal ---

export const textToHex = (text: string, separator = ' '): string =>
  bytesToHex(toBytes(text), separator);

export function hexToBytes(input: unknown): Uint8Array<ArrayBuffer> | null {
  const cleaned = String(input)
    .replace(/0x/gi, '')
    .replace(/[\s:,-]+/g, '');
  if (!cleaned || cleaned.length % 2 !== 0 || /[^0-9a-f]/i.test(cleaned)) return null;
  return Uint8Array.from(cleaned.match(/../g) ?? [], (h) => parseInt(h, 16));
}

// --- Entités HTML ---

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
export const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);

const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  euro: '€',
  eacute: 'é',
  egrave: 'è',
  agrave: 'à',
  ccedil: 'ç',
  ecirc: 'ê',
  ocirc: 'ô',
  ucirc: 'û',
  icirc: 'î',
  laquo: '«',
  raquo: '»',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  deg: '°',
};

export function unescapeHtml(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (whole: string, entity: string) => {
    if (entity.startsWith('#')) {
      const code =
        entity.charAt(1).toLowerCase() === 'x'
          ? parseInt(entity.slice(2), 16)
          : Number(entity.slice(1));
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED[entity.toLowerCase()] ?? whole;
  });
}
