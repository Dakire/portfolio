// Articles de blog : front matter, Markdown -> HTML, sommaire et ancres.
import { marked } from 'marked';

export const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&[a-z#0-9]+;/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const FRONT_MATTER_KEYS = new Set(['title', 'description', 'date', 'updated', 'script', 'translationOf']);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Front matter volontairement minimal (« clé: valeur » sur une ligne) : les titres contiennent des « : »
 * qu'un parseur YAML strict refuserait sans guillemets. Les erreurs de saisie font échouer le build.
 */
export function parseFrontMatter(raw, name) {
  const m = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Front matter manquant dans ${name}.md`);

  const meta = {};
  m[1].split('\n').forEach((line, n) => {
    if (!line.trim()) return;
    const i = line.indexOf(':');
    if (i <= 0) throw new Error(`Front matter invalide dans ${name}.md (ligne ${n + 1}) : "${line}"`);
    const key = line.slice(0, i).trim();
    if (!FRONT_MATTER_KEYS.has(key)) throw new Error(`Clé de front matter inconnue dans ${name}.md : "${key}"`);
    if (key in meta) throw new Error(`Clé de front matter en double dans ${name}.md : "${key}"`);
    meta[key] = line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
  });

  for (const k of ['title', 'description', 'date']) if (!meta[k]) throw new Error(`"${k}" manquant dans ${name}.md`);
  for (const k of ['date', 'updated']) if (meta[k] && !DATE.test(meta[k])) throw new Error(`"${k}" doit être au format AAAA-MM-JJ dans ${name}.md : "${meta[k]}"`);
  return { meta, body: m[2] };
}

// Ajoute des ancres aux h2 (sommaire, liens profonds) et rend les tableaux défilables au clavier.
export function enhance(html, tableLabel) {
  const toc = [];
  const used = new Set();
  const withIds = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner) => {
    const text = inner.replace(/<[^>]+>/g, '');
    const base = slugify(text) || 'section';
    let id = base;
    for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
    used.add(id);
    toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  const withTables = withIds
    .replace(/<table>/g, `<div class="table-scroll" role="region" aria-label="${esc(tableLabel)}" tabindex="0"><table>`)
    .replace(/<\/table>/g, '</table></div>');
  return { html: withTables, toc };
}

export function parsePost(slug, raw, lang, tableLabel) {
  const { meta, body } = parseFrontMatter(raw, slug);
  const words = body.split(/\s+/).length;
  const { html, toc } = enhance(marked.parse(body), tableLabel);
  return { slug, lang, ...meta, html, toc, readingTime: Math.max(1, Math.round(words / 200)) };
}
