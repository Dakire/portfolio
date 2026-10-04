// Dates iCalendar : analyse des valeurs (date, date-heure UTC, flottante ou avec fuseau), conversion en instant UTC,
// durées. Les fuseaux IANA passent par Intl ; les noms Windows (Outlook) et les VTIMEZONE sont rattachés à un fuseau IANA.
import { param, prop, propValue } from './parse.js';

const WINDOWS_ZONES = {
  'romance standard time': 'Europe/Paris',
  'w. europe standard time': 'Europe/Berlin',
  'central europe standard time': 'Europe/Budapest',
  'central european standard time': 'Europe/Warsaw',
  'gmt standard time': 'Europe/London',
  'greenwich standard time': 'Atlantic/Reykjavik',
  'e. europe standard time': 'Europe/Chisinau',
  'fle standard time': 'Europe/Kiev',
  'gtb standard time': 'Europe/Bucharest',
  'russian standard time': 'Europe/Moscow',
  'turkey standard time': 'Europe/Istanbul',
  'eastern standard time': 'America/New_York',
  'central standard time': 'America/Chicago',
  'mountain standard time': 'America/Denver',
  'pacific standard time': 'America/Los_Angeles',
  'atlantic standard time': 'America/Halifax',
  'e. south america standard time': 'America/Sao_Paulo',
  'india standard time': 'Asia/Kolkata',
  'china standard time': 'Asia/Shanghai',
  'tokyo standard time': 'Asia/Tokyo',
  'singapore standard time': 'Asia/Singapore',
  'aus eastern standard time': 'Australia/Sydney',
  'new zealand standard time': 'Pacific/Auckland',
  'south africa standard time': 'Africa/Johannesburg',
  'arabian standard time': 'Asia/Dubai',
  utc: 'UTC',
  'coordinated universal time': 'UTC',
};

const formatters = new Map();
const validZone = new Map();

/** Fuseau IANA reconnu par Intl pour un identifiant TZID (préfixes « /mozilla.org/… » et noms Windows compris), ou null. */
export function resolveZone(tzid, timezoneComponents = []) {
  if (!tzid) return null;
  if (validZone.has(tzid)) return validZone.get(tzid);
  const candidates = [tzid, tzid.split('/').slice(-2).join('/'), tzid.split('/').slice(-1)[0], WINDOWS_ZONES[tzid.toLowerCase()]];
  const vtimezone = timezoneComponents.find((z) => propValue(z, 'TZID') === tzid);
  if (vtimezone) candidates.push(propValue(vtimezone, 'X-LIC-LOCATION'));
  let found = null;
  for (const c of candidates.filter(Boolean)) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: c });
      found = c;
      break;
    } catch {
      // nom inconnu : candidat suivant
    }
  }
  validZone.set(tzid, found);
  return found;
}

function offsetMinutes(utcMs, zone) {
  if (!formatters.has(zone)) {
    formatters.set(zone, new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }));
  }
  const p = Object.fromEntries(formatters.get(zone).formatToParts(utcMs).map((x) => [x.type, Number(x.value)]));
  return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - utcMs) / 60000;
}

/** Heure locale d'un fuseau -> instant UTC (ms). Deux passes pour gérer le changement d'heure. */
export function zonedToUtc(y, mo, d, h, mi, s, zone) {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  const first = guess - offsetMinutes(guess, zone) * 60000;
  return guess - offsetMinutes(first, zone) * 60000;
}

/**
 * « 20250115T093000Z », « 20250115T093000 » (+ TZID), « 20250115 » (VALUE=DATE) ->
 * { kind: 'date' | 'utc' | 'zoned' | 'floating', y, mo, d, h, mi, s, tzid, ms }
 * `ms` : instant UTC en millisecondes (null si le fuseau est inconnu) ; pour un jour entier, minuit UTC de ce jour.
 */
export function parseIcsDate(value, tzid, timezoneComponents = []) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(String(value).trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (m[4] === undefined) return { kind: 'date', y, mo, d, h: 0, mi: 0, s: 0, tzid: null, ms: Date.UTC(y, mo - 1, d) };
  const [h, mi, s] = [Number(m[4]), Number(m[5]), Number(m[6] ?? 0)];
  if (m[7]) return { kind: 'utc', y, mo, d, h, mi, s, tzid: 'UTC', ms: Date.UTC(y, mo - 1, d, h, mi, s) };
  const zone = resolveZone(tzid, timezoneComponents);
  if (tzid && zone) return { kind: 'zoned', y, mo, d, h, mi, s, tzid, ms: zonedToUtc(y, mo, d, h, mi, s, zone) };
  return { kind: tzid ? 'zoned' : 'floating', y, mo, d, h, mi, s, tzid: tzid ?? null, ms: tzid ? null : Date.UTC(y, mo - 1, d, h, mi, s) };
}

/** Date d'une propriété (DTSTART, DTEND…) d'un événement. */
export function eventDate(event, name, timezones = []) {
  const p = prop(event, name);
  if (!p) return null;
  return parseIcsDate(p.value, param(p, 'TZID'), timezones);
}

/** « PT1H30M », « P1D », « P2W » -> millisecondes (null si invalide). */
export function parseDuration(value) {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(String(value).trim());
  if (!m) return null;
  const [, sign, w, d, h, mi, s] = m;
  const total = ((Number(w ?? 0) * 7 + Number(d ?? 0)) * 24 * 3600 + Number(h ?? 0) * 3600 + Number(mi ?? 0) * 60 + Number(s ?? 0)) * 1000;
  return sign === '-' ? -total : total;
}

/** Instant de fin d'un événement : DTEND, sinon DTSTART + DURATION, sinon (jour entier) le lendemain, sinon le début. */
export function eventEndMs(event, timezones = []) {
  const start = eventDate(event, 'DTSTART', timezones);
  const end = eventDate(event, 'DTEND', timezones);
  if (end?.ms != null) return end.ms;
  if (!start || start.ms == null) return null;
  const duration = parseDuration(propValue(event, 'DURATION'));
  if (duration != null) return start.ms + duration;
  return start.kind === 'date' ? start.ms + 86_400_000 : start.ms;
}

/** Texte de date lisible pour un tableau (« 15 janv. 2025, 09:30 » ; « 15 janv. 2025 » pour un jour entier). */
export function formatEventDate(date, locale = 'fr-FR') {
  if (!date) return '';
  if (date.kind === 'date') return new Date(date.ms).toLocaleDateString(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  const display = new Date(Date.UTC(date.y, date.mo - 1, date.d, date.h, date.mi, date.s));
  const text = display.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
  return date.kind === 'utc' ? `${text} UTC` : text;
}
