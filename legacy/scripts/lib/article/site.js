// Ce que le générateur doit savoir du site : articles existants (pour ne pas se répéter) et liens internes autorisés.
import { readdirSync, readFileSync } from 'node:fs';
import { TOOLS, toolPath, toolUi } from '../../../src/data/tools/index.js';
import { parseFrontMatter } from '../markdown.js';
import { root } from '../paths.js';

const DIRS = { fr: 'content/blog', en: 'content/blog/en' };
const BLOG = { fr: '/blog/', en: '/en/blog/' };

/** Articles d'une langue : [{ slug, title, description, date, translationOf }] */
export function listArticles(lang) {
  return readdirSync(root(DIRS[lang]))
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const slug = f.replace(/\.md$/, '');
      const { meta } = parseFrontMatter(readFileSync(root(`${DIRS[lang]}/${f}`), 'utf-8'), slug);
      return { slug, ...meta };
    });
}

/** Liens internes qu'un article peut contenir dans cette langue : accueil, blog, articles existants, pages d'outils. */
export function allowedLinks(lang) {
  const home = lang === 'fr' ? '/' : '/en/';
  return new Set([home, BLOG[lang], ...listArticles(lang).map((a) => `${BLOG[lang]}${a.slug}/`), ...TOOLS.map((t) => toolPath(t, lang))]);
}

/** Description des liens autorisés pour le modèle : « chemin : de quoi il s'agit ». */
export function linkCatalog(lang) {
  const articles = listArticles(lang).map((a) => `- ${BLOG[lang]}${a.slug}/ : article « ${a.title} »`);
  const tools = TOOLS.map((t) => `- ${toolPath(t, lang)} : outil gratuit « ${toolUi(t, lang).name} » (${toolUi(t, lang).card})`);
  return [...articles, ...tools].join('\n');
}

export const articlePath = (lang, slug) => root(`${DIRS[lang]}/${slug}.md`);
export const topicsFile = () => root('content/topics.json');
