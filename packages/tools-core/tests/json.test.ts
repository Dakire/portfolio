import { describe, expect, it } from 'vitest';
import { MAX_JSON_CHARS, locate, parseJson, serialize } from '../src/json.js';

const format = (text, options) => {
  const r = parseJson(text);
  if (!r.ok) throw new Error(`rejeté : ${r.code}`);
  return serialize(r.node, options);
};
const error = (text) => {
  const r = parseJson(text);
  expect(r.ok, text).toBe(false);
  return r;
};

describe('parseJson : documents valides', () => {
  it('accepte tous les types et les espaces autour', () => {
    for (const text of [
      '0',
      '-1.5e+10',
      '"a"',
      'true',
      'false',
      'null',
      '[]',
      '{}',
      ' \n\t [1, "a", null, {"b": [true]}] \r\n',
    ]) {
      expect(parseJson(text).ok, text).toBe(true);
    }
  });

  it('accepte les échappements et les caractères non ASCII', () => {
    expect(parseJson('"\\u00e9\\n\\"\\\\\\/ é 日本 😀"').ok).toBe(true);
  });

  it('ignore un BOM initial', () => {
    expect(parseJson('﻿{"a":1}').ok).toBe(true);
  });

  it('compte clés, éléments et profondeur, et signale les clés en double', () => {
    const r = parseJson('{"a":{"b":[1,2,3]},"a":1,"c":{}}');
    expect(r.stats).toEqual({ depth: 3, keys: 4, items: 3, duplicates: ['a'] });
  });
});

describe('parseJson : erreurs', () => {
  it('donne un code, une ligne et une colonne', () => {
    const r = error('{\n  "a": 1,\n  "b" 2\n}');
    expect(r.code).toBe('expectedColon');
    expect([r.line, r.column]).toEqual([3, 7]);
  });

  it.each([
    ['', 'unexpectedEnd'],
    ['   ', 'unexpectedEnd'],
    ['{"a":1', 'unexpectedEnd'],
    ['[1,2', 'unexpectedEnd'],
    ['{"a"', 'unexpectedEnd'],
    ['{"a":1,}', 'trailingComma'],
    ['[1,2,]', 'trailingComma'],
    ['{a:1}', 'expectedKey'],
    ['{"a":1 "b":2}', 'expectedCommaOrEnd'],
    ['[1 2]', 'expectedCommaOrEnd'],
    ['{"a":1} x', 'trailingContent'],
    ['{"a":1}{"b":2}', 'trailingContent'],
    ['"abc', 'unterminatedString'],
    ['"a\nb"', 'controlChar'],
    ['"\\x"', 'badEscape'],
    ['"\\u12G4"', 'badUnicode'],
    ['01', 'leadingZero'],
    ['-', 'badNumber'],
    ['1.', 'badNumber'],
    ['1e', 'badNumber'],
    ['.5', 'unexpectedChar'],
    ['+1', 'unexpectedChar'],
    ['tru', 'unexpectedChar'],
    ['NaN', 'unexpectedChar'],
  ])('rejette %j (%s)', (text, code) => {
    expect(error(text).code).toBe(code);
  });

  it('propose un indice pour les fautes courantes', () => {
    expect(error("{'a': 1}").hint).toBe('singleQuote');
    expect(error('// note\n{"a": 1}').hint).toBe('comment');
    expect(error('[NaN]').hint).toBe('nonJsonValue');
    expect(error('[undefined]').hint).toBe('nonJsonValue');
    expect(error('{a: 1}').hint).toBe('unquotedKey');
  });

  it('refuse une imbrication trop profonde sans saturer la pile', () => {
    expect(error('['.repeat(5000)).code).toBe('tooDeep');
    expect(parseJson(`${'['.repeat(400)}${']'.repeat(400)}`).ok).toBe(true);
  });

  it('refuse un texte trop volumineux', () => {
    expect(error(' '.repeat(MAX_JSON_CHARS + 1)).code).toBe('tooLarge');
  });
});

describe('locate', () => {
  it('compte les lignes et les colonnes à partir de 1', () => {
    expect(locate('abc', 0)).toEqual({ line: 1, column: 1 });
    expect(locate('abc\ndef', 5)).toEqual({ line: 2, column: 2 });
    expect(locate('a\n\nb', 3)).toEqual({ line: 3, column: 1 });
  });
});

describe('serialize', () => {
  it('indente de 2 espaces, 4 espaces ou une tabulation', () => {
    const text = '{"a":[1,{"b":null}],"c":{}}';
    expect(format(text)).toBe(
      '{\n  "a": [\n    1,\n    {\n      "b": null\n    }\n  ],\n  "c": {}\n}',
    );
    expect(format(text, { indent: 4 })).toContain(`\n${' '.repeat(12)}"b": null`);
    expect(format(text, { indent: '\t' })).toContain('\n\t\t\t"b": null');
  });

  it('minifie sans toucher aux espaces des chaînes', () => {
    expect(format('{ "a b" : [ 1 , 2 ] ,\n "c" : " x  y " }', { indent: 0 })).toBe(
      '{"a b":[1,2],"c":" x  y "}',
    );
  });

  it('garde les tableaux et objets vides compacts', () => {
    expect(format('{"a":[],"b":{}}')).toBe('{\n  "a": [],\n  "b": {}\n}');
  });

  it('ne modifie jamais un nombre ni une chaîne', () => {
    const text = '[12345678901234567890,1.0,1E+2,-0,0.10,"\\u00e9\\/"]';
    expect(format(text, { indent: 0 })).toBe(text);
  });

  it('formate puis minifie sans perte : le résultat est équivalent à JSON.parse', () => {
    const text = '{"z":[1,2,{"y":"é","x":null}],"a":{"b":true,"c":-1.5e3}}';
    expect(JSON.parse(format(text))).toEqual(JSON.parse(text));
    expect(format(format(text), { indent: 0 })).toBe(text);
  });

  it('trie les clés à tous les niveaux, sans trier les tableaux', () => {
    const out = format('{"b":1,"a":{"d":1,"c":[3,1,2]},"B":0}', { indent: 0, sortKeys: true });
    expect(out).toBe('{"B":0,"a":{"c":[3,1,2],"d":1},"b":1}');
  });

  it("trie d'après la valeur de la clé, pas son écriture échappée", () => {
    expect(format('{"\\u0062":1,"a":2}', { indent: 0, sortKeys: true })).toBe(
      '{"a":2,"\\u0062":1}',
    );
  });
});
