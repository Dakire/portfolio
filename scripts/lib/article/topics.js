// Liste de sujets à traiter (content/topics.json), tenue à la main. Le générateur prend le premier « todo » et le marque « done ».
import { readFileSync, writeFileSync } from 'node:fs';
import { topicsFile } from './site.js';

export const readTopics = (file = topicsFile()) => JSON.parse(readFileSync(file, 'utf-8'));

/** Sujet demandé par identifiant ou texte libre, sinon le premier « todo » ; null si la liste est épuisée (le modèle propose alors un sujet). */
export function pickTopic(topics, { id, text } = {}) {
  if (text) return { id: null, topic: text, angle: '' };
  if (id) {
    const found = topics.find((t) => t.id === id);
    if (!found) throw new Error(`Sujet inconnu : ${id}`);
    return found;
  }
  return topics.find((t) => t.status === 'todo') ?? null;
}

export function markDone(topics, id, { slug, date }) {
  return topics.map((t) => (t.id === id ? { ...t, status: 'done', slug, date } : t));
}

export const saveTopics = (topics, file = topicsFile()) => writeFileSync(file, `${JSON.stringify(topics, null, 2)}\n`);
