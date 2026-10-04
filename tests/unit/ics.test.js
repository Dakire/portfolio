import { describe, expect, it } from 'vitest';
import { baseName, buildCalendar, byteLength, foldLine } from '../../src/lib/ics/build.js';
import { compareCalendars } from '../../src/lib/ics/compare.js';
import { eventDate, eventEndMs, formatEventDate, parseDuration, parseIcsDate, resolveZone } from '../../src/lib/ics/dates.js';
import { eventKey, parseContentLine, parseIcs, propValue, unescapeText, unfold } from '../../src/lib/ics/parse.js';
import { groupByUid, splitCalendar, summarize } from '../../src/lib/ics/split.js';

const CRLF = '\r\n';
const vevent = ({ uid, summary = 'Réunion', start = '20250110T090000Z', end = '20250110T100000Z', extra = [] }) => [
  'BEGIN:VEVENT',
  `UID:${uid}`,
  'DTSTAMP:20250101T000000Z',
  `DTSTART${start.includes('T') && !start.endsWith('Z') ? ';TZID=Europe/Paris' : start.length === 8 ? ';VALUE=DATE' : ''}:${start}`,
  end ? `DTEND${end.includes('T') && !end.endsWith('Z') ? ';TZID=Europe/Paris' : end.length === 8 ? ';VALUE=DATE' : ''}:${end}` : null,
  `SUMMARY:${summary}`,
  ...extra,
  'END:VEVENT',
].filter(Boolean);
const PARIS = ['BEGIN:VTIMEZONE', 'TZID:Europe/Paris', 'X-LIC-LOCATION:Europe/Paris', 'END:VTIMEZONE'];
const ics = (events, { zones = [], head = [] } = {}) => ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Test//EN', ...head, ...zones.flat(), ...events.flat(), 'END:VCALENDAR'].join(CRLF) + CRLF;
const parsed = (text) => parseIcs(text);

describe('analyse', () => {
  it('déplie les lignes (espace ou tabulation) et accepte tous les retours à la ligne', () => {
    expect(unfold('SUMMARY:Un titre tres\r\n  long\r\n\tsuite\nLOCATION:x\rEND:X')).toEqual(['SUMMARY:Un titre tres longsuite', 'LOCATION:x', 'END:X']);
    expect(unfold('﻿BEGIN:VCALENDAR')[0]).toBe('BEGIN:VCALENDAR');
  });

  it('lit nom, paramètres (guillemets, virgules, deux-points) et valeur', () => {
    expect(parseContentLine('DTSTART;TZID=Europe/Paris:20250101T100000')).toEqual({ name: 'DTSTART', params: [['TZID', 'Europe/Paris']], value: '20250101T100000' });
    const attendee = parseContentLine('ATTENDEE;CN="Doe, John: Jr";ROLE=REQ-PARTICIPANT:mailto:j@x.org');
    expect(attendee.params).toEqual([['CN', 'Doe, John: Jr'], ['ROLE', 'REQ-PARTICIPANT']]);
    expect(attendee.value).toBe('mailto:j@x.org');
    expect(parseContentLine('pas une ligne')).toBeNull();
    expect(parseContentLine('summary:minuscules').name).toBe('SUMMARY');
  });

  it('décode les échappements de texte', () => {
    expect(unescapeText('a\\, b\\; c\\nd\\\\e')).toBe('a, b; c\nd\\e');
  });

  it('construit l\'arbre, garde les lignes d\'origine et sépare événements, fuseaux, calendriers', () => {
    const p = parsed(ics([vevent({ uid: 'a' }), vevent({ uid: 'b' })], { zones: [PARIS] }));
    expect(p.events).toHaveLength(2);
    expect(p.timezones).toHaveLength(1);
    expect(p.calendars).toHaveLength(1);
    expect(p.events[0].lines[0]).toBe('BEGIN:VEVENT');
    expect(p.events[0].lines.at(-1)).toBe('END:VEVENT');
    expect(propValue(p.events[1], 'UID')).toBe('b');
    expect(p.issues).toEqual([]);
  });

  it('tolère un VEVENT non fermé, un END orphelin et des lignes illisibles', () => {
    const broken = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'UID:1', 'SUMMARY:ouvert', 'BEGIN:VEVENT', 'UID:2', 'END:VEVENT', 'END:VTODO', 'n importe quoi', 'END:VCALENDAR'].join('\n');
    const p = parsed(broken);
    expect(p.events.map((e) => propValue(e, 'UID')).sort()).toEqual(['1', '2']);
    expect(p.issues.join(' ')).toMatch(/non fermé|sans BEGIN|illisible/);
  });

  it('gère plusieurs VCALENDAR dans un fichier concaténé', () => {
    const p = parsed(ics([vevent({ uid: 'a' })]) + ics([vevent({ uid: 'b' })]));
    expect(p.calendars).toHaveLength(2);
    expect(p.events).toHaveLength(2);
  });

  it('identifie un événement par UID et RECURRENCE-ID', () => {
    const p = parsed(ics([vevent({ uid: 'x', extra: ['RECURRENCE-ID:20250117T090000Z'] })]));
    expect(eventKey(p.events[0])).toBe('x|20250117T090000Z');
  });
});

describe('dates', () => {
  it('lit les formes de dates iCalendar', () => {
    expect(parseIcsDate('20250115')).toMatchObject({ kind: 'date', y: 2025, mo: 1, d: 15 });
    expect(parseIcsDate('20250115T093000Z')).toMatchObject({ kind: 'utc', ms: Date.UTC(2025, 0, 15, 9, 30) });
    expect(parseIcsDate('20250115T093000')).toMatchObject({ kind: 'floating', ms: Date.UTC(2025, 0, 15, 9, 30) });
    expect(parseIcsDate('n importe quoi')).toBeNull();
  });

  it('convertit un fuseau IANA en UTC, heure d\'hiver et d\'été comprises', () => {
    expect(parseIcsDate('20250115T100000', 'Europe/Paris').ms).toBe(Date.UTC(2025, 0, 15, 9, 0)); // UTC+1
    expect(parseIcsDate('20250715T100000', 'Europe/Paris').ms).toBe(Date.UTC(2025, 6, 15, 8, 0)); // UTC+2
    expect(parseIcsDate('20250115T100000', 'America/New_York').ms).toBe(Date.UTC(2025, 0, 15, 15, 0));
  });

  it('reconnaît les noms de fuseaux Windows, les préfixes Mozilla et X-LIC-LOCATION', () => {
    expect(resolveZone('Romance Standard Time')).toBe('Europe/Paris');
    expect(resolveZone('W. Europe Standard Time')).toBe('Europe/Berlin');
    expect(resolveZone('/mozilla.org/20050126_1/Europe/Paris')).toBe('Europe/Paris');
    const p = parsed(ics([], { zones: [['BEGIN:VTIMEZONE', 'TZID:Heure inconnue', 'X-LIC-LOCATION:Asia/Tokyo', 'END:VTIMEZONE']] }));
    expect(resolveZone('Heure inconnue', p.timezones)).toBe('Asia/Tokyo');
    expect(resolveZone('Fuseau Inexistant')).toBeNull();
    expect(parseIcsDate('20250115T100000', 'Romance Standard Time').ms).toBe(Date.UTC(2025, 0, 15, 9, 0));
  });

  it('calcule les durées et la fin d\'un événement', () => {
    expect(parseDuration('PT1H30M')).toBe(5_400_000);
    expect(parseDuration('P1D')).toBe(86_400_000);
    expect(parseDuration('P2W')).toBe(14 * 86_400_000);
    expect(parseDuration('n/a')).toBeNull();
    const p = parsed(ics([vevent({ uid: 'd', end: null, extra: ['DURATION:PT2H'] }), vevent({ uid: 'j', start: '20250110', end: null })]));
    expect(eventEndMs(p.events[0], p.timezones)).toBe(Date.UTC(2025, 0, 10, 11));
    expect(eventEndMs(p.events[1], p.timezones)).toBe(Date.UTC(2025, 0, 11)); // jour entier : le lendemain
  });

  it('affiche une date lisible', () => {
    const p = parsed(ics([vevent({ uid: 'a', start: '20250110T093000', end: '20250110T103000' }), vevent({ uid: 'b', start: '20250110', end: null })]));
    expect(formatEventDate(eventDate(p.events[0], 'DTSTART', p.timezones), 'fr-FR')).toMatch(/10 janv\. 2025.*09:30/);
    expect(formatEventDate(eventDate(p.events[1], 'DTSTART', p.timezones), 'fr-FR')).toBe('10 janv. 2025');
  });
});

describe('écriture', () => {
  it('replie à 75 octets maximum sans couper un caractère', () => {
    const long = `SUMMARY:${'é'.repeat(80)}😀${'a'.repeat(50)}`;
    const folded = foldLine(long);
    for (const line of folded.split('\r\n')) expect(byteLength(line)).toBeLessThanOrEqual(75);
    expect(unfold(folded)[0]).toBe(long); // le dépliage restitue l'original exact
    expect(foldLine('SUMMARY:court')).toBe('SUMMARY:court');
  });

  it('écrit un calendrier valide avec uniquement les fuseaux utilisés', () => {
    const p = parsed(ics([vevent({ uid: 'a', start: '20250110T090000', end: '20250110T100000' }), vevent({ uid: 'b' })], { zones: [PARIS, ['BEGIN:VTIMEZONE', 'TZID:Asia/Tokyo', 'END:VTIMEZONE']] }));
    const text = buildCalendar({ calendar: p.calendars[0], events: [p.events[1]], timezones: p.timezones });
    expect(text.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Test//EN\r\n')).toBe(true);
    expect(text.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(text).not.toContain('VTIMEZONE'); // l'événement b est en UTC
    const withZone = buildCalendar({ calendar: p.calendars[0], events: [p.events[0]], timezones: p.timezones });
    expect(withZone).toContain('TZID:Europe/Paris');
    expect(withZone).not.toContain('Asia/Tokyo');
    expect(parsed(withZone).events).toHaveLength(1);
  });

  it('nettoie les noms de fichiers', () => {
    expect(baseName('Mon agenda (2025).ics')).toBe('Mon-agenda-2025');
    expect(baseName('')).toBe('calendrier');
    expect(baseName('été.ics')).toBe('été');
  });
});

describe('découpage', () => {
  const events = [
    vevent({ uid: 'a', start: '20240115T090000Z', end: '20240115T100000Z' }),
    vevent({ uid: 'b', start: '20240620T090000Z', end: '20240620T100000Z' }),
    vevent({ uid: 'c', start: '20250105T090000Z', end: '20250105T100000Z' }),
    vevent({ uid: 'c', start: '20250112T090000Z', end: '20250112T100000Z', extra: ['RECURRENCE-ID:20250112T090000Z'] }), // exception de c
    vevent({ uid: 'd', start: '20250301T090000Z', end: '20250301T100000Z' }),
  ];
  const p = parsed(ics(events, { head: ['X-WR-CALNAME:Perso'] }));
  const total = (files) => files.reduce((n, f) => n + f.events, 0);

  it('groupe une série et ses exceptions', () => {
    expect(groupByUid(p.events).map((g) => g.length)).toEqual([1, 1, 2, 1]);
  });

  it('par nombre : les séries ne sont jamais séparées et aucun événement ne se perd', () => {
    const { files } = splitCalendar(p, { mode: 'count', count: 2, filename: 'agenda.ics' });
    expect(total(files)).toBe(5);
    expect(files.map((f) => f.events)).toEqual([2, 2, 1]); // [a,b] [c+exception] [d]
    expect(files.map((f) => f.name)).toEqual(['agenda-partie-1.ics', 'agenda-partie-2.ics', 'agenda-partie-3.ics']);
    expect(parsed(files[1].text).events.map((e) => propValue(e, 'UID'))).toEqual(['c', 'c']);
  });

  it('par année et par mois', () => {
    const years = splitCalendar(p, { mode: 'year', filename: 'agenda.ics' });
    expect(years.files.map((f) => [f.name, f.events])).toEqual([['agenda-2024.ics', 2], ['agenda-2025.ics', 3]]);
    const months = splitCalendar(p, { mode: 'month', filename: 'agenda.ics' });
    expect(months.files.map((f) => f.name)).toEqual(['agenda-2024-01.ics', 'agenda-2024-06.ics', 'agenda-2025-01.ics', 'agenda-2025-03.ics']);
  });

  it('un événement par fichier (série incluse)', () => {
    const { files } = splitCalendar(p, { mode: 'single', filename: 'agenda.ics' });
    expect(files).toHaveLength(4);
    expect(files[0].name).toBe('agenda-1-reunion.ics');
    expect(total(files)).toBe(5);
  });

  it('par taille maximale, avec avertissement si un seul événement la dépasse', () => {
    const { files } = splitCalendar(p, { mode: 'size', maxBytes: 600, filename: 'agenda.ics' });
    expect(files.length).toBeGreaterThan(1);
    expect(total(files)).toBe(5);
    const tiny = splitCalendar(p, { mode: 'size', maxBytes: 10, filename: 'agenda.ics' });
    expect(tiny.warnings.some((w) => w.code === 'oversize')).toBe(true);
    expect(total(tiny.files)).toBe(5);
  });

  it('par calendrier quand le fichier en concatène plusieurs', () => {
    const two = parsed(ics([events[0]], { head: ['X-WR-CALNAME:Travail'] }) + ics([events[1]], { head: ['X-WR-CALNAME:Perso'] }));
    const { files } = splitCalendar(two, { mode: 'calendar', filename: 'tout.ics' });
    expect(files.map((f) => f.label)).toEqual(['Travail', 'Perso']);
    expect(splitCalendar(two, { mode: 'count', count: 10 }).warnings.some((w) => w.code === 'multipleCalendars')).toBe(true);
  });

  it('range les événements sans date à part et signale un fichier vide', () => {
    const undated = parsed(ics([['BEGIN:VEVENT', 'UID:z', 'SUMMARY:sans date', 'END:VEVENT']]));
    const r = splitCalendar(undated, { mode: 'year', filename: 'a.ics' });
    expect(r.files[0].name).toBe('a-sans-date.ics');
    expect(r.warnings[0]).toEqual({ code: 'undated', value: 1 });
    expect(splitCalendar(parsed(ics([])), { mode: 'count' }).warnings[0].code).toBe('empty');
  });

  it('conserve les fuseaux, les en-têtes du calendrier et les lignes d\'origine', () => {
    const z = parsed(ics([vevent({ uid: 'a', start: '20250110T090000', end: '20250110T100000', extra: ['LOCATION:Salle\\, 2'] })], { zones: [PARIS], head: ['X-WR-CALNAME:Perso'] }));
    const out = splitCalendar(z, { mode: 'count', count: 5 }).files[0].text;
    expect(out).toContain('X-WR-CALNAME:Perso');
    expect(out).toContain('TZID:Europe/Paris');
    expect(out).toContain('LOCATION:Salle\\, 2');
  });

  it('résume un fichier chargé', () => {
    const s = summarize(p);
    expect(s).toMatchObject({ events: 5, uids: 4, calendars: 1, timezones: 0 });
    expect(s.first).toBe(Date.UTC(2024, 0, 15, 9));
    expect(s.last).toBe(Date.UTC(2025, 2, 1, 9));
  });
});

describe('comparaison « source moins destination »', () => {
  const E = (uid, summary, start, end, extra) => vevent({ uid, summary, start, end, extra });
  const compare = (src, dst, options) => compareCalendars(parsed(ics(src)), parsed(ics(dst)), options);
  const summaries = (list) => list.map((d) => d.summary).sort();

  it('ne garde de la source que ce qui manque en destination (même UID)', () => {
    const r = compare(
      [E('1', 'A', '20250110T090000Z', '20250110T100000Z'), E('2', 'B', '20250111T090000Z', '20250111T100000Z'), E('3', 'C', '20250112T090000Z', '20250112T100000Z')],
      [E('1', 'A', '20250110T090000Z', '20250110T100000Z'), E('9', 'Autre', '20250120T090000Z', '20250120T100000Z')],
    );
    expect(summaries(r.toImport)).toEqual(['B', 'C']);
    expect(r.counts).toMatchObject({ source: 3, destination: 2, toImport: 2, matched: 1, modified: 0, onlyInDestination: 1 });
    expect(summaries(r.onlyInDestination)).toEqual(['Autre']);
  });

  it('retrouve un événement dont l\'UID a changé à l\'import (même titre, même heure)', () => {
    const r = compare([E('google-1', 'Dentiste', '20250110T090000Z', '20250110T100000Z'), E('google-2', 'Nouveau', '20250111T090000Z', '20250111T100000Z')], [E('outlook-AAA', 'Dentiste', '20250110T090000Z', '20250110T100000Z')]);
    expect(summaries(r.toImport)).toEqual(['Nouveau']);
    expect(r.matched[0].by).toBe('content');
  });

  it('en mode « UID seul », un UID différent reste à importer ; en mode « contenu », seul le contenu compte', () => {
    const src = [E('google-1', 'Dentiste', '20250110T090000Z', '20250110T100000Z')];
    const dst = [E('outlook-AAA', 'Dentiste', '20250110T090000Z', '20250110T100000Z')];
    expect(compare(src, dst, { match: 'uid' }).counts.toImport).toBe(1);
    expect(compare(src, dst, { match: 'content' }).counts.toImport).toBe(0);
    const sameUid = compare([E('u', 'Titre 1', '20250110T090000Z', '20250110T100000Z')], [E('u', 'Titre 2', '20250110T090000Z', '20250110T100000Z')], { match: 'content' });
    expect(sameUid.counts.toImport).toBe(1);
  });

  it('détecte les événements modifiés (même UID, contenu différent) et peut les inclure', () => {
    const src = [E('1', 'Réunion', '20250110T090000Z', '20250110T100000Z', ['LOCATION:Salle 2'])];
    const dst = [E('1', 'Réunion', '20250110T100000Z', '20250110T110000Z', ['LOCATION:Salle 1'])];
    const r = compare(src, dst);
    expect(r.counts).toMatchObject({ toImport: 0, modified: 1 });
    expect(r.modified[0].changes).toEqual(['start', 'end', 'location']);
    expect(compare(src, dst, { includeModified: true }).counts.toImport).toBe(1);
  });

  it('compare des heures équivalentes exprimées dans des fuseaux différents', () => {
    const r = compare([E('1', 'Appel', '20250110T090000Z', '20250110T100000Z')], [E('2', 'Appel', '20250110T100000', '20250110T110000')]); // 10:00 Paris = 09:00 UTC
    expect(r.counts.toImport).toBe(0);
  });

  it('gère les jours entiers, la casse du titre et l\'option « ignorer la fin »', () => {
    expect(compare([E('1', 'Congés', '20250110', '20250111')], [E('2', 'Congés', '20250110', '20250111')]).counts.toImport).toBe(0);
    expect(compare([E('1', 'RÉUNION', '20250110T090000Z', '20250110T100000Z')], [E('2', 'réunion', '20250110T090000Z', '20250110T100000Z')]).counts.toImport).toBe(0);
    expect(compare([E('1', 'RÉUNION', '20250110T090000Z', '20250110T100000Z')], [E('2', 'réunion', '20250110T090000Z', '20250110T100000Z')], { ignoreCase: false }).counts.toImport).toBe(1);
    expect(compare([E('1', 'X', '20250110T090000Z', '20250110T100000Z')], [E('2', 'X', '20250110T090000Z', '20250110T113000Z')]).counts.toImport).toBe(1);
    expect(compare([E('1', 'X', '20250110T090000Z', '20250110T100000Z')], [E('2', 'X', '20250110T090000Z', '20250110T113000Z')], { ignoreEnd: true }).counts.toImport).toBe(0);
  });

  it('traite les doublons : un doublon de la source n\'est importé qu\'une fois, ceux de la destination sont signalés', () => {
    const r = compare(
      [E('1', 'Même', '20250110T090000Z', '20250110T100000Z'), E('2', 'Même', '20250110T090000Z', '20250110T100000Z')],
      [E('8', 'Double', '20250120T090000Z', '20250120T100000Z'), E('9', 'Double', '20250120T090000Z', '20250120T100000Z')],
    );
    expect(r.counts.toImport).toBe(1);
    expect(r.removedDuplicates).toBe(1);
    expect(r.duplicatesSource).toHaveLength(1);
    expect(r.duplicatesDestination).toHaveLength(1);
    expect(compare([E('1', 'Même', '20250110T090000Z', '20250110T100000Z'), E('2', 'Même', '20250110T090000Z', '20250110T100000Z')], [], { dedupe: false }).counts.toImport).toBe(2);
  });

  it('consomme chaque événement de destination une seule fois', () => {
    const r = compare([E('1', 'X', '20250110T090000Z', '20250110T100000Z'), E('2', 'X', '20250110T090000Z', '20250110T100000Z')], [E('9', 'X', '20250110T090000Z', '20250110T100000Z')], { dedupe: false });
    expect(r.counts).toMatchObject({ matched: 1, toImport: 1 });
  });

  it('signale une exception de série orpheline', () => {
    const exception = E('serie', 'Cours', '20250117T090000Z', '20250117T100000Z', ['RECURRENCE-ID:20250117T090000Z']);
    expect(compare([exception], []).orphanExceptions).toHaveLength(1);
    const master = E('serie', 'Cours', '20250110T090000Z', '20250110T100000Z', ['RRULE:FREQ=WEEKLY']);
    expect(compare([exception], [master]).orphanExceptions).toHaveLength(0);
    expect(compare([master, exception], []).orphanExceptions).toHaveLength(0);
  });

  it('produit un .ics importable à partir du résultat', () => {
    const src = parsed(ics([E('1', 'A', '20250110T090000Z', '20250110T100000Z'), E('2', 'B', '20250111T090000Z', '20250111T100000Z')]));
    const dst = parsed(ics([E('1', 'A', '20250110T090000Z', '20250110T100000Z')]));
    const r = compareCalendars(src, dst);
    const out = parsed(buildCalendar({ calendar: src.calendars[0], events: r.toImport.map((d) => d.event), timezones: src.timezones }));
    expect(out.events.map((e) => propValue(e, 'SUMMARY'))).toEqual(['B']);
  });
});
