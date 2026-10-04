import { SITE } from './page.js';

// Sitemap volontairement « pur » (sitemap.xsd uniquement) : les hreflang sont déjà déclarés dans le <head> de chaque page,
// et les balises xhtml:link du sitemap font échouer certains validateurs XSD (attribut xml:lang non déclaré).
const entry = ({ path, lastmod }) => `  <url>\n    <loc>${SITE}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;

/** entries : [{ path, lastmod: 'AAAA-MM-JJ' }] */
export const buildSitemap = (entries) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(entry).join('\n')}\n</urlset>\n`;

export const buildLlmsTxt = (base, postsByLang, blogPath) => {
  const list = (posts) => posts.map((p) => `- [${p.title}](${SITE}${blogPath(p)}) : ${p.description}`).join('\n');
  return `${base.trimEnd()}\n\n## Articles de blog (français)\n${list(postsByLang.fr)}\n\n## Blog articles (English)\n${list(postsByLang.en)}\n`;
};
