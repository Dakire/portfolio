// Section « Référence » : sources YAML valides, index JSON à jour (commités), données saines.
// Si ce test échoue après une modification d'un .yml : `pnpm --filter @grichard/web reference:build`.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error module JavaScript sans types (script de génération)
import { OUT_DIR, computeOutputs, vendorMiniSearch } from '../../scripts/reference/lib.mjs';

const outputs = computeOutputs() as Record<string, string>;

describe('index de la référence', () => {
  it.each(Object.entries(outputs))('%s est à jour', (name, content) => {
    expect(readFileSync(join(OUT_DIR as string, name), 'utf-8')).toBe(content);
  });

  it('MiniSearch local correspond à la version installée', () => {
    const vendor = vendorMiniSearch() as { name: string; content: string };
    const file = join(process.cwd(), 'public', 'js', 'libs', vendor.name);
    expect(readFileSync(file, 'utf-8')).toBe(vendor.content);
  });

  it('chaque fichier JSON est listé dans index.json et réciproquement', () => {
    const index = JSON.parse(readFileSync(join(OUT_DIR, 'index.json'), 'utf-8')) as {
      refs: { id: string; count: number }[];
    };
    const files = readdirSync(OUT_DIR as string)
      .filter((f) => f.endsWith('.json') && f !== 'index.json')
      .map((f) => f.replace(/\.json$/, ''))
      .sort();
    expect(index.refs.map((r) => r.id).sort()).toEqual(files);
  });

  const index = existsSync(join(OUT_DIR, 'index.json'))
    ? (JSON.parse(readFileSync(join(OUT_DIR, 'index.json'), 'utf-8')).refs as { id: string }[])
    : [];
  it.each(index.map((r) => r.id))('%s : entrées valides', (id) => {
    const data = JSON.parse(readFileSync(join(OUT_DIR, `${id}.json`), 'utf-8')) as {
      meta: { cats: { id: string }[]; count: number };
      entries: {
        id: string;
        cat: string;
        name: string;
        url: string;
        syn?: string;
        desc?: string;
      }[];
    };
    const cats = new Set(data.meta.cats.map((c) => c.id));
    const ids = new Set<string>();
    expect(data.entries.length).toBe(data.meta.count);
    for (const e of data.entries) {
      expect(ids.has(e.id), `identifiant en double : ${e.id}`).toBe(false);
      ids.add(e.id);
      expect(cats.has(e.cat), `${e.name} : catégorie ${e.cat}`).toBe(true);
      // Certaines références (touches BIOS) n'ont pas de page de documentation par entrée.
      if (e.url) expect(e.url, e.name).toMatch(/^https:\/\//);
      expect(Boolean(e.syn || e.desc), e.name).toBe(true);
    }
  });

  it('chaque référence a au moins les entrées promises', () => {
    const min: Record<string, number> = { 'powershell-m365': 40, 'windows-11': 40 };
    for (const [id, n] of Object.entries(min)) {
      const data = JSON.parse(readFileSync(join(OUT_DIR, `${id}.json`), 'utf-8'));
      expect(data.entries.length, id).toBeGreaterThanOrEqual(n);
    }
  });
});
