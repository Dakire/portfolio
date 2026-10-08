// Horodatages et identifiants : conversion epoch <-> date lisible, UUID v4 et v7.

/**
 * Interprète une saisie : nombre (secondes, millisecondes, microsecondes ou nanosecondes d'après sa taille) ou date (ISO 8601, RFC 2822…).
 * @returns {{ ok: true, ms: number, unit: 's'|'ms'|'us'|'ns'|'date' } | { ok: false }}
 */
export type TimestampUnit = 's' | 'ms' | 'us' | 'ns' | 'date';

export function parseTimestamp(
  input: unknown,
): { ok: true; ms: number; unit: TimestampUnit } | { ok: false } {
  const text = String(input).trim();
  if (!text) return { ok: false };
  if (/^-?\d+(\.\d+)?$/.test(text)) {
    const n = Number(text);
    const abs = Math.abs(n);
    const [ms, unit]: [number, TimestampUnit] =
      abs < 1e11
        ? [n * 1000, 's']
        : abs < 1e14
          ? [n, 'ms']
          : abs < 1e17
            ? [n / 1000, 'us']
            : [n / 1e6, 'ns'];
    return Number.isFinite(ms) && Math.abs(ms) < 8.64e15
      ? { ok: true, ms: Math.round(ms), unit }
      : { ok: false };
  }
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? { ok: false } : { ok: true, ms: parsed, unit: 'date' };
}

/** Représentations d'un instant : epoch, ISO, UTC, heure locale et durée relative. */
export function describeInstant(
  ms: number,
  { locale = 'fr-FR', now = Date.now() }: { locale?: string; now?: number } = {},
) {
  const date = new Date(ms);
  const diff = Math.round((ms - now) / 1000);
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ];
  const [unit, size] =
    units.find(([, s]) => abs >= s) ?? (units.at(-1) as [Intl.RelativeTimeFormatUnit, number]);
  return {
    seconds: Math.floor(ms / 1000),
    milliseconds: ms,
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(locale, { dateStyle: 'full', timeStyle: 'long' }),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    relative: new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
      Math.trunc(diff / size),
      unit,
    ),
  };
}

const hex = (bytes: Uint8Array): string[] => [...bytes].map((b) => b.toString(16).padStart(2, '0'));

export const uuidV4 = (): string => crypto.randomUUID();

/** UUID v7 (RFC 9562) : 48 bits d'horodatage en ms, puis aléa ; triables dans l'ordre de création. */
export function uuidV7(ms = Date.now()): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const time = BigInt(ms);
  for (let i = 0; i < 6; i += 1) bytes[i] = Number((time >> BigInt((5 - i) * 8)) & 0xffn);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const h = hex(bytes);
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10).join('')}`;
}

/** Version et validité d'un UUID saisi ; pour la v7, la date incorporée. */
export function inspectUuid(text: string):
  | { ok: false }
  | {
      ok: true;
      version: number;
      variant: 'rfc4122' | 'other';
      canonical: string;
      ms: number | null;
    } {
  const m = /^([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{12})$/i.exec(
    text.trim(),
  );
  if (!m) return { ok: false };
  const version = parseInt((m[3] ?? '').charAt(0), 16);
  const variant = parseInt((m[4] ?? '').charAt(0), 16) >= 8 ? 'rfc4122' : 'other';
  return {
    ok: true,
    version,
    variant,
    canonical: m.slice(1).join('-').toLowerCase(),
    ms: version === 7 ? parseInt((m[1] ?? '') + (m[2] ?? ''), 16) : null,
  };
}
