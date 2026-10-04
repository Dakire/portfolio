import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HUB } from '../../src/data/tools/hub.js';
import { TOOLS, TOOLS_BASE, toolPath, toolUi } from '../../src/data/tools/index.js';

const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${p}${k}.`) : [`${p}${k}`]));

describe('registre des outils', () => {
  it('chaque outil a un îlot, un composant enregistré et un identifiant unique', () => {
    const registry = readFileSync('src/components/tools/registry.jsx', 'utf-8');
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length);
    for (const tool of TOOLS) {
      expect(existsSync(`src/islands/tools/${tool.id}.jsx`), `îlot ${tool.id}`).toBe(true);
      expect(registry, `composant ${tool.id}`).toMatch(new RegExp(`(^|\\s)'?${tool.id}'?:`, 'm'));
    }
  });

  it('les adresses sont uniques, sous la page « Outils » de chaque langue', () => {
    for (const lang of ['fr', 'en']) {
      const paths = TOOLS.map((t) => toolPath(t, lang));
      expect(new Set(paths).size).toBe(paths.length);
      for (const p of paths) expect(p.startsWith(TOOLS_BASE[lang])).toBe(true);
    }
    expect(toolPath(TOOLS[0], 'fr')).toBe('/outils/dns/');
    expect(toolPath(TOOLS.find((t) => t.id === 'ics-compare'), 'en')).toBe('/en/tools/ics-compare/');
  });

  it('les textes de chaque outil existent dans les deux langues avec les mêmes clés', () => {
    for (const tool of TOOLS) {
      expect(keys(toolUi(tool, 'en')).sort(), `${tool.id}`).toEqual(keys(toolUi(tool, 'fr')).sort());
    }
  });

  it('chaque outil fournit ce que la page, la palette et le référencement attendent', () => {
    for (const tool of TOOLS) {
      for (const lang of ['fr', 'en']) {
        const ui = toolUi(tool, lang);
        for (const field of [ui.name, ui.card, ui.keywords, ui.h1, ui.intro, ui.meta.title, ui.meta.description, ui.meta.appDescription, ui.seo.how, ui.seo.howTitle, ui.seo.whatTitle]) {
          expect(String(field).trim(), `${tool.id} ${lang}`).not.toBe('');
        }
        expect(ui.seo.what.length, `${tool.id} ${lang} what`).toBeGreaterThanOrEqual(3);
        expect(ui.seo.faq.length, `${tool.id} ${lang} faq`).toBeGreaterThanOrEqual(3);
        expect(String(ui.seo.privacy ?? ui.privacy).trim(), `${tool.id} ${lang} privacy`).not.toBe('');
        expect(ui.meta.title.length, `${tool.id} ${lang} title`).toBeLessThanOrEqual(80);
        expect(ui.meta.description.length, `${tool.id} ${lang} description`).toBeLessThanOrEqual(260);
      }
    }
  });

  it('la page « Outils » a ses textes dans les deux langues', () => {
    expect(keys(HUB.en).sort()).toEqual(keys(HUB.fr).sort());
  });
});
