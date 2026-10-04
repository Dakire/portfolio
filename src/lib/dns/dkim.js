// DKIM (RFC 6376, RFC 8463) : analyse d'un enregistrement de clé publique (taille de la clé, drapeaux, balises) et recherche
// des sélecteurs. Les sélecteurs inconnus sont devinés d'après le fournisseur de messagerie reconnu (MX, SPF).
import { finding } from './findings.js';
import { cnameChain, mapLimit, RCODE, txtRecords } from './resolver.js';

/** « v=DKIM1; k=rsa; p=… » -> { v: 'DKIM1', k: 'rsa', p: '…' } (les espaces sont ignorés, y compris dans p). */
export function parseDkimTags(text) {
  const tags = {};
  const order = [];
  const duplicates = [];
  for (const part of String(text).split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const name = part.slice(0, i).trim().toLowerCase();
    const value = part.slice(i + 1).replace(/\s+/g, '');
    if (!name) continue;
    if (name in tags) duplicates.push(name);
    tags[name] = value;
    order.push(name);
  }
  return { tags, order, duplicates };
}

// --- Lecture minimale de la clé (ASN.1 DER) pour connaître la taille d'une clé RSA ---

function readDer(bytes, offset) {
  const tag = bytes[offset];
  let len = bytes[offset + 1];
  let header = 2;
  if (len === undefined || tag === undefined) throw new Error('der');
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n < 1 || n > 4) throw new Error('der');
    len = 0;
    for (let i = 0; i < n; i += 1) len = len * 256 + (bytes[offset + 2 + i] ?? 0);
    header = 2 + n;
  }
  if (offset + header + len > bytes.length) throw new Error('der');
  return { tag, start: offset + header, end: offset + header + len };
}

const bitLength = (bytes) => {
  let i = 0;
  while (i < bytes.length - 1 && bytes[i] === 0) i += 1;
  return (bytes.length - i - 1) * 8 + (32 - Math.clz32(bytes[i]));
};

/** Taille (bits) du module d'une clé publique RSA, au format SubjectPublicKeyInfo ou RSAPublicKey. Lève une erreur si illisible. */
export function rsaKeyBits(bytes) {
  const outer = readDer(bytes, 0);
  if (outer.tag !== 0x30) throw new Error('der');
  const first = readDer(bytes, outer.start);
  let rsaSeq;
  if (first.tag === 0x30) {
    const bitString = readDer(bytes, first.end);
    if (bitString.tag !== 0x03) throw new Error('der');
    rsaSeq = readDer(bytes, bitString.start + 1); // le premier octet du BIT STRING donne les bits inutilisés
    if (rsaSeq.tag !== 0x30) throw new Error('der');
  } else {
    rsaSeq = outer; // RSAPublicKey nu (certains fournisseurs omettent l'enveloppe)
  }
  const modulus = readDer(bytes, rsaSeq.start);
  if (modulus.tag !== 0x02) throw new Error('der');
  return bitLength(bytes.subarray(modulus.start, modulus.end));
}

const decodeBase64 = (s) => {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.length % 4 === 1) throw new Error('base64');
  const binary = atob(s);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
};

/** Analyse d'un enregistrement DKIM : constats et caractéristiques de la clé. */
export function analyzeDkimRecord(text) {
  const { tags, order, duplicates } = parseDkimTags(text);
  const findings = [];
  const key = { type: (tags.k ?? 'rsa').toLowerCase(), bits: null, revoked: false, valid: false };

  if ('v' in tags) {
    if (tags.v !== 'DKIM1') findings.push(finding('dkim.badVersion', 'error', { value: tags.v }));
    else if (order[0] !== 'v') findings.push(finding('dkim.versionNotFirst', 'warn'));
  }
  for (const name of duplicates) findings.push(finding('dkim.duplicateTag', 'error', { name }));
  if (!('p' in tags)) {
    findings.push(finding('dkim.pMissing', 'error'));
    return { tags, key, findings };
  }
  if (!['rsa', 'ed25519'].includes(key.type)) findings.push(finding('dkim.keyType', 'error', { value: tags.k }));

  if (tags.p === '') {
    key.revoked = true;
    findings.push(finding('dkim.revoked', 'warn'));
  } else {
    try {
      const bytes = decodeBase64(tags.p);
      if (key.type === 'ed25519') {
        if (bytes.length !== 32) throw new Error('ed25519');
        key.bits = 256;
        key.valid = true;
        findings.push(finding('dkim.goodKey', 'ok', { type: 'Ed25519', bits: 256 }));
      } else if (key.type === 'rsa') {
        key.bits = rsaKeyBits(bytes);
        key.valid = true;
        if (key.bits < 1024) findings.push(finding('dkim.weakKey', 'error', { bits: key.bits }));
        else if (key.bits < 2048) findings.push(finding('dkim.shortKey', 'warn', { bits: key.bits }));
        else findings.push(finding('dkim.goodKey', 'ok', { type: 'RSA', bits: key.bits }));
      }
    } catch {
      findings.push(finding('dkim.keyCorrupt', 'error'));
    }
  }

  const flags = (tags.t ?? '').split(':');
  if (flags.includes('y')) findings.push(finding('dkim.testing', 'warn'));
  if (flags.includes('s')) findings.push(finding('dkim.strict', 'info'));
  if (tags.h) {
    const hashes = tags.h.toLowerCase().split(':');
    if (hashes.length && hashes.every((h) => h === 'sha1')) findings.push(finding('dkim.sha1', 'warn'));
  }
  if (tags.s && !tags.s.split(':').some((s) => s === '*' || s.toLowerCase() === 'email')) findings.push(finding('dkim.service', 'warn', { value: tags.s }));
  return { tags, key, findings };
}

/**
 * Interroge `<sélecteur>._domainkey.<domaine>` pour chaque sélecteur et analyse ce qui est publié.
 * @param {{ selector: string, provider?: string|null }[]} selectors
 * @param {boolean} explicit  vrai si l'utilisateur a nommé ces sélecteurs (un sélecteur absent est alors une erreur, pas un essai raté)
 */
export async function analyzeDkim({ domain, selectors, explicit, resolver }) {
  const results = await mapLimit(selectors, 8, async ({ selector, provider }) => {
    const name = `${selector}._domainkey.${domain}`;
    const res = await resolver.query(name, 'TXT');
    const texts = txtRecords(res);
    const chain = cnameChain(res);
    const dkimTexts = texts.filter((t) => /(^|;)\s*p\s*=/i.test(t.text) || /^\s*v\s*=\s*DKIM1/i.test(t.text));
    const found = res.status === RCODE.NOERROR && texts.length > 0;
    const entry = { selector, provider: provider ?? null, name, found, records: texts, cname: chain.at(-1)?.to ?? null, cnameChain: chain, findings: [], key: null };

    if (found) {
      if (dkimTexts.length > 1) entry.findings.push(finding('dkim.multipleAtSelector', 'error', { selector, count: dkimTexts.length }));
      if (entry.cname) entry.findings.push(finding('dkim.cname', 'info', { selector, target: entry.cname }));
      const analysis = analyzeDkimRecord((dkimTexts[0] ?? texts[0]).text);
      entry.key = analysis.key;
      entry.tags = analysis.tags;
      entry.findings.push(...analysis.findings.map((f) => ({ ...f, params: { ...f.params, selector } })));
    } else if (explicit) {
      entry.findings.push(finding('dkim.selectorMissing', 'error', { selector, name }));
    }
    return entry;
  });

  const found = results.filter((r) => r.found);
  const findings = results.flatMap((r) => r.findings);
  if (!found.length && !explicit) findings.push(finding('dkim.none', 'warn', { count: selectors.length }));
  if (found.length && !findings.some((f) => f.severity === 'error' || f.severity === 'warn')) findings.push(finding('dkim.ok', 'ok', { count: found.length }));

  // Même clé publiée sous plusieurs sélecteurs : rotation inachevée ou doublon
  const byKey = new Map();
  for (const r of found) {
    const p = r.tags?.p;
    if (p) byKey.set(p, [...(byKey.get(p) ?? []), r.selector]);
  }
  for (const list of byKey.values()) if (list.length > 1) findings.push(finding('dkim.sameKey', 'info', { selectors: list.join(', ') }));

  const guessed = !explicit && found.some((r) => r.provider);
  if (guessed) findings.push(finding('dkim.guess', 'info', { selectors: found.filter((r) => r.provider).map((r) => `${r.selector} (${r.provider})`).join(', ') }));

  return { results, found, findings, explicit, tested: selectors.length };
}

