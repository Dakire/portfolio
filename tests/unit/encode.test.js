import { describe, expect, it } from 'vitest';
import { hashHex, md5, sameHash } from '../../src/lib/encode/hash.js';
import { decodeJwt } from '../../src/lib/encode/jwt.js';
import { bytesToBase64, bytesToHex, bytesToText, decodeBase64, decodeUrl, encodeBase64, encodeUrlComponent, escapeHtml, hexToBytes, parseUrl, textToHex, toBytes, unescapeHtml } from '../../src/lib/encode/text.js';
import { describeInstant, inspectUuid, parseTimestamp, uuidV4, uuidV7 } from '../../src/lib/encode/time.js';

describe('Base64', () => {
  it('encode et décode (UTF-8 compris)', () => {
    expect(encodeBase64('Man')).toBe('TWFu');
    expect(encodeBase64('héllo')).toBe('aMOpbGxv');
    expect(encodeBase64('😀')).toBe('8J+YgA==');
    expect(decodeBase64('aMOpbGxv')).toMatchObject({ ok: true, text: 'héllo' });
  });

  it('gère la variante URL-safe et le remplissage manquant', () => {
    const bytes = Uint8Array.from([251, 255, 254]);
    expect(bytesToBase64(bytes)).toBe('+//+');
    expect(bytesToBase64(bytes, { urlSafe: true })).toBe('-__-');
    expect(bytesToBase64(Uint8Array.from([1, 2]), { urlSafe: true, padding: false })).toBe('AQI');
    expect(decodeBase64('-__-')).toMatchObject({ ok: true, urlSafe: true });
    expect([...decodeBase64('AQI').bytes]).toEqual([1, 2]); // sans « = »
    expect(decodeBase64('TW\nFu\n').text).toBe('Man'); // retours à la ligne ignorés
  });

  it('refuse ce qui n\'est pas du Base64 et signale les données binaires', () => {
    for (const bad of ['', '@@@', 'A', 'ab+_cd']) expect(decodeBase64(bad).ok, bad).toBe(false);
    const binary = decodeBase64('//79');
    expect(binary.ok).toBe(true);
    expect(binary.text).toBeNull(); // octets non UTF-8
  });

  it('fait l\'aller-retour sur de gros volumes', () => {
    const big = 'é'.repeat(50_000);
    expect(decodeBase64(encodeBase64(big)).text).toBe(big);
  });
});

describe('URL', () => {
  it('encode et décode', () => {
    expect(encodeUrlComponent('a b&c=é/?')).toBe('a%20b%26c%3D%C3%A9%2F%3F');
    expect(decodeUrl('a%20b%26c')).toEqual({ ok: true, text: 'a b&c' });
    expect(decodeUrl('a+b', { plusAsSpace: true }).text).toBe('a b');
    expect(decodeUrl('%E0%A4%A').ok).toBe(false);
  });

  it('décompose une URL', () => {
    const u = parseUrl('https://user:pw@exemple.fr:8443/chemin/page?x=1&y=a%20b#ancre');
    expect(u).toMatchObject({ ok: true, protocol: 'https:', host: 'exemple.fr', port: '8443', path: '/chemin/page', hash: '#ancre', username: 'user' });
    expect(u.params).toEqual([['x', '1'], ['y', 'a b']]);
    expect(parseUrl('pas une url').ok).toBe(false);
  });
});

describe('hexadécimal et HTML', () => {
  it('convertit texte et hexadécimal', () => {
    expect(textToHex('Aé')).toBe('41 c3 a9');
    expect(bytesToText(hexToBytes('41 C3:A9'))).toBe('Aé');
    expect(bytesToText(hexToBytes('0x41,0x42'))).toBe('AB');
    expect(hexToBytes('abc')).toBeNull();
    expect(hexToBytes('zz')).toBeNull();
    expect(bytesToHex(toBytes('hi'), ':')).toBe('68:69');
  });

  it('échappe et déséchappe les entités HTML', () => {
    expect(escapeHtml('<a href="x">&\'</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
    expect(unescapeHtml('&lt;p&gt; &amp; &eacute; &#233; &#xe9; &euro; &inconnue;')).toBe('<p> & é é é € &inconnue;');
    expect(unescapeHtml('&#1114112;')).toBe('&#1114112;'); // hors Unicode : inchangé
  });
});

describe('JWT', () => {
  const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  it('décode l\'en-tête, la charge utile et les dates', () => {
    const r = decodeJwt(TOKEN);
    expect(r).toMatchObject({ ok: true, alg: 'HS256', status: 'noExpiry', unsigned: false });
    expect(r.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(r.payload).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 });
    expect(r.claims.find((c) => c.name === 'iat').time.toISOString()).toBe('2018-01-18T01:30:22.000Z');
    expect(r.claims.find((c) => c.name === 'sub').label).toBe('subject');
  });

  const make = (payload, alg = 'HS256', sig = 'sig') => {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    return `${b64({ alg })}.${b64(payload)}.${sig}`;
  };

  it('évalue l\'expiration et la validité', () => {
    const now = Date.UTC(2025, 0, 1);
    expect(decodeJwt(make({ exp: now / 1000 - 10 }), now).status).toBe('expired');
    expect(decodeJwt(make({ exp: now / 1000 + 3600 }), now).status).toBe('valid');
    expect(decodeJwt(make({ exp: now / 1000 + 3600, nbf: now / 1000 + 60 }), now).status).toBe('notYetValid');
  });

  it('signale un jeton non signé (alg none) et accepte le préfixe Bearer', () => {
    expect(decodeJwt(make({ a: 1 }, 'none', '')).unsigned).toBe(true);
    expect(decodeJwt(`Bearer ${TOKEN}`).ok).toBe(true);
  });

  it('refuse ce qui n\'est pas un JWT', () => {
    expect(decodeJwt('abc')).toEqual({ ok: false, error: 'format' });
    expect(decodeJwt('a.b.c')).toMatchObject({ ok: false, error: 'header' });
    expect(decodeJwt(`${TOKEN.split('.')[0]}.@@@.x`)).toMatchObject({ ok: false, error: 'payload' });
  });
});

describe('empreintes', () => {
  const h = (s) => bytesToHex(md5(toBytes(s)));

  it('MD5 : vecteurs de référence (RFC 1321)', () => {
    expect(h('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(h('a')).toBe('0cc175b9c0f1b6a831c399e269772661');
    expect(h('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(h('message digest')).toBe('f96b697d7cb7938d525a2f31aaf161d0');
    expect(h('The quick brown fox jumps over the lazy dog')).toBe('9e107d9d372bb6826bd81d3542a419d6');
    expect(h('12345678901234567890123456789012345678901234567890123456789012345678901234567890')).toBe('57edf4a22be3c955ac49da2e2107b67a');
  });

  it("MD5 : identique à l'implémentation de Node pour des longueurs variées (blocs de 64 octets compris)", async () => {
    const { createHash } = await import('node:crypto');
    for (const n of [1, 55, 56, 57, 63, 64, 65, 119, 120, 127, 128, 1000, 100_000]) {
      const data = Uint8Array.from({ length: n }, (_, i) => (i * 31 + 7) % 256);
      expect(bytesToHex(md5(data)), String(n)).toBe(createHash('md5').update(data).digest('hex'));
    }
  });

  it('SHA-1, SHA-256, SHA-512 via SubtleCrypto', async () => {
    const abc = toBytes('abc');
    expect(await hashHex('SHA-1', abc)).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(await hashHex('SHA-256', abc)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect((await hashHex('SHA-512', abc)).startsWith('ddaf35a193617aba')).toBe(true);
    expect(await hashHex('MD5', abc)).toBe('900150983cd24fb0d6963f7d28e17f72');
  });

  it('compare deux empreintes sans tenir compte de la casse ni des séparateurs', () => {
    expect(sameHash('BA78:16BF 8F01', 'ba7816bf8f01')).toBe(true);
    expect(sameHash('aa', 'ab')).toBe(false);
    expect(sameHash('', '')).toBe(false);
  });
});

describe('horodatages et UUID', () => {
  it('devine l\'unité d\'un nombre', () => {
    expect(parseTimestamp('1700000000')).toMatchObject({ ok: true, ms: 1_700_000_000_000, unit: 's' });
    expect(parseTimestamp('1700000000123')).toMatchObject({ ms: 1_700_000_000_123, unit: 'ms' });
    expect(parseTimestamp('1700000000123456')).toMatchObject({ ms: 1_700_000_000_123, unit: 'us' });
    expect(parseTimestamp('1700000000123456789')).toMatchObject({ unit: 'ns' });
    expect(parseTimestamp('2025-01-15T10:30:00Z')).toMatchObject({ ms: Date.UTC(2025, 0, 15, 10, 30), unit: 'date' });
    expect(parseTimestamp('pas une date').ok).toBe(false);
    expect(parseTimestamp('').ok).toBe(false);
  });

  it('décrit un instant', () => {
    const d = describeInstant(Date.UTC(2025, 0, 15, 10, 30), { locale: 'fr-FR', now: Date.UTC(2025, 0, 15, 12, 30) });
    expect(d).toMatchObject({ seconds: 1_736_937_000, iso: '2025-01-15T10:30:00.000Z', utc: 'Wed, 15 Jan 2025 10:30:00 GMT' });
    expect(d.relative).toMatch(/2 heures/);
  });

  it('génère des UUID v4 et v7 valides', () => {
    expect(inspectUuid(uuidV4())).toMatchObject({ ok: true, version: 4, variant: 'rfc4122' });
    const ms = Date.UTC(2025, 5, 1, 12, 0, 0);
    const v7 = uuidV7(ms);
    expect(inspectUuid(v7)).toMatchObject({ ok: true, version: 7, ms });
    expect(uuidV7(ms + 1) > uuidV7(ms)).toBe(true); // triables dans l'ordre du temps
    expect(inspectUuid('pas un uuid').ok).toBe(false);
    expect(inspectUuid('123E4567-E89B-12D3-A456-426614174000')).toMatchObject({ version: 1, canonical: '123e4567-e89b-12d3-a456-426614174000' });
  });
});
