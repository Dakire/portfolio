// Analyse, validation et mise en forme de JSON (RFC 8259), sans dépendance et sans eval.
// Un analyseur à part plutôt que JSON.parse : les messages d'erreur de JSON.parse diffèrent d'un navigateur à l'autre
// (et n'indiquent pas toujours la position), et il convertit les nombres en flottants (12345678901234567890 deviendrait
// 12345678901234567000). Ici les nombres et les chaînes sont conservés tels qu'écrits : la mise en forme ne change jamais une valeur.

export const MAX_JSON_CHARS = 5_000_000;
const MAX_DEPTH = 512; // au-delà, la récursion risquerait de saturer la pile

const WS = new Set([' ', '\t', '\n', '\r']);
const ESCAPES = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't']);
const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;

/** Arbre syntaxique : les nombres et les chaînes gardent leur écriture d'origine (`raw`). */
export type JsonNode =
  | { type: 'string'; raw: string }
  | { type: 'number'; raw: string }
  | { type: 'literal'; raw: string }
  | { type: 'array'; items: JsonNode[] }
  | { type: 'object'; members: [string, JsonNode][] };

export interface JsonStats {
  depth: number;
  keys: number;
  items: number;
  duplicates: string[];
}

export type JsonParseResult =
  | { ok: true; node: JsonNode; stats: JsonStats }
  | {
      ok: false;
      code: string;
      extra: string | undefined;
      position: number;
      line: number;
      column: number;
      hint: string | null;
    };

class JsonError extends Error {
  readonly code: string;
  readonly position: number;
  readonly extra: string | undefined;

  constructor(code: string, position: number, extra?: string) {
    super(code);
    this.code = code;
    this.position = position;
    this.extra = extra;
  }
}

/** Ligne et colonne (à partir de 1) d'une position dans le texte. */
export function locate(text: string, position: number): { line: number; column: number } {
  let line = 1;
  let last = -1;
  for (let i = text.indexOf('\n'); i !== -1 && i < position; i = text.indexOf('\n', i + 1)) {
    line++;
    last = i;
  }
  return { line, column: position - last };
}

// Erreurs fréquentes : un indice vaut mieux qu'une position brute
function hintFor(text: string, position: number): string | null {
  const rest = text.slice(position);
  if (rest.startsWith("'")) return 'singleQuote';
  if (rest.startsWith('//') || rest.startsWith('/*')) return 'comment';
  if (/^(?:NaN|-?Infinity|undefined)\b/.test(rest)) return 'nonJsonValue';
  if (/^[A-Za-z_$][\w$]*\s*:/.test(rest)) return 'unquotedKey';
  return null;
}

function parse(text: string): JsonNode {
  let i = 0;
  const skip = () => {
    while (i < text.length && WS.has(text.charAt(i))) i++;
  };
  const fail: (code: string, at?: number, extra?: string) => never = (code, at = i, extra) => {
    throw new JsonError(code, at, extra);
  };

  const string = (): string => {
    const start = i;
    i++; // guillemet ouvrant
    while (i < text.length) {
      const c = text.charAt(i);
      if (c === '"') {
        i++;
        return text.slice(start, i);
      }
      if (c === '\\') {
        const e = text[i + 1];
        if (e === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) fail('badUnicode', i);
          i += 6;
        } else if (e !== undefined && ESCAPES.has(e)) {
          i += 2;
        } else {
          fail('badEscape', i, e ?? '');
        }
      } else if (c < ' ') {
        fail('controlChar', i);
      } else {
        i++;
      }
    }
    return fail('unterminatedString', start);
  };

  const value = (depth: number): JsonNode => {
    if (depth > MAX_DEPTH) fail('tooDeep');
    skip();
    const c = text[i];
    if (c === undefined) fail('unexpectedEnd');
    if (c === '{') return object(depth);
    if (c === '[') return array(depth);
    if (c === '"') return { type: 'string', raw: string() };
    for (const word of ['true', 'false', 'null']) {
      if (text.startsWith(word, i)) {
        i += word.length;
        return { type: 'literal', raw: word };
      }
    }
    if (c === '-' || (c >= '0' && c <= '9')) {
      NUMBER.lastIndex = i;
      const m = NUMBER.exec(text);
      if (!m) fail('badNumber');
      const end = i + m[0].length;
      const after = text.charAt(end);
      // « 01 », « 1. », « 1e » : le nombre s'arrête avant un caractère qui le prolonge normalement
      if (/^-?0$/.test(m[0]) && after >= '0' && after <= '9') fail('leadingZero', i);
      if (after === '.' || after === 'e' || after === 'E') fail('badNumber', i);
      i = end;
      return { type: 'number', raw: m[0] };
    }
    return fail('unexpectedChar', i, c);
  };

  const object = (depth: number): JsonNode => {
    const members: [string, JsonNode][] = [];
    i++;
    skip();
    if (text[i] === '}') {
      i++;
      return { type: 'object', members };
    }
    for (;;) {
      skip();
      if (text[i] === undefined) fail('unexpectedEnd');
      if (text[i] === '}') fail('trailingComma');
      if (text[i] !== '"') fail('expectedKey', i, text[i]);
      const key = string();
      skip();
      if (text[i] !== ':')
        fail(text[i] === undefined ? 'unexpectedEnd' : 'expectedColon', i, text[i]);
      i++;
      members.push([key, value(depth + 1)]);
      skip();
      if (text[i] === ',') {
        i++;
      } else if (text[i] === '}') {
        i++;
        return { type: 'object', members };
      } else {
        fail(text[i] === undefined ? 'unexpectedEnd' : 'expectedCommaOrEnd', i, text[i]);
      }
    }
  };

  const array = (depth: number): JsonNode => {
    const items: JsonNode[] = [];
    i++;
    skip();
    if (text[i] === ']') {
      i++;
      return { type: 'array', items };
    }
    for (;;) {
      skip();
      if (text[i] === ']') fail('trailingComma');
      items.push(value(depth + 1));
      skip();
      if (text[i] === ',') {
        i++;
      } else if (text[i] === ']') {
        i++;
        return { type: 'array', items };
      } else {
        fail(text[i] === undefined ? 'unexpectedEnd' : 'expectedCommaOrEnd', i, text[i]);
      }
    }
  };

  const root = value(0);
  skip();
  if (i < text.length) fail('trailingContent', i, text[i]);
  return root;
}

/** Valeur lisible de la clé (guillemets et échappements retirés), pour trier et détecter les doublons. */
const keyText = (raw: string): string => JSON.parse(raw) as string;

function stats(node: JsonNode): JsonStats {
  const out: JsonStats = { depth: 0, keys: 0, items: 0, duplicates: [] };
  const walk = (n: JsonNode, depth: number): void => {
    out.depth = Math.max(out.depth, depth);
    if (n.type === 'object') {
      const seen = new Set<string>();
      for (const [raw, child] of n.members) {
        const key = keyText(raw);
        out.keys++;
        if (seen.has(key) && !out.duplicates.includes(key)) out.duplicates.push(key);
        seen.add(key);
        walk(child, depth + 1);
      }
    } else if (n.type === 'array') {
      out.items += n.items.length;
      for (const child of n.items) walk(child, depth + 1);
    }
  };
  walk(node, 0);
  return out;
}

/**
 * Analyse un texte JSON.
 * Retourne { ok: true, node, stats } ou { ok: false, code, extra, position, line, column, hint }.
 */
export function parseJson(text: string): JsonParseResult {
  if (text.length > MAX_JSON_CHARS)
    return {
      ok: false,
      code: 'tooLarge',
      extra: undefined,
      position: 0,
      line: 1,
      column: 1,
      hint: null,
    };
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // BOM d'un fichier enregistré sous Windows
  try {
    const node = parse(source);
    return { ok: true, node, stats: stats(node) };
  } catch (e) {
    if (!(e instanceof JsonError)) throw e;
    const { line, column } = locate(source, e.position);
    return {
      ok: false,
      code: e.code,
      extra: e.extra,
      position: e.position,
      line,
      column,
      hint: hintFor(source, e.position),
    };
  }
}

/**
 * Sérialise l'arbre. indent : nombre d'espaces, '\t', ou 0 pour minifier. sortKeys : ordre alphabétique des clés, à tous les niveaux
 * (tri par valeur de la clé, stable : deux clés identiques gardent leur ordre).
 */
export function serialize(
  node: JsonNode,
  { indent = 2, sortKeys = false }: { indent?: number | '\t'; sortKeys?: boolean } = {},
): string {
  const unit = indent === 0 ? '' : indent === '\t' ? '\t' : ' '.repeat(indent);
  const nl = (depth: number): string => (indent === 0 ? '' : `\n${unit.repeat(depth)}`);
  const colon = indent === 0 ? ':' : ': ';

  const write = (n: JsonNode, depth: number): string => {
    if (n.type === 'string' || n.type === 'number' || n.type === 'literal') return n.raw;
    if (n.type === 'array') {
      if (!n.items.length) return '[]';
      return `[${n.items.map((c) => nl(depth + 1) + write(c, depth + 1)).join(',')}${nl(depth)}]`;
    }
    if (!n.members.length) return '{}';
    const members = sortKeys
      ? n.members
          .map((m): [string, [string, JsonNode]] => [keyText(m[0]), m])
          .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
          .map(([, m]) => m)
      : n.members;
    return `{${members.map(([k, c]) => nl(depth + 1) + k + colon + write(c, depth + 1)).join(',')}${nl(depth)}}`;
  };
  return write(node, 0);
}

/** Taille en octets (UTF-8) d'un texte. */
export const byteLength = (text: string): number => new TextEncoder().encode(text).length;
