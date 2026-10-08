// Conversions d'unités informatiques : tailles de données (SI et binaires), débits, temps de transfert, bases numériques.
// Fonctions pures, sans DOM. Les tailles et débits sont des nombres à virgule flottante (15 chiffres significatifs, de quoi
// convertir jusqu'à l'exaoctet) ; les bases numériques passent par BigInt et n'ont donc pas de limite de précision.

export const MAX_VALUE = 1e21;

/** Unités de taille, exprimées en octets. SI : puissances de 1000 ; CEI (kiB, MiB…) : puissances de 1024. */
export interface DataUnit {
  id: string;
  bytes: number;
  family: 'bit' | 'SI' | 'IEC';
}
export interface RateUnit {
  id: string;
  bps: number;
}

export const DATA_UNITS: DataUnit[] = [
  { id: 'bit', bytes: 1 / 8, family: 'bit' },
  { id: 'B', bytes: 1, family: 'SI' },
  { id: 'kB', bytes: 1e3, family: 'SI' },
  { id: 'MB', bytes: 1e6, family: 'SI' },
  { id: 'GB', bytes: 1e9, family: 'SI' },
  { id: 'TB', bytes: 1e12, family: 'SI' },
  { id: 'PB', bytes: 1e15, family: 'SI' },
  { id: 'KiB', bytes: 1024, family: 'IEC' },
  { id: 'MiB', bytes: 1024 ** 2, family: 'IEC' },
  { id: 'GiB', bytes: 1024 ** 3, family: 'IEC' },
  { id: 'TiB', bytes: 1024 ** 4, family: 'IEC' },
  { id: 'PiB', bytes: 1024 ** 5, family: 'IEC' },
];

/** Unités de débit, exprimées en bits par seconde. */
export const RATE_UNITS: RateUnit[] = [
  { id: 'bit/s', bps: 1 },
  { id: 'kbit/s', bps: 1e3 },
  { id: 'Mbit/s', bps: 1e6 },
  { id: 'Gbit/s', bps: 1e9 },
  { id: 'Tbit/s', bps: 1e12 },
  { id: 'B/s', bps: 8 },
  { id: 'kB/s', bps: 8e3 },
  { id: 'MB/s', bps: 8e6 },
  { id: 'GB/s', bps: 8e9 },
  { id: 'MiB/s', bps: 8 * 1024 ** 2 },
  { id: 'GiB/s', bps: 8 * 1024 ** 3 },
];

function byId<T extends { id: string }>(list: T[], id: string): T {
  const unit = list.find((u) => u.id === id);
  if (!unit) throw new RangeError(`Unité inconnue : ${id}`);
  return unit;
}

/**
 * Lit un nombre saisi par un humain : virgule ou point décimal, espaces (y compris insécables) et soulignés ignorés.
 * Retourne { value } ou { error } parmi 'empty', 'invalid', 'negative', 'tooLarge'.
 */
export function parseNumber(
  text: unknown,
): { value: number } | { error: 'empty' | 'invalid' | 'negative' | 'tooLarge' } {
  const cleaned = String(text ?? '')
    .replace(/[\s  _]/g, '')
    .replace(',', '.');
  if (!cleaned) return { error: 'empty' };
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(cleaned)) return { error: 'invalid' };
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return { error: 'tooLarge' };
  if (value < 0) return { error: 'negative' };
  if (value > MAX_VALUE) return { error: 'tooLarge' };
  return { value };
}

/** Valeur dans toutes les unités de taille : [{ id, family, value }]. */
export function convertData(
  value: number,
  fromId: string,
): { id: string; family: DataUnit['family']; value: number }[] {
  const from = byId(DATA_UNITS, fromId);
  const bytes = value * from.bytes;
  return DATA_UNITS.map((u) => ({ id: u.id, family: u.family, value: bytes / u.bytes }));
}

/** Valeur dans toutes les unités de débit : [{ id, value }]. */
export function convertRate(value: number, fromId: string): { id: string; value: number }[] {
  const from = byId(RATE_UNITS, fromId);
  const bps = value * from.bps;
  return RATE_UNITS.map((u) => ({ id: u.id, value: bps / u.bps }));
}

export const toBytes = (value: number, unitId: string): number =>
  value * byId(DATA_UNITS, unitId).bytes;
export const toBitsPerSecond = (value: number, unitId: string): number =>
  value * byId(RATE_UNITS, unitId).bps;

/** Secondes nécessaires pour transférer `bytes` octets à `bps` bits/s, avec un rendement utile de `efficiency` % (1 à 100). */
export function transferSeconds(bytes: number, bps: number, efficiency = 100): number {
  const usable = bps * (efficiency / 100);
  return usable > 0 ? (bytes * 8) / usable : Infinity;
}

/** Décompose une durée en jours, heures, minutes, secondes (et millisecondes sous une seconde). */
export function durationParts(
  seconds: number,
): { days: number; hours: number; minutes: number; seconds: number; milliseconds: number } | null {
  if (!Number.isFinite(seconds)) return null;
  if (seconds < 1)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: Math.round(seconds * 1000) };
  const total = Math.round(seconds);
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    milliseconds: 0,
  };
}

/** Nombre sans notation exponentielle pour les valeurs courantes, 10 chiffres significatifs au plus. */
export function plain(value: number): string {
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e21 || abs < 1e-9) return value.toExponential(6);
  const rounded = Number(value.toPrecision(10));
  return rounded.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 });
}

// ---------------------------------------------------------------------------------------------------------------------------
// Bases numériques

export const BASES: Record<'bin' | 'oct' | 'dec' | 'hex', number> = {
  bin: 2,
  oct: 8,
  dec: 10,
  hex: 16,
};
export const MAX_DIGITS = 512;

const DIGITS = '0123456789abcdef';
const PREFIX: Record<number, number> = { 0x78: 16, 0x62: 2, 0x6f: 8 }; // x, b, o

/**
 * Lit un entier écrit dans `base` (2, 8, 10 ou 16). Accepte un signe, le préfixe 0x/0b/0o correspondant à la base, et des
 * séparateurs (espace, souligné). Retourne { value: BigInt } ou { error } parmi 'empty', 'invalid', 'tooLong'.
 */
export function parseInteger(
  text: unknown,
  base: number,
): { value: bigint } | { error: 'empty' | 'invalid' | 'tooLong' } {
  let s = String(text ?? '')
    .replace(/[\s  _]/g, '')
    .toLowerCase();
  if (!s) return { error: 'empty' };
  let negative = false;
  if (s.startsWith('-') || s.startsWith('+')) {
    negative = s.startsWith('-');
    s = s.slice(1);
  }
  if (s.startsWith('0') && PREFIX[s.charCodeAt(1)] === base) s = s.slice(2);
  if (!s) return { error: 'invalid' };
  if (s.length > MAX_DIGITS) return { error: 'tooLong' };
  const allowed = DIGITS.slice(0, base);
  for (const c of s) if (!allowed.includes(c)) return { error: 'invalid' };
  let value = 0n;
  const big = BigInt(base);
  for (const c of s) value = value * big + BigInt(DIGITS.indexOf(c));
  return { value: negative ? -value : value };
}

const group = (s: string, size: number): string =>
  s.replace(new RegExp(`\\B(?=(?:.{${size}})+$)`, 'g'), ' ');

/** Représentations d'un entier : décimal, hexadécimal (majuscules), binaire (groupé par 4), octal, et taille en bits. */
export function describeInteger(value: bigint) {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const sign = negative ? '-' : '';
  const bin = abs.toString(2);
  return {
    dec: sign + abs.toString(10),
    hex: sign + abs.toString(16).toUpperCase(),
    bin: sign + bin,
    binGrouped: sign + group(bin.padStart(Math.ceil(bin.length / 4) * 4, '0'), 4),
    oct: sign + abs.toString(8),
    bits: abs === 0n ? 1 : bin.length,
    negative,
  };
}
