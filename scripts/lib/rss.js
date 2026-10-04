// Flux RSS 2.0 du blog (un par langue), généré au build à partir des articles déjà analysés.
import { toIso } from './dates.js';
import { esc } from './markdown.js';
import { SITE } from './page.js';

// Les lecteurs RSS affichent le contenu hors du site : les liens et images relatifs doivent devenir absolus.
export const absolutize = (html) => html.replace(/(href|src)="\/(?!\/)/g, `$1="${SITE}/`);

// CDATA ne peut pas contenir « ]]> » : on le coupe en deux sections.
const cdata = (s) => `<![CDATA[${s.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;

const rfc822 = (date) => new Date(toIso(date)).toUTCString();

/**
 * @param {object} o
 * @param {string} o.lang        'fr' | 'en'
 * @param {string} o.title       nom du blog
 * @param {string} o.description description du flux
 * @param {string} o.blogPath    chemin de l'index du blog (ex. '/blog/')
 * @param {string} o.feedPath    chemin du flux lui-même (ex. '/rss.xml')
 * @param {string} o.author      nom de l'auteur
 * @param {(post: object) => string} o.postPath  chemin d'un article
 * @param {object[]} o.posts     articles (du plus récent au plus ancien)
 */
export function buildRss({ lang, title, description, blogPath, feedPath, author, postPath, posts }) {
  const newest = posts.map((p) => p.updated ?? p.date).sort().at(-1);
  const items = posts.map((p) => {
    const url = `${SITE}${postPath(p)}`;
    return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <dc:creator>${esc(author)}</dc:creator>
      <description>${esc(p.description)}</description>
      <content:encoded>${cdata(absolutize(p.html))}</content:encoded>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(title)}</title>
    <link>${SITE}${blogPath}</link>
    <description>${esc(description)}</description>
    <language>${lang === 'fr' ? 'fr-FR' : 'en'}</language>
    <atom:link href="${SITE}${feedPath}" rel="self" type="application/rss+xml" />${newest ? `\n    <lastBuildDate>${rfc822(newest)}</lastBuildDate>` : ''}
${items.join('\n')}
  </channel>
</rss>
`;
}
