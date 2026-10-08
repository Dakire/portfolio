// Découpage d'un calendrier en plusieurs fichiers .ics. Un événement récurrent et ses exceptions (même UID) restent toujours
// dans le même fichier ; chaque fichier ne contient que les fuseaux horaires dont ses événements ont besoin.
import { baseName, buildCalendar, byteLength } from './build.js';
import { eventDate, type IcsDate } from './dates.js';
import { eventUid, propValue, unescapeText, type IcsComponent, type ParsedIcs } from './parse.js';

export const SPLIT_MODES = ['count', 'size', 'year', 'month', 'single', 'calendar'] as const;
export type SplitMode = (typeof SPLIT_MODES)[number];

export interface SplitFile {
  name: string;
  text: string;
  events: number;
  bytes: number;
  label: string;
}
export interface SplitWarning {
  code: string;
  value?: string | number;
}
interface Bucket {
  key?: string;
  label?: string;
  units: IcsComponent[][];
}

/** Regroupe les événements par UID, dans l'ordre du fichier (un événement sans UID forme son propre groupe). */
export function groupByUid(events: IcsComponent[]): IcsComponent[][] {
  const groups = new Map<string, IcsComponent[]>();
  events.forEach((event, i) => {
    const uid = eventUid(event) || `__sans-uid-${i}`;
    groups.set(uid, [...(groups.get(uid) ?? []), event]);
  });
  return [...groups.values()];
}

const first = (unit: IcsComponent[]): IcsComponent => unit[0] as IcsComponent;
const pad = (n: number, width = 2): string => String(n).padStart(width, '0');
const slug = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
const unitSize = (unit: IcsComponent[]): number =>
  unit.reduce((sum, e) => sum + byteLength(e.lines.join('\r\n')) + 2, 0);

/** Date de début de référence d'un groupe : celle de l'événement maître (sans RECURRENCE-ID), sinon la plus ancienne. */
function unitStart(unit: IcsComponent[], timezones: IcsComponent[]): IcsDate | null {
  const master = unit.find((e) => !propValue(e, 'RECURRENCE-ID')) ?? unit[0];
  if (!master) return null;
  return eventDate(master, 'DTSTART', timezones);
}

/** `mode` : voir SPLIT_MODES ; `count` : événements par fichier ; `maxBytes` : taille maximale d'un fichier (mode « size »). */
export function splitCalendar(
  parsed: ParsedIcs,
  {
    mode,
    count = 100,
    maxBytes = 1_000_000,
    filename = 'calendrier.ics',
  }: { mode: SplitMode; count?: number; maxBytes?: number; filename?: string },
): { files: SplitFile[]; warnings: SplitWarning[] } {
  const base = baseName(filename);
  const warnings: SplitWarning[] = [];
  const timezones = parsed.timezones;
  const calendarOf = (event: IcsComponent | undefined): IcsComponent | null =>
    parsed.calendars.find((c) => (event ? c.children.includes(event) : false)) ??
    parsed.calendars[0] ??
    null;

  const make = (groups: IcsComponent[][], name: string, label: string): SplitFile => {
    const events = groups.flat();
    const text = buildCalendar({ calendar: calendarOf(events[0]), events, timezones });
    return { name: `${name}.ics`, text, events: events.length, bytes: byteLength(text), label };
  };

  const units = groupByUid(parsed.events);
  const buckets: Bucket[] = [];

  if (mode === 'calendar') {
    buckets.push(
      ...parsed.calendars
        .map((c, i) => ({
          key: `calendrier-${i + 1}`,
          label: unescapeText(propValue(c, 'X-WR-CALNAME')) || `#${i + 1}`,
          units: groupByUid(c.children.filter((x) => x.type === 'VEVENT')),
        }))
        .filter((b) => b.units.length),
    );
  } else if (mode === 'year' || mode === 'month') {
    const map = new Map<string, IcsComponent[][]>();
    for (const unit of units) {
      const start = unitStart(unit, timezones);
      const key = !start
        ? 'sans-date'
        : mode === 'year'
          ? String(start.y)
          : `${start.y}-${pad(start.mo)}`;
      map.set(key, [...(map.get(key) ?? []), unit]);
    }
    buckets.push(
      ...[...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, list]) => ({ key, label: key, units: list })),
    );
    if (map.has('sans-date'))
      warnings.push({ code: 'undated', value: map.get('sans-date')?.flat().length });
  } else if (mode === 'single') {
    buckets.push(
      ...units.map((unit, i) => ({
        key: `${pad(i + 1, String(units.length).length)}-${slug(unescapeText(propValue(first(unit), 'SUMMARY'))) || 'evenement'}`,
        label: unescapeText(propValue(first(unit), 'SUMMARY')),
        units: [unit],
      })),
    );
  } else if (mode === 'size') {
    let current: IcsComponent[][] = [];
    let size = 0;
    const flush = () => current.length && buckets.push({ units: current });
    for (const unit of units) {
      const s = unitSize(unit);
      if (s > maxBytes)
        warnings.push({ code: 'oversize', value: unescapeText(propValue(first(unit), 'SUMMARY')) });
      if (current.length && size + s > maxBytes) {
        flush();
        current = [];
        size = 0;
      }
      current.push(unit);
      size += s;
    }
    flush();
  } else {
    const per = Math.max(1, Math.floor(count));
    let current: IcsComponent[][] = [];
    let n = 0;
    for (const unit of units) {
      if (current.length && n + unit.length > per) {
        buckets.push({ units: current });
        current = [];
        n = 0;
      }
      current.push(unit);
      n += unit.length;
    }
    if (current.length) buckets.push({ units: current });
  }

  const numbered = !['year', 'month', 'single', 'calendar'].includes(mode);
  const width = String(buckets.length).length;
  const files = buckets.map((b, i) =>
    make(
      b.units,
      numbered ? `${base}-partie-${pad(i + 1, width)}` : `${base}-${b.key}`,
      b.label ?? `${i + 1}`,
    ),
  );

  if (parsed.events.length === 0) warnings.push({ code: 'empty' });
  if (parsed.calendars.length > 1 && mode !== 'calendar')
    warnings.push({ code: 'multipleCalendars', value: parsed.calendars.length });
  return { files, warnings };
}

/** Résumé d'un fichier chargé : nombre d'événements, de séries, de fuseaux, période couverte. */
export function summarize(parsed: ParsedIcs) {
  const starts = parsed.events
    .map((e) => eventDate(e, 'DTSTART', parsed.timezones)?.ms)
    .filter((ms): ms is number => ms != null);
  return {
    events: parsed.events.length,
    series: parsed.events.filter((e) => propValue(e, 'RRULE')).length,
    uids: groupByUid(parsed.events).length,
    timezones: parsed.timezones.length,
    calendars: parsed.calendars.length,
    first: starts.length ? Math.min(...starts) : null,
    last: starts.length ? Math.max(...starts) : null,
    issues: parsed.issues,
  };
}
