import { describe, expect, it } from 'vitest';
import { activeSets, crackSeconds, entropyBits, generatePassword, generatePin, generatePronounceable, poolSizeOf, pronounceableEntropy, randomInt, SETS, strengthOf } from '../../src/lib/password.js';

describe('randomInt', () => {
  it('reste dans [0, max[ et couvre toutes les valeurs', () => {
    const seen = new Set();
    for (let i = 0; i < 2000; i += 1) {
      const n = randomInt(6);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(6);
      seen.add(n);
    }
    expect(seen.size).toBe(6);
  });

  it('est uniforme (pas de biais de modulo) sur un grand échantillon', () => {
    const counts = Array(10).fill(0);
    const N = 100_000;
    for (let i = 0; i < N; i += 1) counts[randomInt(10)] += 1;
    for (const c of counts) expect(Math.abs(c - N / 10)).toBeLessThan(N / 10 * 0.05); // ±5 %
  });

  it('refuse un maximum invalide', () => {
    for (const bad of [0, -1, 1.5, 2 ** 33]) expect(() => randomInt(bad)).toThrow(RangeError);
    expect(randomInt(1)).toBe(0);
  });
});

describe('mot de passe', () => {
  const opts = { length: 20, lower: true, upper: true, digits: true, symbols: true };

  it('respecte la longueur et contient au moins un caractère de chaque jeu', () => {
    for (let i = 0; i < 200; i += 1) {
      const p = generatePassword(opts);
      expect(p).toHaveLength(20);
      expect(p).toMatch(/[a-z]/);
      expect(p).toMatch(/[A-Z]/);
      expect(p).toMatch(/\d/);
      expect([...p].some((c) => SETS.symbols.includes(c))).toBe(true);
    }
  });

  it('n\'utilise que les jeux demandés', () => {
    expect(generatePassword({ length: 30, lower: true, upper: false, digits: false, symbols: false })).toMatch(/^[a-z]{30}$/);
    expect(generatePassword({ length: 12, lower: false, upper: false, digits: true, symbols: false })).toMatch(/^\d{12}$/);
    expect(generatePassword({ length: 12, lower: false, upper: false, digits: false, symbols: false })).toBe('');
  });

  it('écarte les caractères ambigus si demandé', () => {
    const sets = activeSets({ lower: true, upper: true, digits: true, symbols: false, avoidAmbiguous: true }).join('');
    expect(sets).not.toMatch(/[O0oIl1]/);
    for (let i = 0; i < 100; i += 1) expect(generatePassword({ length: 40, avoidAmbiguous: true })).not.toMatch(/[O0oIl1]/);
  });

  it('borne la longueur et produit des mots de passe différents', () => {
    expect(generatePassword({ ...opts, length: 1 })).toHaveLength(4);
    expect(generatePassword({ ...opts, length: 9999 })).toHaveLength(256);
    expect(new Set(Array.from({ length: 50 }, () => generatePassword(opts))).size).toBe(50);
  });

  it('distribue chaque caractère de façon équilibrée', () => {
    const counts = {};
    for (let i = 0; i < 4000; i += 1) for (const c of generatePassword({ length: 10, lower: false, upper: false, digits: true, symbols: false })) counts[c] = (counts[c] ?? 0) + 1;
    for (const d of '0123456789') expect(Math.abs(counts[d] - 4000)).toBeLessThan(400); // 40 000 tirages / 10 chiffres
  });
});

describe('prononçable, PIN et robustesse', () => {
  it('génère un mot de passe prononçable et un PIN', () => {
    expect(generatePronounceable({ syllables: 6, digits: 2 })).toMatch(/^([A-Z][bcdfghjklmnprstvz][aeiou])+(?:[bcdfghjklmnprstvz][aeiou])*\d{2}$|^[A-Za-z]+\d{2}$/);
    expect(generatePronounceable({ syllables: 9, digits: 0, capitalize: false, separator: '-' })).toMatch(/^[a-z]{6}-[a-z]{6}-[a-z]{6}$/);
    expect(generatePin(6)).toMatch(/^\d{6}$/);
    expect(generatePin(1)).toHaveLength(3);
  });

  it('calcule l\'entropie et le niveau de robustesse', () => {
    expect(entropyBits(62, 10)).toBeCloseTo(59.5, 1);
    expect(entropyBits(1, 10)).toBe(0);
    expect(poolSizeOf({ lower: true, upper: true, digits: true, symbols: false })).toBe(62);
    expect(pronounceableEntropy({ syllables: 6, digits: 2 })).toBeCloseTo(6 * Math.log2(85) + 2 * Math.log2(10), 5);
    expect(strengthOf(20)).toBe('veryWeak');
    expect(strengthOf(40)).toBe('weak');
    expect(strengthOf(60)).toBe('fair');
    expect(strengthOf(80)).toBe('good');
    expect(strengthOf(120)).toBe('strong');
    expect(crackSeconds(60)).toBeGreaterThan(crackSeconds(50));
  });
});
