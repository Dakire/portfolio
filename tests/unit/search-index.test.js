import { describe, expect, it } from 'vitest';
import { buildSearchIndex } from '../../scripts/lib/search-index.js';
import { LANGS, PORTFOLIO_DATA, PROFILE, SECTION_IDS } from '../../src/data/content.js';
import { PALETTE } from '../../src/data/palette.js';

const posts = {
  fr: [{ slug: 'a', title: 'Titre A', description: 'Desc A' }],
  en: [{ slug: 'b', title: 'Title B', description: 'Desc B' }],
};
const index = buildSearchIndex({ data: PORTFOLIO_DATA, langs: LANGS, profile: PROFILE, palette: PALETTE, sections: SECTION_IDS, posts, postPath: (p) => `/x/${p.slug}/` });

describe('index de la palette', () => {
  it('contient les deux langues avec leurs textes d\'interface', () => {
    expect(Object.keys(index)).toEqual(['fr', 'en']);
    expect(index.fr.ui.placeholder).toMatch(/Rechercher/);
    expect(index.en.ui.placeholder).toMatch(/Search/);
  });

  it('chaque élément a un titre et une destination ou une action', () => {
    for (const lang of ['fr', 'en']) {
      for (const item of index[lang].items) {
        expect(item.title, JSON.stringify(item)).toBeTruthy();
        expect(Boolean(item.url) !== Boolean(item.action), JSON.stringify(item)).toBe(true);
        expect(['actions', 'pages', 'sections', 'articles']).toContain(item.group);
      }
    }
  });

  it('propose les sections de l\'accueil dans la langue de la page', () => {
    const sections = index.en.items.filter((i) => i.group === 'sections');
    expect(sections.map((s) => s.url)).toEqual(SECTION_IDS.map((id) => `/en/#${id}`));
    expect(sections[0].title).toBe('About');
  });

  it('ne mélange pas les articles des deux langues', () => {
    expect(index.fr.items.filter((i) => i.group === 'articles').map((i) => i.title)).toEqual(['Titre A']);
    expect(index.en.items.filter((i) => i.group === 'articles').map((i) => i.url)).toEqual(['/x/b/']);
  });

  it('marque les liens externes et fournit la valeur à copier', () => {
    const actions = index.fr.items.filter((i) => i.group === 'actions');
    expect(actions.find((a) => a.url === PROFILE.github).external).toBe(true);
    expect(actions.find((a) => a.action === 'copy').value).toBe(PROFILE.email);
  });

  it('chaque action et page a ses mots-clés dans les deux langues', () => {
    const keys = (o) => Object.keys(o).sort();
    expect(keys(PALETTE.en.keywords)).toEqual(keys(PALETTE.fr.keywords));
    expect(keys(PALETTE.en.actions)).toEqual(keys(PALETTE.fr.actions));
    expect(keys(PALETTE.en.pages)).toEqual(keys(PALETTE.fr.pages));
  });
});
