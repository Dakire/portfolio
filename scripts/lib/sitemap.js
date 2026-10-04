import { SITE } from './page.js';

// Sitemap volontairement « pur » (sitemap.xsd uniquement) : les hreflang sont déjà déclarés dans le <head> de chaque page,
// et les balises xhtml:link du sitemap font échouer certains validateurs XSD (attribut xml:lang non déclaré).
const entry = ({ path, lastmod }) => `  <url>\n    <loc>${SITE}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;

/** entries : [{ path, lastmod: 'AAAA-MM-JJ' }] */
export const buildSitemap = (entries) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(entry).join('\n')}\n</urlset>\n`;

/** tools : [{ fr: { name, url, description }, en: {...} }] */
export const buildLlmsTxt = (base, postsByLang, blogPath, tools = []) => {
  const list = (posts) => posts.map((p) => `- [${p.title}](${SITE}${blogPath(p)}) : ${p.description}`).join('\n');
  const toolList = (lang) => tools.map((t) => `- [${t[lang].name}](${SITE}${t[lang].url}) : ${t[lang].description}`).join('\n');
  const toolsBlock = tools.length ? `\n\n## Outils en ligne (français)\n${toolList('fr')}\n\n## Online tools (English)\n${toolList('en')}` : '';
  return `${base.trimEnd()}${toolsBlock}\n\n## Articles de blog (français)\n${list(postsByLang.fr)}\n\n## Blog articles (English)\n${list(postsByLang.en)}\n`;
};
