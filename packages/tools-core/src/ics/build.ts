// Écriture d'un fichier iCalendar : repliement des lignes à 75 octets (RFC 5545 §3.1), en-tête de calendrier, fuseaux utiles.
import { param, propValue, type IcsComponent } from './parse.js';

const encoder = new TextEncoder();
export const byteLength = (s: string): number => encoder.encode(s).length;

/** Replie une ligne à 75 octets maximum, sans couper un caractère multi-octets ; les suites commencent par une espace. */
export function foldLine(line: string): string {
  if (byteLength(line) <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let size = 0;
  let limit = 75;
  for (const char of line) {
    const n = byteLength(char);
    if (size + n > limit) {
      parts.push(current);
      current = '';
      size = 0;
      limit = 74; // l'espace de continuation compte dans les 75 octets
    }
    current += char;
    size += n;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

/** Identifiants de fuseaux (TZID) utilisés par un ensemble d'événements : paramètres TZID de toutes leurs propriétés. */
export function usedTzids(events: IcsComponent[]): Set<string> {
  const ids = new Set<string>();
  for (const event of events)
    for (const p of event.props) {
      const tzid = param(p, 'TZID');
      if (tzid) ids.add(tzid);
    }
  return ids;
}

const DEFAULT_HEADER: [string, string][] = [
  ['VERSION', '2.0'],
  ['PRODID', '-//grichard.eu//Outils ICS//FR'],
  ['CALSCALE', 'GREGORIAN'],
];

/**
 * `calendar` : VCALENDAR d'origine (VERSION, PRODID, CALSCALE, X-WR-CALNAME… sont repris) ;
 * `events` : composants VEVENT (leurs lignes d'origine sont écrites telles quelles) ;
 * `timezones` : VTIMEZONE disponibles, seuls ceux qu'utilisent les événements sont écrits ;
 * `method` : METHOD à écrire (par défaut : aucun, un import n'en a pas besoin).
 */
export function buildCalendar({
  calendar,
  events,
  timezones = [],
  method,
}: {
  calendar?: IcsComponent | null;
  events: IcsComponent[];
  timezones?: IcsComponent[];
  method?: string;
}): string {
  const header: string[] = [];
  const kept = new Set([
    'VERSION',
    'PRODID',
    'CALSCALE',
    'X-WR-CALNAME',
    'X-WR-TIMEZONE',
    'X-WR-CALDESC',
  ]);
  const fromSource = (calendar?.props ?? []).filter((p) => kept.has(p.name));
  if (!fromSource.some((p) => p.name === 'VERSION')) header.push('VERSION:2.0');
  for (const p of fromSource)
    header.push(
      `${p.name}${p.params.map(([k, v]) => `;${k}=${/[;:,]/.test(v) ? `"${v}"` : v}`).join('')}:${p.value}`,
    );
  if (!fromSource.some((p) => p.name === 'PRODID')) header.push(`PRODID:${DEFAULT_HEADER[1]?.[1]}`);
  if (method) header.push(`METHOD:${method}`);

  const wanted = usedTzids(events);
  const zones = timezones.filter((z) => wanted.has(propValue(z, 'TZID')));
  const seen = new Set<string>();
  const uniqueZones = zones.filter((z) => {
    const id = propValue(z, 'TZID');
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const lines = [
    'BEGIN:VCALENDAR',
    ...header,
    ...uniqueZones.flatMap((z) => z.lines),
    ...events.flatMap((e) => e.lines),
    'END:VCALENDAR',
  ];
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

/** Nom de fichier sûr (sans extension) à partir d'un nom de fichier saisi par l'utilisateur. */
export const baseName = (filename: string): string =>
  filename
    .replace(/\.[^.]+$/, '')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'calendrier';
