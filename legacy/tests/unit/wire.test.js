import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseTxtData } from '../../src/lib/dns/resolver.js';
import { decodeResponse, encodeQuery, toBase64Url } from '../../src/lib/dns/wire.js';
import { buildResponse } from '../helpers/dns-wire.js';

// Réponses réelles d'un résolveur public (format binaire), avec les enregistrements que son API JSON renvoyait au même moment.
const FIXTURES = JSON.parse(readFileSync('tests/fixtures/dns-wire.json', 'utf-8'));
const bytes = (hex) => Uint8Array.from(hex.match(/../g).map((h) => parseInt(h, 16)));
const byData = (a, b) => a.data.localeCompare(b.data); // les résolveurs mélangent l'ordre des enregistrements
const text = (record) => (record.type === 16 ? parseTxtData(record.data).text : record.data); // le JSON de Google n'entoure pas les TXT de guillemets

describe('encodeQuery', () => {
  it('produit la requête attendue, en base64 URL sans remplissage', () => {
    expect(toBase64Url(encodeQuery('example.com', 1))).toBe('AAABAAABAAAAAAAAB2V4YW1wbGUDY29tAAABAAE');
    expect(toBase64Url(encodeQuery('example.com.', 28))).toBe('AAABAAABAAAAAAAAB2V4YW1wbGUDY29tAAAcAAE');
  });

  it('refuse une étiquette vide ou trop longue', () => {
    expect(() => encodeQuery('a..b', 1)).toThrow();
    expect(() => encodeQuery(`${'a'.repeat(64)}.fr`, 1)).toThrow();
  });
});

describe('decodeResponse : vraies réponses', () => {
  for (const fixture of FIXTURES) {
    it(`${fixture.name} (type ${fixture.type}) donne les mêmes enregistrements que le JSON`, () => {
      const decoded = decodeResponse(bytes(fixture.hex));
      expect(decoded.status).toBe(0);
      const simple = decoded.answers.map((a) => ({ name: a.name, type: a.type, data: text(a) }));
      const expected = fixture.answers.map((a) => ({ ...a, data: text(a) }));
      expect(simple.sort(byData)).toEqual(expected.sort(byData));
      for (const answer of decoded.answers) expect(answer.ttl).toBeGreaterThan(0);
    });
  }
});

describe('decodeResponse : cas construits', () => {
  it('lit le code de réponse et le drapeau AD', () => {
    expect(decodeResponse(buildResponse({ name: 'exemple.fr', type: 'A', rcode: 3 }))).toMatchObject({ status: 3, ad: false, answers: [] });
    expect(decodeResponse(buildResponse({ name: 'exemple.fr', type: 'A', answers: ['192.0.2.1'], ad: true }))).toMatchObject({ status: 0, ad: true });
  });

  it('abrège les adresses IPv6 comme la RFC 5952', () => {
    const decode = (address) => decodeResponse(buildResponse({ name: 'exemple.fr', type: 'AAAA', answers: [address] })).answers[0].data;
    expect(decode('2001:db8::1')).toBe('2001:db8::1');
    expect(decode('::1')).toBe('::1');
    expect(decode('::')).toBe('::');
    expect(decode('2001:db8:0:0:1:0:0:1')).toBe('2001:db8::1:0:0:1'); // la première plus longue suite de zéros l'emporte
    expect(decode('2001:db8:0:1:1:1:1:1')).toBe('2001:db8:0:1:1:1:1:1'); // un seul groupe nul : pas d'abréviation
  });

  it("concatène les chaînes d'un TXT long et échappe guillemets et antislash", () => {
    const long = 'x'.repeat(300);
    const decoded = decodeResponse(buildResponse({ name: 'exemple.fr', type: 'TXT', answers: [long] }));
    expect(decoded.answers[0].data).toBe(`"${'x'.repeat(255)}" "${'x'.repeat(45)}"`);
    const quoted = decodeResponse(buildResponse({ name: 'exemple.fr', type: 'TXT', answers: ['a"b\\c'] }));
    expect(quoted.answers[0].data).toBe('"a\\"b\\\\c"');
  });

  it('lit un MX et un CNAME', () => {
    expect(decodeResponse(buildResponse({ name: 'exemple.fr', type: 'MX', answers: ['10 mx.exemple.fr'] })).answers[0].data).toBe('10 mx.exemple.fr.');
    expect(decodeResponse(buildResponse({ name: 'www.exemple.fr', type: 'CNAME', answers: ['exemple.fr'] })).answers[0].data).toBe('exemple.fr.');
  });

  it("rejette un message trop court, tronqué, qui n'est pas une réponse ou dont la compression boucle", () => {
    expect(() => decodeResponse(new Uint8Array(5))).toThrow(/trop courte/);
    const full = buildResponse({ name: 'exemple.fr', type: 'A', answers: ['192.0.2.1'] });
    expect(() => decodeResponse(full.subarray(0, full.length - 3))).toThrow();
    const query = Uint8Array.from(full);
    query[2] = 0x01; // drapeau QR à 0 : c'est une requête
    expect(() => decodeResponse(query)).toThrow(/pas une réponse/);
    const loop = Uint8Array.from([0, 0, 0x81, 0x80, 0, 1, 0, 0, 0, 0, 0, 0, 0xc0, 0x0c, 0, 1, 0, 1]); // la question pointe vers elle-même
    expect(() => decodeResponse(loop)).toThrow(/boucle/);
  });

  it('représente un type inconnu de façon générique (RFC 3597)', () => {
    const data = Uint8Array.from([0, 0, 0x81, 0x80, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 99, 0, 1, 0, 0, 0, 60, 0, 2, 0xab, 0xcd]);
    expect(decodeResponse(data).answers[0]).toMatchObject({ type: 99, ttl: 60, data: '\\# 2 abcd' });
  });
});
