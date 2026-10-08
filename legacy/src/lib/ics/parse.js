// Analyse d'un fichier iCalendar (RFC 5545), tolérante : exports Google, Outlook, Apple, Thunderbird, fichiers concaténés,
// retours à la ligne mélangés, BOM, composants non fermés. Chaque composant garde ses lignes d'origine (dépliées) :
// les événements sont ré-écrits à l'identique, sans passer par une re-sérialisation qui pourrait les altérer.

/** Dépliage des lignes (RFC 5545 §3.1) : une ligne qui commence par un espace ou une tabulation prolonge la précédente. */
export function unfold(text) {
  return String(text)
    .replace(/^﻿/, '')
    .replace(/\r\n|\r/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n');
}

/** « DTSTART;TZID=Europe/Paris:20250101T100000 » -> { name, params: [[k, v]], value }. Les paramètres peuvent être entre guillemets. */
export function parseContentLine(line) {
  let i = 0;
  while (i < line.length && line[i] !== ';' && line[i] !== ':') i += 1;
  if (line[i] === undefined) return null;
  const name = line.slice(0, i).trim().toUpperCase();
  if (!name) return null;

  const params = [];
  while (line[i] === ';') {
    i += 1;
    let k = i;
    while (k < line.length && line[k] !== '=' && line[k] !== ':' && line[k] !== ';') k += 1;
    const key = line.slice(i, k).toUpperCase();
    i = k;
    let value = '';
    if (line[i] === '=') {
      i += 1;
      // Une valeur peut contenir plusieurs éléments entre guillemets, séparés par des virgules
      while (i < line.length && line[i] !== ';' && line[i] !== ':') {
        if (line[i] === '"') {
          const end = line.indexOf('"', i + 1);
          const stop = end < 0 ? line.length : end + 1;
          value += line.slice(i, stop);
          i = stop;
        } else {
          value += line[i];
          i += 1;
        }
      }
    }
    params.push([key, value.replace(/^"|"$/g, '')]);
  }
  if (line[i] !== ':') return null;
  return { name, params, value: line.slice(i + 1) };
}

/** Valeur texte iCalendar -> texte brut (\n, \, \; \\). */
export const unescapeText = (s) => String(s ?? '').replace(/\\([nN,;\\])/g, (_, c) => (c === 'n' || c === 'N' ? '\n' : c));

/**
 * @returns {{ root: object, events: object[], timezones: object[], calendars: object[], issues: string[] }}
 * Un composant : { type, props: [{ name, params, value }], children, lines } ; `lines` = lignes dépliées de BEGIN à END.
 */
export function parseIcs(text) {
  const lines = unfold(text);
  const root = { type: 'ROOT', props: [], children: [], lines: [] };
  const stack = [{ component: root, start: 0 }];
  const issues = [];

  lines.forEach((line, index) => {
    if (!line.trim()) return;
    const parsed = parseContentLine(line);
    if (!parsed) {
      issues.push(`ligne illisible ${index + 1}`);
      return;
    }
    const top = stack.at(-1);
    if (parsed.name === 'BEGIN') {
      const component = { type: parsed.value.trim().toUpperCase(), props: [], children: [], lines: [] };
      top.component.children.push(component);
      stack.push({ component, start: index });
    } else if (parsed.name === 'END') {
      const type = parsed.value.trim().toUpperCase();
      // END correspond au composant ouvert le plus proche de ce type ; les composants intermédiaires non fermés sont clos
      let depth = stack.length - 1;
      while (depth > 0 && stack[depth].component.type !== type) depth -= 1;
      if (depth === 0) {
        issues.push(`END:${type} sans BEGIN`);
        return;
      }
      while (stack.length - 1 > depth) {
        const open = stack.pop();
        open.component.lines = lines.slice(open.start, index).filter((l) => l.trim());
        issues.push(`${open.component.type} non fermé`);
      }
      const closed = stack.pop();
      closed.component.lines = lines.slice(closed.start, index + 1).filter((l) => l.trim());
    } else {
      top.component.props.push(parsed);
    }
  });
  while (stack.length > 1) {
    const open = stack.pop();
    open.component.lines = lines.slice(open.start).filter((l) => l.trim());
    issues.push(`${open.component.type} non fermé`);
  }

  const events = [];
  const timezones = [];
  const calendars = [];
  const visit = (component) => {
    if (component.type === 'VCALENDAR') calendars.push(component);
    if (component.type === 'VEVENT') events.push(component);
    if (component.type === 'VTIMEZONE') timezones.push(component);
    component.children.forEach(visit);
  };
  visit(root);

  return { root, events, timezones, calendars, issues };
}

// --- Accès aux propriétés d'un composant ---

export const props = (component, name) => component.props.filter((p) => p.name === name);
export const prop = (component, name) => props(component, name)[0];
export const propValue = (component, name) => prop(component, name)?.value ?? '';
export const param = (p, name) => p?.params.find(([k]) => k === name)?.[1];

/** UID + RECURRENCE-ID : identité d'un événement (une exception d'une série partage l'UID de son maître). */
export const eventUid = (event) => propValue(event, 'UID').trim();
export const eventKey = (event) => `${eventUid(event)}|${propValue(event, 'RECURRENCE-ID').trim()}`;
