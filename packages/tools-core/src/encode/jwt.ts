// Lecture d'un JWT (JSON Web Token) : en-tête, charge utile et dates. La signature n'est JAMAIS vérifiée ici
// (il faudrait la clé) : décoder n'est pas valider.
import { bytesToText, decodeBase64 } from './text.js';

const CLAIMS: Record<string, string> = {
  iss: 'issuer',
  sub: 'subject',
  aud: 'audience',
  exp: 'expiration',
  nbf: 'notBefore',
  iat: 'issuedAt',
  jti: 'id',
};
const TIME_CLAIMS = new Set(['exp', 'nbf', 'iat']);

const decodePart = (part: string | undefined): Record<string, unknown> | null => {
  if (part === undefined) return null;
  const decoded = decodeBase64(part);
  if (!decoded.ok) return null;
  const text = bytesToText(decoded.bytes);
  if (text === null) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export interface JwtClaim {
  name: string;
  label: string | null;
  value: unknown;
  time: Date | null;
}
export type JwtResult =
  | { ok: false; error: 'format' | 'header' | 'payload' }
  | {
      ok: true;
      header: Record<string, unknown>;
      payload: Record<string, unknown>;
      signature: string;
      claims: JwtClaim[];
      status: 'expired' | 'notYetValid' | 'valid' | 'noExpiry';
      alg: string;
      unsigned: boolean;
    };

export function decodeJwt(token: unknown, now = Date.now()): JwtResult {
  const parts = String(token)
    .trim()
    .replace(/^bearer\s+/i, '')
    .split('.');
  if (parts.length !== 3 && parts.length !== 2) return { ok: false, error: 'format' };
  const header = decodePart(parts[0]);
  if (!header || typeof header !== 'object') return { ok: false, error: 'header' };
  const payload = decodePart(parts[1]);
  if (!payload || typeof payload !== 'object') return { ok: false, error: 'payload' };

  const claims = Object.entries(payload).map(([name, value]) => {
    const isTime = TIME_CLAIMS.has(name) && typeof value === 'number';
    return {
      name,
      label: CLAIMS[name] ?? null,
      value,
      time: isTime ? new Date((value as number) * 1000) : null,
    };
  });

  const seconds = now / 1000;
  const status =
    typeof payload.exp !== 'number'
      ? 'noExpiry'
      : payload.exp < seconds
        ? 'expired'
        : typeof payload.nbf === 'number' && payload.nbf > seconds
          ? 'notYetValid'
          : 'valid';
  return {
    ok: true,
    header,
    payload,
    signature: parts[2] ?? '',
    claims,
    status,
    alg: String(header.alg ?? ''),
    unsigned: !parts[2] || String(header.alg).toLowerCase() === 'none',
  };
}
