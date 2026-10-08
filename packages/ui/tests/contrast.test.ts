import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../src/tokens.css', import.meta.url), 'utf-8');

/** Variables d'un bloc de règles dont le sélecteur correspond. */
function tokens(selector: RegExp, source = css): Record<string, string> {
  const block =
    source.match(new RegExp(selector.source + String.raw`\s*\{([^}]*)\}`, 's'))?.[1] ?? '';
  return Object.fromEntries(
    [...block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [
      m[1]!,
      m[2]!.toLowerCase(),
    ]),
  );
}

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

const dark = tokens(/:root/);
// Le premier bloc :root contient aussi des variables non colorées : seules les couleurs hexadécimales sont lues.
const light = tokens(/:root\[data-theme='light'\]/);
const themes = { sombre: dark, clair: light } as const;

describe.each(Object.entries(themes))('thème %s', (_name, t) => {
  const surfaces = ['canvas', 'surface', 'raised'] as const;

  it.each(surfaces)('le texte lisible atteint 4.5:1 sur %s', (surface) => {
    for (const text of ['ink', 'body', 'muted', 'link', 'accent', 'danger', 'warn', 'ok']) {
      expect(ratio(t[text]!, t[surface]!), `${text} sur ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('le texte des boutons pleins atteint 4.5:1 sur le fond accent', () => {
    expect(ratio(t['accent-ink']!, t['accent-strong']!)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(surfaces)('les bordures de champs et de composants atteignent 3:1 sur %s', (surface) => {
    expect(ratio(t['line-strong']!, t[surface]!)).toBeGreaterThanOrEqual(3);
  });

  it('l’anneau de focus atteint 3:1 sur chaque surface', () => {
    for (const surface of surfaces)
      expect(ratio(t['focus']!, t[surface]!)).toBeGreaterThanOrEqual(3);
  });
});

describe('thème système sans JavaScript', () => {
  it('reprend exactement les couleurs du thème clair', () => {
    const media = css.match(/@media \(prefers-color-scheme: light\)\s*\{(.*)\n\}/s)?.[1] ?? '';
    expect(tokens(/:root:not\(\[data-theme\]\)/, media)).toEqual(light);
  });
});
