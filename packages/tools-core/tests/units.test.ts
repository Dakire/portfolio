import { describe, expect, it } from 'vitest';
import {
  convertData,
  convertRate,
  describeInteger,
  durationParts,
  parseInteger,
  parseNumber,
  plain,
  toBitsPerSecond,
  toBytes,
  transferSeconds,
} from '../src/units.js';

const get = (list, id) => list.find((u) => u.id === id).value;

describe('parseNumber', () => {
  it.each([
    ['1024', 1024],
    ['1,5', 1.5],
    ['1.5', 1.5],
    ['1 024,5', 1024.5],
    ['1 024', 1024],
    ['1_000', 1000],
    ['.5', 0.5],
    ['2e3', 2000],
    ['0', 0],
  ])('lit %j', (text, value) => expect(parseNumber(text)).toEqual({ value }));

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['abc', 'invalid'],
    ['1.2.3', 'invalid'],
    ['12px', 'invalid'],
    ['1e', 'invalid'],
    ['-5', 'negative'],
    ['1e22', 'tooLarge'],
    ['1e999', 'tooLarge'],
  ])('rejette %j (%s)', (text, error) => expect(parseNumber(text)).toEqual({ error }));
});

describe('tailles de données', () => {
  it('distingue SI (1000) et CEI (1024)', () => {
    const r = convertData(1, 'GB');
    expect(get(r, 'MB')).toBe(1000);
    expect(get(r, 'GiB')).toBeCloseTo(0.931322575, 9);
    const i = convertData(1, 'GiB');
    expect(get(i, 'MiB')).toBe(1024);
    expect(get(i, 'GB')).toBeCloseTo(1.073741824, 9);
  });

  it('gère les bits et les octets', () => {
    expect(get(convertData(1, 'B'), 'bit')).toBe(8);
    expect(get(convertData(8, 'bit'), 'B')).toBe(1);
    expect(get(convertData(1, 'kB'), 'bit')).toBe(8000);
  });

  it('un disque « 500 Go » fait environ 465,66 GiB', () => {
    expect(get(convertData(500, 'GB'), 'GiB')).toBeCloseTo(465.661287, 5);
  });

  it('zéro reste zéro', () => {
    for (const u of convertData(0, 'TB')) expect(u.value).toBe(0);
  });
});

describe('débits', () => {
  it('8 bits = 1 octet', () => {
    expect(get(convertRate(1, 'MB/s'), 'Mbit/s')).toBe(8);
    expect(get(convertRate(1, 'Gbit/s'), 'MB/s')).toBe(125);
    expect(get(convertRate(100, 'Mbit/s'), 'MB/s')).toBe(12.5);
  });

  it('Gbit/s ↔ Mbit/s ↔ kbit/s', () => {
    expect(get(convertRate(1, 'Gbit/s'), 'Mbit/s')).toBe(1000);
    expect(get(convertRate(1, 'Mbit/s'), 'kbit/s')).toBe(1000);
  });
});

describe('temps de transfert', () => {
  it('1 Go à 100 Mbit/s = 80 s ; avec 80 % de rendement = 100 s', () => {
    const bytes = toBytes(1, 'GB');
    const bps = toBitsPerSecond(100, 'Mbit/s');
    expect(transferSeconds(bytes, bps)).toBe(80);
    expect(transferSeconds(bytes, bps, 80)).toBe(100);
  });

  it('un débit nul donne une durée infinie, jamais NaN', () => {
    expect(transferSeconds(1000, 0)).toBe(Infinity);
  });

  it('décompose en jours, heures, minutes et secondes', () => {
    expect(durationParts(90_061)).toEqual({
      days: 1,
      hours: 1,
      minutes: 1,
      seconds: 1,
      milliseconds: 0,
    });
    expect(durationParts(59.6)).toMatchObject({ minutes: 1, seconds: 0 });
    expect(durationParts(0.0123)).toMatchObject({ seconds: 0, milliseconds: 12 });
    expect(durationParts(Infinity)).toBeNull();
  });
});

describe('plain', () => {
  it("évite la notation exponentielle et les erreurs d'arrondi", () => {
    expect(plain(0.1 + 0.2)).toBe('0.3');
    expect(plain(1_000_000)).toBe('1000000');
    expect(plain(0)).toBe('0');
    expect(plain(1 / 3)).toBe('0.3333333333');
    expect(plain(2e22)).toMatch(/e\+22$/);
  });
});

describe('bases numériques', () => {
  it('lit chaque base, avec ou sans préfixe, en minuscules ou majuscules', () => {
    expect(parseInteger('255', 10).value).toBe(255n);
    expect(parseInteger('ff', 16).value).toBe(255n);
    expect(parseInteger('0xFF', 16).value).toBe(255n);
    expect(parseInteger('1111 1111', 2).value).toBe(255n);
    expect(parseInteger('0b1111_1111', 2).value).toBe(255n);
    expect(parseInteger('377', 8).value).toBe(255n);
    expect(parseInteger('0o377', 8).value).toBe(255n);
    expect(parseInteger('-0x10', 16).value).toBe(-16n);
    expect(parseInteger('+7', 10).value).toBe(7n);
  });

  it('« b » est un chiffre hexadécimal, pas un préfixe binaire', () => {
    expect(parseInteger('0b1', 16).value).toBe(0xb1n);
  });

  it.each([
    ['', 10, 'empty'],
    ['12a', 10, 'invalid'],
    ['102', 2, 'invalid'],
    ['9', 8, 'invalid'],
    ['xyz', 16, 'invalid'],
    ['0x', 16, 'invalid'],
    ['-', 10, 'invalid'],
    ['1'.repeat(513), 10, 'tooLong'],
  ])('rejette %j en base %i (%s)', (text, base, error) =>
    expect(parseInteger(text, base)).toEqual({ error }),
  );

  it('ne perd aucune précision au-delà de 2^53', () => {
    const big = parseInteger('18446744073709551615', 10).value;
    expect(describeInteger(big)).toMatchObject({
      hex: 'FFFFFFFFFFFFFFFF',
      bits: 64,
      oct: '1777777777777777777777',
    });
  });

  it('décrit un entier : groupes de 4 bits, taille, signe', () => {
    expect(describeInteger(255n)).toMatchObject({
      dec: '255',
      hex: 'FF',
      bin: '11111111',
      binGrouped: '1111 1111',
      oct: '377',
      bits: 8,
      negative: false,
    });
    expect(describeInteger(5n).binGrouped).toBe('0101');
    expect(describeInteger(0n)).toMatchObject({ dec: '0', hex: '0', bin: '0', bits: 1 });
    expect(describeInteger(-10n)).toMatchObject({
      dec: '-10',
      hex: '-A',
      bin: '-1010',
      negative: true,
    });
  });
});
