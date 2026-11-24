import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OUT, SHEETS, buildPortalUi } from '../scripts/portal-ui.mjs';

// L'espace client reprend le design system du site (copie commitée, livrée sans Node) : la copie doit rester identique.
describe('design system de l’espace client', () => {
  it('ui.css est à jour (sinon : pnpm --filter @grichard/ui portal-ui)', async () => {
    const { css } = await buildPortalUi();
    expect(await readFile(join(OUT, 'ui.css'), 'utf-8')).toBe(css);
  });

  it('chaque police référencée est copiée, à l’octet près, et aucune autre', async () => {
    const { fonts } = await buildPortalUi();
    expect(fonts.length).toBeGreaterThan(0);
    expect((await readdir(join(OUT, 'fonts'))).sort()).toEqual(fonts.map((f) => f.name).sort());
    for (const { name, from } of fonts)
      expect(Buffer.compare(await readFile(join(OUT, 'fonts', name)), await readFile(from))).toBe(
        0,
      );
  });

  it('reprend les feuilles dans l’ordre des dépendances, sans chemin vers node_modules', async () => {
    const { css } = await buildPortalUi();
    const at = SHEETS.map((s) => css.indexOf(`/* ---- ${s} ---- */`));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(css).not.toContain('node_modules');
  });
});
