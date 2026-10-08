// Contrôles automatiques d'un article produit par le modèle, avant toute écriture sur le disque.
// Ils ne remplacent pas la relecture : ils écartent les erreurs mécaniques (format, liens internes inventés, HTML, longueur).
import { parseFrontMatter } from '../markdown.js';

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+){2,12}$/;
const LIMITS = { words: [700, 1600], title: [30, 90], description: [90, 200], h2: [3, 12], sources: [2, 8] };

const FORBIDDEN_PHRASES = [/en tant qu['’]ia\b/i, /as an ai\b/i, /voici (l['’]article|le texte)/i, /here is the article/i, /```markdown/i, /\bj['’]ai constaté chez/i, /i have seen at (a|one) client/i];

/** Retire les blocs et extraits de code : leur contenu (balises, commandes) n'est pas du texte à contrôler. */
const withoutCode = (md) => md.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');

export const countWords = (md) => withoutCode(md).split(/\s+/).filter(Boolean).length;

/** Liens d'un corps Markdown : [{ text, url }]. */
export function linksOf(md) {
  return [...withoutCode(md).matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)].map((m) => ({ text: m[1], url: m[2] }));
}

/**
 * Contrôle un article d'une langue. `allowed` : chemins internes autorisés ; `taken` : slugs déjà utilisés dans cette langue.
 * @returns {string[]} problèmes (vide si l'article est acceptable)
 */
export function validateArticle(article, { lang, allowed, taken }) {
  const problems = [];
  const where = lang.toUpperCase();
  const fail = (msg) => problems.push(`${where} : ${msg}`);
  const { slug, title, description, body } = article;

  if (!SLUG.test(slug ?? '')) fail(`slug invalide « ${slug} » (minuscules, chiffres et tirets, 3 à 13 mots)`);
  else if (taken.has(slug)) fail(`le slug « ${slug} » existe déjà`);
  if (!title || title.length < LIMITS.title[0] || title.length > LIMITS.title[1]) fail(`titre de ${title?.length ?? 0} caractères (attendu ${LIMITS.title.join(' à ')})`);
  if (/^["«“]|["»”]$|[\n\r]/.test(title ?? '')) fail('le titre ne doit ni être entre guillemets ni contenir de saut de ligne');
  if (!description || description.length < LIMITS.description[0] || description.length > LIMITS.description[1]) fail(`description de ${description?.length ?? 0} caractères (attendu ${LIMITS.description.join(' à ')})`);
  if (/[\n\r]/.test(description ?? '')) fail('la description tient sur une seule ligne');
  if (!body || typeof body !== 'string') {
    fail('corps vide');
    return problems;
  }

  const words = countWords(body);
  if (words < LIMITS.words[0] || words > LIMITS.words[1]) fail(`${words} mots (attendu ${LIMITS.words.join(' à ')})`);
  if (/^---\s*$/m.test(body.split('\n').slice(0, 2).join('\n')) || /^(title|description|date|translationOf):/m.test(body.split('\n').slice(0, 6).join('\n'))) fail('le corps contient un front matter');
  if (/^# /m.test(withoutCode(body))) fail('titre de niveau 1 interdit dans le corps');
  if (/^#{4,}\s/m.test(withoutCode(body))) fail('titres de niveau 4 et plus interdits');
  const h2 = [...withoutCode(body).matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
  if (h2.length < LIMITS.h2[0] || h2.length > LIMITS.h2[1]) fail(`${h2.length} sections « ## » (attendu ${LIMITS.h2.join(' à ')})`);
  if (h2.at(-1) !== 'Sources') fail('la dernière section doit s\'intituler « ## Sources »');
  if ((body.match(/^```/gm) ?? []).length % 2 !== 0) fail('bloc de code non fermé');
  if (/—/.test(body) || /—/.test(title ?? '')) fail('tiret cadratin interdit');
  if (/<\/?[a-z][^>]*>/i.test(withoutCode(body))) fail('HTML interdit dans le corps');
  for (const re of FORBIDDEN_PHRASES) if (re.test(body)) fail(`formule interdite (${re})`);

  const links = linksOf(body);
  for (const { url } of links) {
    if (url.startsWith('/')) {
      if (!allowed.has(url.split('#')[0])) fail(`lien interne inconnu : ${url}`);
    } else if (!url.startsWith('https://')) fail(`lien externe non sécurisé ou inattendu : ${url}`);
  }
  const sourcesBlock = body.split(/^## Sources\s*$/m)[1] ?? '';
  const sources = linksOf(sourcesBlock).filter((l) => l.url.startsWith('https://'));
  if (sources.length < LIMITS.sources[0] || sources.length > LIMITS.sources[1]) fail(`${sources.length} liens dans « Sources » (attendu ${LIMITS.sources.join(' à ')})`);
  if (!links.some((l) => l.url.startsWith('/'))) fail('aucun lien interne');
  return problems;
}

/** Contrôles qui portent sur la paire FR/EN. */
export function validatePair(fr, en) {
  const problems = [];
  const h2 = (b) => (withoutCode(b).match(/^## /gm) ?? []).length;
  if (Math.abs(h2(fr.body) - h2(en.body)) > 1) problems.push(`le plan diffère entre le français (${h2(fr.body)} sections) et l'anglais (${h2(en.body)})`);
  const code = (b) => (b.match(/^```/gm) ?? []).length;
  if (code(fr.body) !== code(en.body)) problems.push('le français et l\'anglais n\'ont pas le même nombre de blocs de code');
  if (fr.slug === en.slug) problems.push('le slug anglais doit différer du slug français');
  return problems;
}

/** Texte final d'un article, avec son front matter, relu par le même parseur que le build (une erreur ici ferait échouer le build). */
export function renderArticle({ title, description, body }, { date, translationOf }, name) {
  const lines = ['---', `title: ${title}`, `description: ${description}`, `date: ${date}`];
  if (translationOf) lines.push(`translationOf: ${translationOf}`);
  const text = `${lines.join('\n')}\n---\n\n${body.trim()}\n`;
  parseFrontMatter(text, name);
  return text;
}
