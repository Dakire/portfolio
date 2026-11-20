import { describe, expect, it } from 'vitest';
import { checkQr, contrastRatio, type CheckInput } from '../src/qr/checks';
import { BYTE_CAPACITY, buildMatrix, effectiveLevel } from '../src/qr/matrix';
import { renderSvg, logoBox } from '../src/qr/render';

const good: CheckInput = {
  foreground: '#000000',
  background: '#ffffff',
  margin: 4,
  pixelSize: 1024,
  size: 29,
  bytes: 40,
  level: 'M',
};
const ids = (input: Partial<CheckInput>) => checkQr({ ...good, ...input }).map((w) => w.id);

describe('garde-fous de lisibilité', () => {
  it('ne signale rien pour un réglage sain', () => {
    expect(checkQr(good)).toEqual([]);
  });
  it('contraste inférieur à 4:1 : erreur', () => {
    expect(ids({ foreground: '#888888', background: '#999999' })).toContain('contrast');
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });
  it('couleurs inversées (clair sur sombre)', () => {
    expect(ids({ foreground: '#ffffff', background: '#000000' })).toContain('inverted');
  });
  it('dégradé : le contraste est mesuré sur chaque couleur', () => {
    expect(ids({ foreground: '#000000', gradientTo: '#f0f0f0' })).toContain('contrast');
  });
  it('fond transparent : avertissement plutôt qu’un calcul faux', () => {
    expect(ids({ background: null })).toEqual(['transparent']);
  });
  it('logo de plus de 20 % de la surface', () => {
    // le côté est en proportion du code : la surface est son carré (0,45² = 20,25 %)
    expect(ids({ logoRatio: 0.5 })).toContain('logoSize');
    expect(ids({ logoRatio: 0.45 })).toContain('logoSize');
    expect(ids({ logoRatio: 0.44 })).not.toContain('logoSize');
    expect(ids({ logoRatio: 0.3 })).not.toContain('logoSize');
  });
  it('zone de silence inférieure à 4 modules', () => {
    expect(checkQr({ ...good, margin: 3 })[0]).toMatchObject({ id: 'quietZone', severity: 'warn' });
    expect(checkQr({ ...good, margin: 1 })[0]).toMatchObject({
      id: 'quietZone',
      severity: 'error',
    });
  });
  it('export trop petit pour la densité', () => {
    expect(ids({ pixelSize: 100 })).toContain('exportSize');
    expect(
      checkQr({ ...good, pixelSize: 80, size: 61 }).find((w) => w.id === 'exportSize')?.severity,
    ).toBe('error');
  });
  it('contenu proche de la capacité maximale', () => {
    expect(ids({ bytes: Math.round(BYTE_CAPACITY.M * 0.95) })).toContain('capacity');
  });
});

describe('niveau de correction et capacité', () => {
  it('un logo impose le niveau H', () => {
    expect(effectiveLevel('L', true)).toBe('H');
    expect(effectiveLevel('L', false)).toBe('L');
  });
  it('un contenu trop long est refusé proprement', () => {
    expect(buildMatrix('a'.repeat(BYTE_CAPACITY.H + 1), 'H')).toEqual({
      ok: false,
      error: 'capacity',
    });
    expect(buildMatrix('a'.repeat(BYTE_CAPACITY.L), 'L').ok).toBe(true);
  });
});

describe('rendu SVG', () => {
  const built = buildMatrix('https://grichard.eu/', 'M');
  if (!built.ok) throw new Error('matrice');
  const options = {
    moduleStyle: 'square',
    finderStyle: 'square',
    foreground: '#000000',
    background: '#ffffff',
    margin: 4,
    pixelSize: 300,
  } as const;

  it('produit un SVG sans script ni image externe', () => {
    const svg = renderSvg(built.matrix, options);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).not.toMatch(/<script|onload|href="http/i);
  });
  it('refuse une couleur ou un logo qui n’a pas la forme attendue (aucune injection dans le SVG)', () => {
    expect(() => renderSvg(built.matrix, { ...options, foreground: 'red" onload="x' })).toThrow();
    expect(() => renderSvg(built.matrix, { ...options, background: 'url(#x)' })).toThrow();
    expect(() =>
      renderSvg(built.matrix, {
        ...options,
        logo: { href: 'https://exemple.fr/x.png', ratio: 0.2, padding: 1, plate: true },
      }),
    ).toThrow();
    expect(() =>
      renderSvg(built.matrix, {
        ...options,
        logo: { href: 'data:image/svg+xml;base64,AAAA', ratio: 0.2, padding: 1, plate: true },
      }),
    ).toThrow();
  });
  it('fond transparent : aucune pastille de fond', () => {
    expect(renderSvg(built.matrix, { ...options, background: null })).not.toContain('<rect width');
  });
  it('la boîte du logo est centrée sur la grille', () => {
    const box = logoBox(29, { href: '', ratio: 0.2, padding: 1, plate: true });
    expect(box.start * 2 + box.side).toBe(29);
  });
});
