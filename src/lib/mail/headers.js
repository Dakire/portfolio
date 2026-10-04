// Analyse des en-têtes d'un e-mail : chemin de livraison (Received) avec délais et chiffrement, authentification (SPF, DKIM, DMARC,
// ARC), signatures DKIM, identités (From, Return-Path, Reply-To…) et alignement, signaux de spam et de courrier de masse.
// Fonctions pures : le texte collé n'est jamais envoyé nulle part.
import { orgDomain } from '../dns/domain.js';
import { countBySeverity, finding } from '../dns/findings.js';

// --- Lecture des en-têtes ---

/** Texte brut -> [{ name, value }] dans l'ordre du message. Accepte un éventuel « From » mbox initial et s'arrête au corps. */
export function parseHeaders(raw) {
  const lines = String(raw).replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
  if (/^From \S+/.test(lines[0] ?? '')) lines.shift(); // ligne d'enveloppe mbox
  const headers = [];
  for (const line of lines) {
    if (line.trim() === '' && headers.length) break; // fin des en-têtes
    if (/^[ \t]/.test(line) && headers.length) {
      headers.at(-1).value += ` ${line.trim()}`;
      continue;
    }
    const m = /^([^\s:][^:]*):[ \t]*(.*)$/.exec(line);
    if (m) headers.push({ name: m[1].trim(), value: m[2].trim() });
  }
  return headers;
}

const all = (headers, name) => headers.filter((h) => h.name.toLowerCase() === name.toLowerCase()).map((h) => h.value);
const first = (headers, name) => all(headers, name)[0] ?? '';

/** Supprime les commentaires entre parenthèses (RFC 5322), en gardant leur texte à part. */
const stripComments = (s) => s.replace(/\([^()]*\)/g, ' ').replace(/\s+/g, ' ').trim();
const comments = (s) => [...s.matchAll(/\(([^()]*)\)/g)].map((m) => m[1]);

/** « Jean <jean@example.org> », « jean@example.org » -> { name, address, domain } */
export function parseAddress(value) {
  const text = String(value).trim();
  const angle = /^(.*?)\s*<([^<>]+)>/.exec(text);
  const address = (angle ? angle[2] : /([^\s<>"',;]+@[^\s<>"',;]+)/.exec(text)?.[1] ?? '').trim().replace(/^mailto:/i, '');
  const name = (angle ? angle[1] : '').replace(/^"|"$/g, '').trim();
  const at = address.lastIndexOf('@');
  return { name, address: address.toLowerCase(), domain: at > 0 ? address.slice(at + 1).toLowerCase() : '' };
}

// --- Received ---

const DATE_AT_END = /;\s*([^;]+)$/;

/** Une ligne Received -> hôtes, protocole, chiffrement, adresses IP, horodatage. */
export function parseReceived(value) {
  const dateText = DATE_AT_END.exec(value)?.[1] ?? '';
  const date = Date.parse(stripComments(dateText));
  const body = value.replace(DATE_AT_END, '');
  const grab = (re) => re.exec(body)?.[1] ?? '';
  const ips = [...new Set([...body.matchAll(/\[?((?:\d{1,3}\.){3}\d{1,3})\]?|\[(ipv6:)?([0-9a-f:]{3,})\]/gi)].map((m) => m[1] ?? m[3]).filter(Boolean))];
  const protocol = grab(/\bwith\s+([A-Za-z0-9-]+)/i);
  const tlsHint = /\bESMTPS+A?\b|\bTLS|\bSTARTTLS|\bversion=TLS|\bcipher=|using SSL/i.test(body);
  const plain = /\b(ESMTP|SMTP|LMTP)\b/i.test(protocol) && !tlsHint;
  return {
    from: grab(/\bfrom\s+(\S+)/i),
    by: grab(/\bby\s+(\S+)/i),
    protocol,
    tls: tlsHint ? true : plain ? false : null,
    ips,
    id: grab(/\bid\s+(\S+)/i),
    date: Number.isNaN(date) ? null : date,
    raw: value,
  };
}

// --- Authentification ---

/** « mx.google.com; dkim=pass header.d=a.b; spf=pass smtp.mailfrom=x@y » -> { host, results: [{ method, result, props, comment }] } */
export function parseAuthenticationResults(value) {
  const [host, ...specs] = value.split(';').map((s) => s.trim());
  const results = [];
  for (const spec of specs) {
    const note = comments(spec).join(' ');
    const clean = stripComments(spec);
    const head = /^([a-z0-9-]+)\s*=\s*([a-z0-9]+)/i.exec(clean);
    if (!head) continue;
    const props = {};
    for (const m of clean.slice(head[0].length).matchAll(/([a-z]+\.[a-z0-9-]+)\s*=\s*("[^"]*"|\S+)/gi)) props[m[1].toLowerCase()] = m[2].replace(/^"|"$/g, '');
    results.push({ method: head[1].toLowerCase(), result: head[2].toLowerCase(), props, comment: note });
  }
  return { host: host ?? '', results };
}

/** Received-SPF : « pass (comment) client-ip=1.2.3.4; envelope-from=a@b; helo=h » */
export function parseReceivedSpf(value) {
  const result = /^\s*([a-z]+)/i.exec(value)?.[1]?.toLowerCase() ?? '';
  const field = (name) => new RegExp(`${name}\\s*=\\s*("[^"]*"|[^;\\s]+)`, 'i').exec(value)?.[1]?.replace(/^"|"$/g, '') ?? '';
  return { result, clientIp: field('client-ip'), envelopeFrom: field('envelope-from'), helo: field('helo'), comment: comments(value).join(' ') };
}

/** DKIM-Signature : balises (v, a, d, s, c, h, t, x, bh, b…) */
export function parseDkimSignature(value) {
  const tags = {};
  for (const part of value.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) tags[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).replace(/\s+/g, ' ').trim();
  }
  return {
    version: tags.v ?? '',
    algorithm: (tags.a ?? '').toLowerCase(),
    domain: (tags.d ?? '').toLowerCase(),
    selector: tags.s ?? '',
    canonicalization: tags.c ?? 'simple/simple',
    signedHeaders: (tags.h ?? '').toLowerCase().split(':').map((h) => h.trim()).filter(Boolean),
    timestamp: tags.t ? Number(tags.t) * 1000 : null,
    expiration: tags.x ? Number(tags.x) * 1000 : null,
    identity: tags.i ?? '',
    bodyHash: tags.bh ?? '',
  };
}

const hostOf = (s) => (s.includes('@') ? s.slice(s.lastIndexOf('@') + 1) : s).toLowerCase();
const aligned = (a, b) => Boolean(a && b) && (a === b || orgDomain(a) === orgDomain(b));

/**
 * Analyse complète des en-têtes collés.
 * @param {string} raw
 * @param {{ now?: number }} [options]
 */
export function analyzeHeaders(raw, { now = Date.now() } = {}) {
  const headers = parseHeaders(raw);
  const findings = [];
  const f = (code, severity, params) => findings.push(finding(code, severity, params));

  if (headers.length === 0) return { ok: false, headers, findings: [], counts: countBySeverity([]) };

  // --- Identités ---
  const from = parseAddress(first(headers, 'From'));
  const replyTo = parseAddress(first(headers, 'Reply-To'));
  const returnPath = parseAddress(first(headers, 'Return-Path'));
  const sender = parseAddress(first(headers, 'Sender'));
  const messageId = first(headers, 'Message-ID');
  const summary = {
    from: first(headers, 'From'),
    to: first(headers, 'To'),
    subject: first(headers, 'Subject'),
    date: first(headers, 'Date'),
    messageId,
  };
  const dateHeader = Date.parse(stripComments(summary.date));

  if (!from.address) f('hdr.noFrom', 'error');
  if (!messageId) f('hdr.noMessageId', 'warn');
  else {
    const idDomain = hostOf(messageId.replace(/[<>]/g, ''));
    if (from.domain && idDomain && !aligned(idDomain, from.domain)) f('hdr.messageIdDomain', 'info', { idDomain, fromDomain: from.domain });
  }
  if (!summary.date) f('hdr.noDate', 'warn');
  else if (!Number.isNaN(dateHeader) && dateHeader > now + 86_400_000) f('hdr.dateFuture', 'warn', { date: summary.date });

  if (from.name && /@/.test(from.name)) {
    const shown = parseAddress(from.name);
    if (shown.address && shown.address !== from.address) f('id.displayNameSpoof', 'warn', { shown: shown.address, real: from.address });
  }
  if (replyTo.address && from.address && !aligned(replyTo.domain, from.domain)) f('id.replyToMismatch', 'info', { replyDomain: replyTo.domain, fromDomain: from.domain });
  if (returnPath.address && from.domain && !aligned(returnPath.domain, from.domain)) f('id.returnPathMismatch', 'info', { returnDomain: returnPath.domain, fromDomain: from.domain });
  if (sender.address && from.address && sender.address !== from.address) f('id.senderDiffers', 'info', { sender: sender.address });

  // --- Chemin de livraison ---
  const received = all(headers, 'Received').map(parseReceived).reverse(); // le plus ancien d'abord
  const hops = received.map((hop, i) => ({ ...hop, index: i + 1, delayMs: i > 0 && hop.date != null && received[i - 1].date != null ? hop.date - received[i - 1].date : null }));
  if (hops.length === 0) f('hdr.noReceived', 'warn');
  hops.forEach((hop) => {
    if (hop.date == null) f('hop.noDate', 'info', { index: hop.index, by: hop.by });
    if (hop.delayMs != null && hop.delayMs < -60_000) f('hop.clockSkew', 'warn', { index: hop.index, seconds: Math.round(-hop.delayMs / 1000) });
    else if (hop.delayMs != null && hop.delayMs > 600_000) f('hop.delay', 'error', { index: hop.index, by: hop.by, minutes: Math.round(hop.delayMs / 60_000) });
    else if (hop.delayMs != null && hop.delayMs > 60_000) f('hop.delay', 'warn', { index: hop.index, by: hop.by, minutes: Math.max(1, Math.round(hop.delayMs / 60_000)) });
    if (hop.tls === false && hop.index > 1) f('hop.notEncrypted', 'warn', { index: hop.index, by: hop.by });
  });
  const dated = hops.filter((h) => h.date != null);
  const totalMs = dated.length > 1 ? dated.at(-1).date - dated[0].date : null;
  if (totalMs != null && totalMs > 600_000) f('hdr.totalDelaySlow', 'warn', { minutes: Math.round(totalMs / 60_000) });
  else if (totalMs != null) f('hdr.totalDelay', 'info', { seconds: Math.max(0, Math.round(totalMs / 1000)) });
  if (!Number.isNaN(dateHeader) && dated[0] && Math.abs(dated[0].date - dateHeader) > 86_400_000) f('hdr.dateSkew', 'warn', { hours: Math.round(Math.abs(dated[0].date - dateHeader) / 3_600_000) });

  // --- Authentification ---
  const authResults = all(headers, 'Authentication-Results').map(parseAuthenticationResults);
  const receivedSpf = all(headers, 'Received-SPF').map(parseReceivedSpf);
  const methods = {};
  for (const ar of authResults) for (const r of ar.results) methods[r.method] ??= { ...r, host: ar.host };
  const spf = methods.spf ?? (receivedSpf[0] ? { method: 'spf', result: receivedSpf[0].result, props: { 'smtp.mailfrom': receivedSpf[0].envelopeFrom }, comment: receivedSpf[0].comment, host: 'Received-SPF' } : null);
  const dkimResults = authResults.flatMap((ar) => ar.results.filter((r) => r.method === 'dkim').map((r) => ({ ...r, host: ar.host })));
  const dmarc = methods.dmarc ?? null;

  const RESULT = {
    spf: { pass: 'ok', fail: 'error', softfail: 'warn', neutral: 'info', none: 'warn', permerror: 'error', temperror: 'warn' },
    dkim: { pass: 'ok', fail: 'error', neutral: 'info', none: 'warn', policy: 'warn', permerror: 'error', temperror: 'warn' },
    dmarc: { pass: 'ok', fail: 'error', none: 'warn', bestguesspass: 'ok', permerror: 'error', temperror: 'warn' },
  };
  if (authResults.length === 0 && receivedSpf.length === 0) f('auth.none', 'warn');
  for (const [name, list] of [['spf', spf ? [spf] : []], ['dkim', dkimResults], ['dmarc', dmarc ? [dmarc] : []]]) {
    if (!list.length && authResults.length) f(`auth.${name}Missing`, 'warn');
    for (const r of list) f(`auth.${name}`, RESULT[name][r.result] ?? 'info', { result: r.result, domain: r.props['header.d'] ?? r.props['smtp.mailfrom'] ?? r.props['header.from'] ?? '', host: r.host });
  }
  if (all(headers, 'ARC-Seal').length) f('auth.arc', 'info', { count: all(headers, 'ARC-Seal').length });

  // --- Signatures DKIM ---
  const signatures = all(headers, 'DKIM-Signature').map(parseDkimSignature);
  for (const s of signatures) {
    if (/sha1/.test(s.algorithm)) f('dkim.weakAlgorithm', 'warn', { domain: s.domain, algorithm: s.algorithm });
    if (s.expiration && s.expiration < now) f('dkim.expired', 'warn', { domain: s.domain });
    if (s.signedHeaders.length && !s.signedHeaders.includes('from')) f('dkim.fromNotSigned', 'error', { domain: s.domain });
  }

  // --- Alignement DMARC (relaxé) ---
  const spfDomain = hostOf(spf?.props?.['smtp.mailfrom'] ?? returnPath.address ?? '');
  const alignment = {
    spf: { domain: spfDomain, passed: spf?.result === 'pass', aligned: spf?.result === 'pass' && aligned(spfDomain, from.domain) },
    dkim: signatures.map((s) => ({ domain: s.domain, selector: s.selector, passed: dkimResults.some((r) => r.result === 'pass' && (r.props['header.d'] ?? '').toLowerCase() === s.domain), aligned: aligned(s.domain, from.domain) })),
  };
  const anyAligned = alignment.spf.aligned || alignment.dkim.some((d) => d.passed && d.aligned);
  if (from.domain && (spf || dkimResults.length)) {
    if (anyAligned) f('align.ok', 'ok', { domain: from.domain });
    else if (alignment.spf.passed || alignment.dkim.some((d) => d.passed)) f('align.none', 'warn', { domain: from.domain });
  }

  // --- Signaux de spam et de courrier de masse ---
  const spam = {};
  const status = first(headers, 'X-Spam-Status');
  if (status) {
    spam.spamAssassin = status;
    f(/^yes/i.test(status) ? 'spam.flagged' : 'spam.clean', /^yes/i.test(status) ? 'warn' : 'ok', { status: status.slice(0, 80) });
  }
  const scl = first(headers, 'X-MS-Exchange-Organization-SCL') || /\bSCL:(-?\d+)/i.exec(first(headers, 'X-Forefront-Antispam-Report'))?.[1] || '';
  if (scl !== '') {
    spam.scl = Number(scl);
    f(spam.scl >= 5 ? 'spam.scl' : 'spam.sclLow', spam.scl >= 5 ? 'warn' : 'info', { scl: spam.scl });
  }
  const forefront = first(headers, 'X-Forefront-Antispam-Report');
  if (forefront) spam.forefront = Object.fromEntries(forefront.split(';').map((p) => p.trim().split(/:(.*)/s)).filter(([k]) => k).map(([k, v]) => [k, (v ?? '').trim()]));
  const unsubscribe = first(headers, 'List-Unsubscribe');
  if (unsubscribe) {
    f('bulk.listUnsubscribe', 'info');
    if (!first(headers, 'List-Unsubscribe-Post')) f('bulk.noOneClick', 'info');
  } else if (/bulk|list|junk/i.test(first(headers, 'Precedence'))) f('bulk.noUnsubscribe', 'warn');

  return {
    ok: true,
    headers,
    summary,
    from,
    replyTo,
    returnPath,
    hops,
    totalMs,
    authentication: { spf, dkim: dkimResults, dmarc, hosts: [...new Set(authResults.map((a) => a.host))] },
    signatures,
    alignment,
    spam,
    findings,
    counts: countBySeverity(findings),
  };
}
