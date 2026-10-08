// Format binaire DNS (RFC 1035) pour les résolveurs DNS-over-HTTPS qui n'offrent pas de JSON (RFC 8484, GET ?dns=<base64url>).
// Les enregistrements décodés ont la même forme que ceux du JSON des résolveurs : { name, type, ttl, data }, avec `data` en texte
// (A « 1.2.3.4 », MX « 10 mx.exemple.fr. », TXT « "a" "b" »…), pour qu'une seule logique lise les deux formats.
// Fonctions pures, sans réseau ni DOM : testées contre de vraies réponses (tests/unit/wire.test.js).

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: false });

/** Requête « RD » (récursion souhaitée) d'identifiant 0, comme le recommande la RFC 8484 pour la mise en cache. */
export function encodeQuery(name, type) {
  const parts = [];
  for (const label of String(name).replace(/\.$/, '').split('.')) {
    const bytes = encoder.encode(label);
    if (bytes.length === 0 || bytes.length > 63) throw new Error(`Étiquette DNS invalide : « ${label} »`);
    parts.push(Uint8Array.of(bytes.length), bytes);
  }
  const header = Uint8Array.of(0, 0, 0x01, 0x00, 0, 1, 0, 0, 0, 0, 0, 0);
  const tail = Uint8Array.of(0, type >> 8, type & 0xff, 0, 1);
  const out = new Uint8Array(header.length + parts.reduce((n, p) => n + p.length, 0) + tail.length);
  let offset = 0;
  for (const chunk of [header, ...parts, tail]) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** Base64 « URL » sans remplissage, tel que l'attend le paramètre `dns` de la RFC 8484. */
export function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Lit un nom (avec compression) à partir de `offset` ; renvoie le nom (point final compris) et l'offset suivant. */
function readName(view, offset) {
  const labels = [];
  let position = offset;
  let next = -1;
  for (let hops = 0; hops < 128; hops += 1) {
    if (position >= view.length) throw new Error('Nom DNS tronqué');
    const length = view[position];
    if (length === 0) {
      return { name: `${labels.join('.')}.`, next: next === -1 ? position + 1 : next };
    }
    if ((length & 0xc0) === 0xc0) {
      if (position + 1 >= view.length) throw new Error('Pointeur DNS tronqué');
      if (next === -1) next = position + 2;
      position = ((length & 0x3f) << 8) | view[position + 1];
    } else {
      if (position + 1 + length > view.length) throw new Error('Étiquette DNS tronquée');
      labels.push(decoder.decode(view.subarray(position + 1, position + 1 + length)));
      position += 1 + length;
    }
  }
  throw new Error('Nom DNS en boucle');
}

/** IPv6 en notation canonique abrégée (RFC 5952) : la plus longue suite de zéros (2 groupes au moins) devient « :: ». */
function formatIPv6(bytes) {
  const groups = [];
  for (let i = 0; i < 16; i += 2) groups.push(((bytes[i] << 8) | bytes[i + 1]).toString(16));
  let bestStart = -1;
  let bestLength = 0;
  for (let i = 0; i < 8; ) {
    if (groups[i] !== '0') {
      i += 1;
      continue;
    }
    let j = i;
    while (j < 8 && groups[j] === '0') j += 1;
    if (j - i > bestLength) {
      bestStart = i;
      bestLength = j - i;
    }
    i = j;
  }
  if (bestLength < 2) return groups.join(':');
  return `${groups.slice(0, bestStart).join(':')}::${groups.slice(bestStart + bestLength).join(':')}`;
}

const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
const u16 = (view, o) => (view[o] << 8) | view[o + 1];
const u32 = (view, o) => ((view[o] << 24) | (view[o + 1] << 16) | (view[o + 2] << 8) | view[o + 3]) >>> 0;

/** Texte d'un TXT : chaque chaîne entre guillemets, `"` et `\` protégés, octets non imprimables en \DDD (comme les résolveurs JSON). */
function formatTxt(rdata) {
  const strings = [];
  for (let i = 0; i < rdata.length; ) {
    const length = rdata[i];
    const chunk = rdata.subarray(i + 1, i + 1 + length);
    let text = '';
    for (const byte of chunk) {
      if (byte === 0x22 || byte === 0x5c) text += `\\${String.fromCharCode(byte)}`;
      else if (byte < 0x20 || byte === 0x7f) text += `\\${String(byte).padStart(3, '0')}`;
      else text += String.fromCharCode(byte);
    }
    strings.push(`"${text}"`);
    i += 1 + length;
  }
  return strings.join(' ');
}

function readData(view, type, offset, length) {
  const rdata = view.subarray(offset, offset + length);
  switch (type) {
    case 1:
      return length === 4 ? [...rdata].join('.') : hex(rdata);
    case 28:
      return length === 16 ? formatIPv6(rdata) : hex(rdata);
    case 2: // NS
    case 5: // CNAME
    case 12: // PTR
      return readName(view, offset).name;
    case 15: { // MX
      const { name } = readName(view, offset + 2);
      return `${u16(view, offset)} ${name}`;
    }
    case 16:
      return formatTxt(rdata);
    case 6: { // SOA
      const mname = readName(view, offset);
      const rname = readName(view, mname.next);
      const n = rname.next;
      return `${mname.name} ${rname.name} ${[0, 4, 8, 12, 16].map((delta) => u32(view, n + delta)).join(' ')}`;
    }
    case 257: { // CAA : drapeaux, longueur de la balise, balise, valeur
      const tagLength = rdata[1];
      const tag = decoder.decode(rdata.subarray(2, 2 + tagLength));
      return `${rdata[0]} ${tag} "${decoder.decode(rdata.subarray(2 + tagLength))}"`;
    }
    case 43: // DS : étiquette de clé, algorithme, type d'empreinte, empreinte
      return `${u16(view, offset)} ${view[offset + 2]} ${view[offset + 3]} ${hex(rdata.subarray(4)).toUpperCase()}`;
    default:
      return `\\# ${length} ${hex(rdata)}`; // type inconnu : représentation générique de la RFC 3597
  }
}

/**
 * Réponse DNS binaire -> { status, ad, tc, answers }. `status` est le RCODE (0 = NOERROR, 3 = NXDOMAIN…).
 * Lève une erreur si le message est tronqué ou n'est pas une réponse.
 */
export function decodeResponse(input) {
  const view = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (view.length < 12) throw new Error('Réponse DNS trop courte');
  const flags = u16(view, 2);
  if ((flags & 0x8000) === 0) throw new Error("Ce message n'est pas une réponse DNS");
  const questions = u16(view, 4);
  const answerCount = u16(view, 6);

  let offset = 12;
  for (let i = 0; i < questions; i += 1) offset = readName(view, offset).next + 4;

  const answers = [];
  for (let i = 0; i < answerCount; i += 1) {
    const { name, next } = readName(view, offset);
    if (next + 10 > view.length) throw new Error('Enregistrement DNS tronqué');
    const type = u16(view, next);
    const ttl = u32(view, next + 4);
    const length = u16(view, next + 8);
    const start = next + 10;
    if (start + length > view.length) throw new Error('Données DNS tronquées');
    answers.push({ name, type, ttl, data: readData(view, type, start, length) });
    offset = start + length;
  }
  return { status: flags & 0x0f, ad: (flags & 0x20) !== 0, tc: (flags & 0x200) !== 0, answers };
}
