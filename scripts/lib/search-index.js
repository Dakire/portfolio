// Index de la palette de commandes (/search-index.json) : pages, sections de l'accueil, articles et actions, pour chaque langue.
// Chargé à la première ouverture de la palette (public/js/palette.js), jamais avec la page.

/**
 * @param {object} o
 * @param {Record<string, object>} o.data   PORTFOLIO_DATA
 * @param {Record<string, object>} o.langs  LANGS
 * @param {object} o.profile                PROFILE
 * @param {Record<string, object>} o.palette  PALETTE (textes et mots-clés)
 * @param {string[]} o.sections             SECTION_IDS
 * @param {Record<string, object[]>} o.posts  articles par langue (title, description, slug)
 * @param {(post: object) => string} o.postPath
 */
export function buildSearchIndex({ data, langs, profile, palette, sections, posts, postPath }) {
  const index = {};
  for (const lang of Object.keys(langs)) {
    const p = palette[lang];
    const l = langs[lang];
    const t = data[lang];
    const k = p.keywords;

    const actions = [
      { id: 'theme', action: 'theme' },
      { id: 'lang', action: 'lang' },
      { id: 'email', action: 'copy', value: profile.email },
      { id: 'cv', url: t.hero.cvLink, external: true },
      { id: 'github', url: profile.github, external: true },
      { id: 'linkedin', url: profile.linkedin, external: true },
      { id: 'rss', url: l.rss },
      { id: 'top', action: 'top' },
    ].map(({ id, ...rest }) => ({ group: 'actions', title: p.actions[id], keywords: k[id], ...rest }));

    const pages = [
      { id: 'home', url: l.home },
      { id: 'blog', url: l.blog },
      { id: 'dns', url: l.dns },
      { id: 'legal', url: l.legal },
    ].map(({ id, url }) => ({ group: 'pages', title: p.pages[id], keywords: k[id], url }));

    const sectionItems = sections.map((id) => ({ group: 'sections', title: t.nav[id], hint: p.sectionHint, keywords: k[id], url: `${l.home}#${id}` }));

    const articles = (posts[lang] ?? []).map((post) => ({ group: 'articles', title: post.title, hint: post.description, url: postPath(post) }));

    index[lang] = {
      ui: { label: p.label, placeholder: p.placeholder, loading: p.loading, error: p.error, empty: p.empty, count: p.count, hints: p.hints, close: p.close, copied: p.copied, groups: p.groups },
      items: [...actions, ...pages, ...sectionItems, ...articles],
    };
  }
  return index;
}
