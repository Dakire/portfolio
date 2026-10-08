// Comparaison de deux calendriers : « source moins destination » (ce qu'il reste à importer), événements déjà présents,
// modifiés, seulement en destination et doublons. L'identité d'un événement peut être son UID (fiable entre exports
// d'un même agenda) ou son contenu (titre + début + fin : fiable quand un import a régénéré les UID, ex. Google -> Outlook).
import { eventDate, eventEndMs } from './dates.js';
import { eventKey, eventUid, propValue, unescapeText } from './parse.js';

export const MATCH_MODES = ['both', 'uid', 'content'];

const clean = (s) => unescapeText(s).replace(/\s+/g, ' ').trim();

function dateKey(date) {
  if (!date) return '';
  if (date.kind === 'date') return `D${date.y}${String(date.mo).padStart(2, '0')}${String(date.d).padStart(2, '0')}`;
  return date.ms != null ? `T${date.ms}` : `L${date.tzid}|${date.y}-${date.mo}-${date.d}T${date.h}:${date.mi}:${date.s}`;
}

const msKey = (ms, allDay) => (ms == null ? '' : allDay ? `D${new Date(ms).toISOString().slice(0, 10).replace(/-/g, '')}` : `T${ms}`);
const normRrule = (v) => v.split(';').filter(Boolean).map((p) => p.toUpperCase()).sort().join(';');

/** Caractéristiques normalisées d'un événement, utilisées pour l'identité et pour détecter les modifications. */
export function describeEvent(event, timezones, options) {
  const fold = options.ignoreCase ? (s) => s.toLowerCase() : (s) => s;
  const start = eventDate(event, 'DTSTART', timezones);
  const endMs = eventEndMs(event, timezones);
  const allDay = start?.kind === 'date';
  const recurrence = propValue(event, 'RECURRENCE-ID');
  const info = {
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
  info.fingerprint = [fold(info.summary), info.startKey, options.ignoreEnd ? '' : info.endKey, info.rrule, info.recurrence].join('|');
  return info;
}

/** Champs qui diffèrent entre deux événements censés être les mêmes. */
export function changedFields(a, b, options) {
  const fold = options.ignoreCase ? (s) => s.toLowerCase() : (s) => s;
  const changes = [];
  if (fold(a.summary) !== fold(b.summary)) changes.push('summary');
  if (a.startKey !== b.startKey) changes.push('start');
  if (!options.ignoreEnd && a.endKey !== b.endKey) changes.push('end');
  if (a.location !== b.location) changes.push('location');
  if (!options.ignoreDescription && a.description !== b.description) changes.push('description');
  if (a.rrule !== b.rrule) changes.push('recurrence');
  if (a.status !== b.status) changes.push('status');
  return changes;
}

const multimap = (list, keyOf) => {
  const map = new Map();
  for (const item of list) {
    const k = keyOf(item);
    if (k) map.set(k, [...(map.get(k) ?? []), item]);
  }
  return map;
};

const takeUnused = (list, used) => {
  const found = (list ?? []).find((d) => !used.has(d));
  if (found) used.add(found);
  return found;
};

/** Groupes d'événements identiques au sein d'un même fichier (doublons) : [{ items: [...], key }] avec au moins 2 éléments. */
function duplicatesOf(descs) {
  const groups = new Map();
  for (const d of descs) {
    const k = d.uid ? d.key : d.fingerprint;
    groups.set(k, [...(groups.get(k) ?? []), d]);
  }
  const byContent = multimap(descs, (d) => d.fingerprint);
  const result = [...groups.values()].filter((g) => g.length > 1);
  for (const g of byContent.values()) if (g.length > 1 && !result.some((r) => r.includes(g[0]))) result.push(g);
  return result;
}

/**
 * @param {ReturnType<import('./parse.js').parseIcs>} source
 * @param {ReturnType<import('./parse.js').parseIcs>} destination
 * @param {{ match?: 'both'|'uid'|'content', ignoreCase?: boolean, ignoreEnd?: boolean, ignoreDescription?: boolean, dedupe?: boolean, includeModified?: boolean }} [opts]
 */
export function compareCalendars(source, destination, opts = {}) {
  const options = { match: 'both', ignoreCase: true, ignoreEnd: false, ignoreDescription: true, dedupe: true, includeModified: false, ...opts };
  const src = source.events.map((e) => describeEvent(e, source.timezones, options));
  const dst = destination.events.map((e) => describeEvent(e, destination.timezones, options));

  const byKey = multimap(dst, (d) => d.uid && d.key);
  const byFingerprint = multimap(dst, (d) => d.fingerprint);
  const used = new Set();

  const onlyInSource = [];
  const matched = []; // identiques
  const modified = [];
  for (const s of src) {
    let d;
    let by;
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
    (changes.length ? modified : matched).push({ source: s, destination: d, by, changes });
  }
  const onlyInDestination = dst.filter((d) => !used.has(d));

  // Événements à importer : ce qui n'est que dans la source (+ les modifiés si demandé), sans doublons
  let toImport = [...onlyInSource, ...(options.includeModified ? modified.map((m) => m.source) : [])];
  let removedDuplicates = 0;
  if (options.dedupe) {
    const seen = new Set();
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
  const masters = new Set([...toImport.filter((d) => !d.recurrence).map((d) => d.uid), ...dst.filter((d) => !d.recurrence).map((d) => d.uid)]);
  const orphanExceptions = toImport.filter((d) => d.recurrence && !masters.has(d.uid));

  return {
    options,
    counts: { source: src.length, destination: dst.length, toImport: toImport.length, matched: matched.length, modified: modified.length, onlyInDestination: onlyInDestination.length },
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
