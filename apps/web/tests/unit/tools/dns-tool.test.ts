import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { describeFinding, DNS_TOOL, fill } from '../../../src/tools/dns/text';

const CORE = '../../packages/tools-core/src/dns';

// Codes de constat présents dans le code d'analyse (src/lib/dns) : chacun doit être traduit, même s'il n'est jamais déclenché par un test.
const sourceCodes = () => {
  const found = new Set();
  for (const file of readdirSync(CORE).filter((f) => f.endsWith('.ts'))) {
    const source = readFileSync(`${CORE}/${file}`, 'utf-8');
    for (const [, code] of source.matchAll(
      /'((?:domain|addr|ns|soa|caa|dnssec|mx|spf|dkim|dmarc|txt|mtasts|tlsrpt|bimi)\.[A-Za-z0-9]+)'/g,
    ))
      found.add(code);
  }
  return found;
};

const placeholders = (s) => [...(s ?? '').matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("textes de l'outil DNS", () => {
  it('chaque code de constat est traduit en français et en anglais', () => {
    const codes = sourceCodes();
    expect(codes.size).toBeGreaterThan(100);
    for (const lang of ['fr', 'en']) {
      const missing = [...codes].filter((c) => !DNS_TOOL[lang].messages[c]);
      expect(missing, `${lang}: codes sans traduction`).toEqual([]);
    }
  });

  it('les deux langues ont exactement les mêmes codes', () => {
    expect(Object.keys(DNS_TOOL.en.messages).sort()).toEqual(
      Object.keys(DNS_TOOL.fr.messages).sort(),
    );
  });

  it('aucune traduction ne contient de code inutilisé', () => {
    const codes = sourceCodes();
    codes.add('dns.unavailable'); // produit par l'interface, pas par l'analyse
    const unused = Object.keys(DNS_TOOL.fr.messages).filter((c) => !codes.has(c));
    expect(unused).toEqual([]);
  });

  it('les deux langues utilisent les mêmes paramètres {…}', () => {
    for (const [code, fr] of Object.entries(DNS_TOOL.fr.messages)) {
      const en = DNS_TOOL.en.messages[code];
      for (const key of ['title', 'detail', 'fix']) {
        const f = new Set(placeholders(fr[key]));
        const e = new Set(placeholders(en[key]));
        expect(
          [...e].filter((p) => !f.has(p)),
          `${code}.${key} : paramètre anglais absent du français`,
        ).toEqual([]);
        expect(
          [...f].filter((p) => !e.has(p)),
          `${code}.${key} : paramètre français absent de l'anglais`,
        ).toEqual([]);
      }
    }
  });

  it('chaque titre est renseigné', () => {
    for (const lang of ['fr', 'en'])
      for (const [code, e] of Object.entries(DNS_TOOL[lang].messages))
        expect(e.title.trim(), `${lang} ${code}`).not.toBe('');
  });

  it("les deux langues ont les mêmes clés d'interface", () => {
    const keys = (o, p = '') =>
      Object.entries(o).flatMap(([k, v]) =>
        v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${p}${k}.`) : [`${p}${k}`],
      );
    expect(keys(DNS_TOOL.en.ui).sort()).toEqual(keys(DNS_TOOL.fr.ui).sort());
  });

  it('remplit les paramètres et décrit un constat', () => {
    expect(fill('{a} et {b}', { a: 1 })).toBe('1 et ');
    const d = describeFinding('fr', {
      code: 'spf.tooManyLookups',
      severity: 'error',
      params: { count: 12 },
    });
    expect(d.detail).toContain('12 requêtes DNS');
    expect(describeFinding('en', { code: 'code.inconnu', params: {} }).title).toBe('code.inconnu');
  });
});
