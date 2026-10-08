// Comparaison de deux calendriers : « source moins destination » (ce qu'il reste à importer), événements déjà présents,
// modifiés, seulement en destination et doublons. L'identité d'un événement peut être son UID (fiable entre exports
// d'un même agenda) ou son contenu (titre + début + fin : fiable quand un import a régénéré les UID, ex. Google -> Outlook).
import { eventDate, eventEndMs, type IcsDate } from './dates.js';
import {
  eventKey,
  eventUid,
  propValue,
  unescapeText,
  type IcsComponent,
  type ParsedIcs,
} from './parse.js';

export const MATCH_MODES = ['both', 'uid', 'content'] as const;

export interface CompareOptions {
  match: 'both' | 'uid' | 'content';
  ignoreCase: boolean;
  ignoreEnd: boolean;
  ignoreDescription: boolean;
  dedupe: boolean;
  includeModified: boolean;
}

/** Caractéristiques normalisées d'un événement, utilisées pour l'identité et pour détecter les modifications. */
export interface EventInfo {
  event: IcsComponent;
  uid: string;
  key: string;
  summary: string;
  start: IcsDate | null;
  startKey: string;
  endKey: string;
  rrule: string;
  recurrence: string;
  location: string;
  description: string;
  status: string;
  fingerprint: string;
}

export interface Match {
  source: EventInfo;
  destination: EventInfo;
  by: 'uid' | 'content';
  changes: string[];
}

const clean = (s: unknown): string => unescapeText(s).replace(/\s+/g, ' ').trim();

function dateKey(date: IcsDate | null): string {
  if (!date) return '';
  if (date.kind === 'date')
    return `D${date.y}${String(date.mo).padStart(2, '0')}${String(date.d).padStart(2, '0')}`;
  return date.ms != null
    ? `T${date.ms}`
    : `L${date.tzid}|${date.y}-${date.mo}-${date.d}T${date.h}:${date.mi}:${date.s}`;
}

const msKey = (ms: number | null, allDay: boolean): string =>
  ms == null
    ? ''
    : allDay
      ? `D${new Date(ms).toISOString().slice(0, 10).replace(/-/g, '')}`
      : `T${ms}`;
const normRrule = (v: string): string =>
  v
    .split(';')
    .filter(Boolean)
    .map((p) => p.toUpperCase())
    .sort()
    .join(';');

export function describeEvent(
  event: IcsComponent,
  timezones: IcsComponent[],
  options: Pick<CompareOptions, 'ignoreCase' | 'ignoreEnd'>,
): EventInfo {
  const fold = options.ignoreCase
    ? (s: string): string => s.toLowerCase()
    : (s: string): string => s;
  const start = eventDate(event, 'DTSTART', timezones);
  const endMs = eventEndMs(event, timezones);
  const allDay = start?.kind === 'date';
  const recurrence = propValue(event, 'RECURRENCE-ID');
  const info: EventInfo = {
    fingerprint: '',
    event,
    uid: eventUid(event),
    key: eventKey(event),
    summary: clean(propValue(event, 'SUMMARY')),
    start,
    startKey: dateKey(start),
    endKey: msKey(endMs, allDay),
    rrule: normRrule(propValue(event, 'RRULE')),
    recurrence: dateKey(recurrence ? eventDate(event, 'RECURRENCE-ID', timezones) : null),
    location: fold(clean(propValue(event, 'LOCATION'))),
    description: fold(clean(propValue(event, 'DESCRIPTION'))),
    status: propValue(event, 'STATUS').toUpperCase(),
  };
  info.fingerprint = [
    fold(info.summary),
    info.startKey,
    options.ignoreEnd ? '' : info.endKey,
    info.rrule,
    info.recurrence,
  ].join('|');
  return info;
}

/** Champs qui diffèrent entre deux événements censés être les mêmes. */
export function changedFields(
  a: EventInfo,
  b: EventInfo,
  options: Pick<CompareOptions, 'ignoreCase' | 'ignoreEnd' | 'ignoreDescription'>,
): string[] {
  const fold = options.ignoreCase
    ? (s: string): string => s.toLowerCase()
    : (s: string): string => s;
  const changes: string[] = [];
  if (fold(a.summary) !== fold(b.summary)) changes.push('summary');
  if (a.startKey !== b.startKey) changes.push('start');
  if (!options.ignoreEnd && a.endKey !== b.endKey) changes.push('end');
  if (a.location !== b.location) changes.push('location');
  if (!options.ignoreDescription && a.description !== b.description) changes.push('description');
  if (a.rrule !== b.rrule) changes.push('recurrence');
  if (a.status !== b.status) changes.push('status');
  return changes;
}

const multimap = <T>(list: T[], keyOf: (item: T) => string | false): Map<string, T[]> => {
  const map = new Map<string, T[]>();
  for (const item of list) {
    const k = keyOf(item);
    if (k) map.set(k, [...(map.get(k) ?? []), item]);
  }
  return map;
};

const takeUnused = (list: EventInfo[] | undefined, used: Set<EventInfo>): EventInfo | undefined => {
  const found = (list ?? []).find((d) => !used.has(d));
  if (found) used.add(found);
  return found;
};

/** Groupes d'événements identiques au sein d'un même fichier (doublons) : [{ items: [...], key }] avec au moins 2 éléments. */
function duplicatesOf(descs: EventInfo[]): EventInfo[][] {
  const groups = new Map<string, EventInfo[]>();
  for (const d of descs) {
    const k = d.uid ? d.key : d.fingerprint;
    groups.set(k, [...(groups.get(k) ?? []), d]);
  }
  const byContent = multimap(descs, (d) => d.fingerprint);
  const result = [...groups.values()].filter((g) => g.length > 1);
  for (const g of byContent.values())
    if (g.length > 1 && !result.some((r) => r.includes(g[0] as EventInfo))) result.push(g);
  return result;
}

/** Compare `source` à `destination` : ce qu'il reste à importer, ce qui est déjà présent, modifié, ou seulement en destination. */
export function compareCalendars(
  source: ParsedIcs,
  destination: ParsedIcs,
  opts: Partial<CompareOptions> = {},
) {
  const options: CompareOptions = {
    match: 'both',
    ignoreCase: true,
    ignoreEnd: false,
    ignoreDescription: true,
    dedupe: true,
    includeModified: false,
    ...opts,
  };
  const src = source.events.map((e) => describeEvent(e, source.timezones, options));
  const dst = destination.events.map((e) => describeEvent(e, destination.timezones, options));

  const byKey = multimap(dst, (d) => d.uid && d.key);
  const byFingerprint = multimap(dst, (d) => d.fingerprint);
  const used = new Set<EventInfo>();

  const onlyInSource: EventInfo[] = [];
  const matched: Match[] = []; // identiques
  const modified: Match[] = [];
  for (const s of src) {
    let d: EventInfo | undefined;
    let by: 'uid' | 'content' | undefined;
    if (options.match !== 'content' && s.uid) {
      d = takeUnused(byKey.get(s.key), used);
      by = 'uid';
    }
    if (!d && options.match !== 'uid') {
      d = takeUnused(byFingerprint.get(s.fingerprint), used);
      by = 'content';
    }
    if (!d) {
      onlyInSource.push(s);
      continue;
    }
    const changes = by === 'uid' ? changedFields(s, d, options) : [];
    (changes.length ? modified : matched).push({
      source: s,
      destination: d,
      by: by as 'uid' | 'content',
      changes,
    });
  }
  const onlyInDestination = dst.filter((d) => !used.has(d));

  // Événements à importer : ce qui n'est que dans la source (+ les modifiés si demandé), sans doublons
  let toImport = [
    ...onlyInSource,
    ...(options.includeModified ? modified.map((m) => m.source) : []),
  ];
  let removedDuplicates = 0;
  if (options.dedupe) {
    const seen = new Set<string>();
    toImport = toImport.filter((d) => {
      const k = d.uid ? d.key : d.fingerprint;
      const kc = d.fingerprint;
      if (seen.has(k) || seen.has(kc)) {
        removedDuplicates += 1;
        return false;
      }
      seen.add(k);
      seen.add(kc);
      return true;
    });
  }

  // Exception d'une série dont le maître n'est ni exporté ni présent en destination : l'import la laisserait orpheline
  const masters = new Set([
    ...toImport.filter((d) => !d.recurrence).map((d) => d.uid),
    ...dst.filter((d) => !d.recurrence).map((d) => d.uid),
  ]);
  const orphanExceptions = toImport.filter((d) => d.recurrence && !masters.has(d.uid));

  return {
    options,
    counts: {
      source: src.length,
      destination: dst.length,
      toImport: toImport.length,
      matched: matched.length,
      modified: modified.length,
      onlyInDestination: onlyInDestination.length,
    },
    toImport,
    onlyInSource,
    matched,
    modified,
    onlyInDestination,
    duplicatesSource: duplicatesOf(src),
    duplicatesDestination: duplicatesOf(dst),
    removedDuplicates,
    orphanExceptions,
  };
}
