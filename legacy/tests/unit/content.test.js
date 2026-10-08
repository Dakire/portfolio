import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LANGS, PORTFOLIO_DATA, SECTION_IDS } from '../../src/data/content.js';
import { parsePost } from '../../scripts/lib/markdown.js';

// Liste les chemins de toutes les valeurs d'un objet (tableaux : taille seulement, le contenu varie d'une langue à l'autre).
const paths = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === 'object' && !Array.isArray(value) ? paths(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );

describe('content.js : parité FR / EN', () => {
  it('les deux langues ont exactement les mêmes clés', () => {
    expect(paths(PORTFOLIO_DATA.en).sort()).toEqual(paths(PORTFOLIO_DATA.fr).sort());
  });

  it.each(['skills', 'experiences', 'projects', 'education', 'legal.sections'])('%s : même nombre d\'éléments', (key) => {
    const count = (lang) => key.split('.').reduce((o, k) => o[k], PORTFOLIO_DATA[lang]).length;
    expect(count('en')).toBe(count('fr'));
  });

  it('aucune valeur texte n\'est vide', () => {
    for (const lang of ['fr', 'en']) {
      const walk = (value, where) => {
        if (typeof value === 'string') expect(value.trim(), `${lang}: ${where}`).not.toBe('');
        else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => walk(v, `${where}.${k}`));
      };
      walk(PORTFOLIO_DATA[lang], '');
    }
  });

  it('chaque section du menu a son libellé dans les deux langues', () => {
    for (const lang of ['fr', 'en']) for (const id of SECTION_IDS) expect(PORTFOLIO_DATA[lang].nav[id]).toBeTruthy();
  });

  it('les langues se désignent mutuellement', () => {
    expect(LANGS[LANGS.fr.other].other).toBe('fr');
    expect(LANGS.en.home).toBe('/en/');
  });
});

describe('articles de blog', () => {
  const load = (dir, lang) =>
    readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => parsePost(f.replace(/\.md$/, ''), readFileSync(`${dir}/${f}`, 'utf-8'), lang, 'Tableau'));
  const fr = load('content/blog', 'fr');
  const en = load('content/blog/en', 'en');

  it('tous les articles ont un front matter valide', () => {
    expect(fr.length).toBeGreaterThan(0);
    expect(en.length).toBeGreaterThan(0);
  });

  it('chaque traduction anglaise pointe vers un article français existant, une seule fois', () => {
    const frSlugs = new Set(fr.map((p) => p.slug));
    const targets = en.map((p) => p.translationOf);
    for (const target of targets) expect(frSlugs.has(target), `translationOf inconnu : ${target}`).toBe(true);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it('les scripts déclarés existent dans public/js', () => {
    for (const post of [...fr, ...en].filter((p) => p.script)) {
      expect(() => readFileSync(`public${post.script}`), post.script).not.toThrow();
    }
  });

  it('les slugs sont uniques par langue', () => {
    expect(new Set(fr.map((p) => p.slug)).size).toBe(fr.length);
    expect(new Set(en.map((p) => p.slug)).size).toBe(en.length);
  });
});
