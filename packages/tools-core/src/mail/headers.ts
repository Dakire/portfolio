// Analyse des en-têtes d'un e-mail : chemin de livraison (Received) avec délais et chiffrement, authentification (SPF, DKIM, DMARC,
// ARC), signatures DKIM, identités (From, Return-Path, Reply-To…) et alignement, signaux de spam et de courrier de masse.
// Fonctions pures : le texte collé n'est jamais envoyé nulle part.
import { orgDomain } from '../dns/domain.js';
import { countBySeverity, finding, type Finding, type Severity } from '../dns/findings.js';

export interface Header {
  name: string;
  value: string;
}

// --- Lecture des en-têtes ---

/** Texte brut -> [{ name, value }] dans l'ordre du message. Accepte un éventuel « From » mbox initial et s'arrête au corps. */
export function parseHeaders(raw: unknown): Header[] {
  const lines = String(raw).replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
  if (/^From \S+/.test(lines[0] ?? '')) lines.shift(); // ligne d'enveloppe mbox
  const headers: Header[] = [];
  for (const line of lines) {
    if (line.trim() === '' && headers.length) break; // fin des en-têtes
    const last = headers.at(-1);
    if (/^[ \t]/.test(line) && last) {
      last.value += ` ${line.trim()}`;
      continue;
    }
    const m = /^([^\s:][^:]*):[ \t]*(.*)$/.exec(line);
    if (m) headers.push({ name: (m[1] ?? '').trim(), value: (m[2] ?? '').trim() });
  }
  return headers;
}

const all = (headers: Header[], name: string): string[] =>
  headers.filter((h) => h.name.toLowerCase() === name.toLowerCase()).map((h) => h.value);
const first = (headers: Header[], name: string): string => all(headers, name)[0] ?? '';

/** Supprime les commentaires entre parenthèses (RFC 5322), en gardant leur texte à part. */
const stripComments = (s: string): string =>
  s
    .replace(/\([^()]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const comments = (s: string): string[] => [...s.matchAll(/\(([^()]*)\)/g)].map((m) => m[1] ?? '');

export interface Address {
  name: string;
  address: string;
  domain: string;
}

/** « Jean <jean@example.org> », « jean@example.org » -> { name, address, domain } */
export function parseAddress(value: unknown): Address {
  const text = String(value).trim();
  const angle = /^(.*?)\s*<([^<>]+)>/.exec(text);
  const address = (angle ? (angle[2] ?? '') : (/([^\s<>"',;]+@[^\s<>"',;]+)/.exec(text)?.[1] ?? ''))
    .trim()
    .replace(/^mailto:/i, '');
  const name = (angle ? (angle[1] ?? '') : '').replace(/^"|"$/g, '').trim();
  const at = address.lastIndexOf('@');
  return {
    name,
    address: address.toLowerCase(),
    domain: at > 0 ? address.slice(at + 1).toLowerCase() : '',
  };
}

// --- Received ---

const DATE_AT_END = /;\s*([^;]+)$/;

export interface Hop {
  from: string;
  by: string;
  protocol: string;
  tls: boolean | null;
  ips: string[];
  id: string;
  date: number | null;
  raw: string;
}

/** Une ligne Received -> hôtes, protocole, chiffrement, adresses IP, horodatage. */
export function parseReceived(value: string): Hop {
  const dateText = DATE_AT_END.exec(value)?.[1] ?? '';
  const date = Date.parse(stripComments(dateText));
  const body = value.replace(DATE_AT_END, '');
  const grab = (re: RegExp): string => re.exec(body)?.[1] ?? '';
  const ips = [
    ...new Set(
      [...body.matchAll(/\[?((?:\d{1,3}\.){3}\d{1,3})\]?|\[(ipv6:)?([0-9a-f:]{3,})\]/gi)]
        .map((m) => m[1] ?? m[3])
        .filter((ip): ip is string => Boolean(ip)),
    ),
  ];
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

export interface AuthResult {
  method: string;
  result: string;
  props: Record<string, string>;
  comment: string;
  host?: string;
}

/** « mx.google.com; dkim=pass header.d=a.b; spf=pass smtp.mailfrom=x@y » -> { host, results: [{ method, result, props, comment }] } */
export function parseAuthenticationResults(value: string): { host: string; results: AuthResult[] } {
  const [host, ...specs] = value.split(';').map((s) => s.trim());
  const results: AuthResult[] = [];
  for (const spec of specs) {
    const note = comments(spec).join(' ');
    const clean = stripComments(spec);
    const head = /^([a-z0-9-]+)\s*=\s*([a-z0-9]+)/i.exec(clean);
    if (!head) continue;
    const props: Record<string, string> = {};
    for (const m of clean
      .slice(head[0].length)
      .matchAll(/([a-z]+\.[a-z0-9-]+)\s*=\s*("[^"]*"|\S+)/gi))
      props[(m[1] ?? '').toLowerCase()] = (m[2] ?? '').replace(/^"|"$/g, '');
    results.push({
      method: (head[1] ?? '').toLowerCase(),
      result: (head[2] ?? '').toLowerCase(),
      props,
      comment: note,
    });
  }
  return { host: host ?? '', results };
}

/** Received-SPF : « pass (comment) client-ip=1.2.3.4; envelope-from=a@b; helo=h » */
export function parseReceivedSpf(value: string) {
  const result = /^\s*([a-z]+)/i.exec(value)?.[1]?.toLowerCase() ?? '';
  const field = (name: string): string =>
    new RegExp(`${name}\\s*=\\s*("[^"]*"|[^;\\s]+)`, 'i').exec(value)?.[1]?.replace(/^"|"$/g, '') ??
    '';
  return {
    result,
    clientIp: field('client-ip'),
    envelopeFrom: field('envelope-from'),
    helo: field('helo'),
    comment: comments(value).join(' '),
  };
}

/** DKIM-Signature : balises (v, a, d, s, c, h, t, x, bh, b…) */
export function parseDkimSignature(value: string) {
  const tags: Record<string, string> = {};
  for (const part of value.split(';')) {
    const i = part.indexOf('=');
    if (i > 0)
      tags[part.slice(0, i).trim().toLowerCase()] = part
        .slice(i + 1)
        .replace(/\s+/g, ' ')
        .trim();
  }
  return {
    version: tags.v ?? '',
    algorithm: (tags.a ?? '').toLowerCase(),
    domain: (tags.d ?? '').toLowerCase(),
    selector: tags.s ?? '',
    canonicalization: tags.c ?? 'simple/simple',
    signedHeaders: (tags.h ?? '')
      .toLowerCase()
      .split(':')
      .map((h) => h.trim())
      .filter(Boolean),
    timestamp: tags.t ? Number(tags.t) * 1000 : null,
    expiration: tags.x ? Number(tags.x) * 1000 : null,
    identity: tags.i ?? '',
    bodyHash: tags.bh ?? '',
  };
}

const hostOf = (s: string): string =>
  (s.includes('@') ? s.slice(s.lastIndexOf('@') + 1) : s).toLowerCase();
const aligned = (a: string, b: string): boolean =>
  Boolean(a && b) && (a === b || orgDomain(a) === orgDomain(b));

type ResultTable = Record<string, Severity>;

export interface HeadersAnalysis {
  ok: boolean;
  headers: Header[];
  summary?: { from: string; to: string; subject: string; date: string; messageId: string };
  from?: Address;
  replyTo?: Address;
  returnPath?: Address;
  hops?: (Hop & { index: number; delayMs: number | null })[];
  totalMs?: number | null;
  authentication?: {
    spf: AuthResult | null;
    dkim: AuthResult[];
    dmarc: AuthResult | null;
    hosts: string[];
  };
  signatures?: ReturnType<typeof parseDkimSignature>[];
  alignment?: {
    spf: { domain: string; passed: boolean; aligned: boolean };
    dkim: { domain: string; selector: string; passed: boolean; aligned: boolean }[];
  };
  spam?: { spamAssassin?: string; scl?: number; forefront?: Record<string, string> };
  findings: Finding[];
  counts: Record<Severity, number>;
}

/** Analyse complète des en-têtes collés. */
export function analyzeHeaders(
  raw: string,
  { now = Date.now() }: { now?: number } = {},
): HeadersAnalysis {
  const headers = parseHeaders(raw);
  const findings: Finding[] = [];
  const f = (code: string, severity: Severity, params?: Finding['params']) =>
    findings.push(finding(code, severity, params));

  if (headers.length === 0)
    return { ok: false, headers, findings: [], counts: countBySeverity([]) };

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
    if (from.domain && idDomain && !aligned(idDomain, from.domain))
      f('hdr.messageIdDomain', 'info', { idDomain, fromDomain: from.domain });
  }
  if (!summary.date) f('hdr.noDate', 'warn');
  else if (!Number.isNaN(dateHeader) && dateHeader > now + 86_400_000)
    f('hdr.dateFuture', 'warn', { date: summary.date });

  if (from.name && /@/.test(from.name)) {
    const shown = parseAddress(from.name);
    if (shown.address && shown.address !== from.address)
      f('id.displayNameSpoof', 'warn', { shown: shown.address, real: from.address });
  }
  if (replyTo.address && from.address && !aligned(replyTo.domain, from.domain))
    f('id.replyToMismatch', 'info', { replyDomain: replyTo.domain, fromDomain: from.domain });
  if (returnPath.address && from.domain && !aligned(returnPath.domain, from.domain))
    f('id.returnPathMismatch', 'info', {
      returnDomain: returnPath.domain,
      fromDomain: from.domain,
    });
  if (sender.address && from.address && sender.address !== from.address)
    f('id.senderDiffers', 'info', { sender: sender.address });

  // --- Chemin de livraison ---
  const received = all(headers, 'Received').map(parseReceived).reverse(); // le plus ancien d'abord
  const hops = received.map((hop, i) => {
    const previous = received[i - 1]?.date ?? null;
    return {
      ...hop,
      index: i + 1,
      delayMs: i > 0 && hop.date != null && previous != null ? hop.date - previous : null,
    };
  });
  if (hops.length === 0) f('hdr.noReceived', 'warn');
  hops.forEach((hop) => {
    if (hop.date == null) f('hop.noDate', 'info', { index: hop.index, by: hop.by });
    if (hop.delayMs != null && hop.delayMs < -60_000)
      f('hop.clockSkew', 'warn', { index: hop.index, seconds: Math.round(-hop.delayMs / 1000) });
    else if (hop.delayMs != null && hop.delayMs > 600_000)
      f('hop.delay', 'error', {
        index: hop.index,
        by: hop.by,
        minutes: Math.round(hop.delayMs / 60_000),
      });
    else if (hop.delayMs != null && hop.delayMs > 60_000)
      f('hop.delay', 'warn', {
        index: hop.index,
        by: hop.by,
        minutes: Math.max(1, Math.round(hop.delayMs / 60_000)),
      });
    if (hop.tls === false && hop.index > 1)
      f('hop.notEncrypted', 'warn', { index: hop.index, by: hop.by });
  });
  const dated = hops.filter((h): h is typeof h & { date: number } => h.date != null);
  const lastDated = dated.at(-1);
  const firstDated = dated[0];
  const totalMs =
    dated.length > 1 && lastDated && firstDated ? lastDated.date - firstDated.date : null;
  if (totalMs != null && totalMs > 600_000)
    f('hdr.totalDelaySlow', 'warn', { minutes: Math.round(totalMs / 60_000) });
  else if (totalMs != null)
    f('hdr.totalDelay', 'info', { seconds: Math.max(0, Math.round(totalMs / 1000)) });
  if (
    !Number.isNaN(dateHeader) &&
    firstDated &&
    Math.abs(firstDated.date - dateHeader) > 86_400_000
  )
    f('hdr.dateSkew', 'warn', {
      hours: Math.round(Math.abs(firstDated.date - dateHeader) / 3_600_000),
    });

  // --- Authentification ---
  const authResults = all(headers, 'Authentication-Results').map(parseAuthenticationResults);
  const receivedSpf = all(headers, 'Received-SPF').map(parseReceivedSpf);
  const methods: Record<string, AuthResult> = {};
  for (const ar of authResults)
    for (const r of ar.results) methods[r.method] ??= { ...r, host: ar.host };
  const firstSpf = receivedSpf[0];
  const spf: AuthResult | null =
    methods.spf ??
    (firstSpf
      ? {
          method: 'spf',
          result: firstSpf.result,
          props: { 'smtp.mailfrom': firstSpf.envelopeFrom },
          comment: firstSpf.comment,
          host: 'Received-SPF',
        }
      : null);
  const dkimResults: AuthResult[] = authResults.flatMap((ar) =>
    ar.results.filter((r) => r.method === 'dkim').map((r) => ({ ...r, host: ar.host })),
  );
  const dmarc = methods.dmarc ?? null;

  const RESULT: Record<string, ResultTable> = {
    spf: {
      pass: 'ok',
      fail: 'error',
      softfail: 'warn',
      neutral: 'info',
      none: 'warn',
      permerror: 'error',
      temperror: 'warn',
    },
    dkim: {
      pass: 'ok',
      fail: 'error',
      neutral: 'info',
      none: 'warn',
      policy: 'warn',
      permerror: 'error',
      temperror: 'warn',
    },
    dmarc: {
      pass: 'ok',
      fail: 'error',
      none: 'warn',
      bestguesspass: 'ok',
      permerror: 'error',
      temperror: 'warn',
    },
  };
  if (authResults.length === 0 && receivedSpf.length === 0) f('auth.none', 'warn');
  const lists: [string, AuthResult[]][] = [
    ['spf', spf ? [spf] : []],
    ['dkim', dkimResults],
    ['dmarc', dmarc ? [dmarc] : []],
  ];
  for (const [name, list] of lists) {
    if (!list.length && authResults.length) f(`auth.${name}Missing`, 'warn');
    for (const r of list)
      f(`auth.${name}`, RESULT[name]?.[r.result] ?? 'info', {
        result: r.result,
        domain: r.props['header.d'] ?? r.props['smtp.mailfrom'] ?? r.props['header.from'] ?? '',
        host: r.host,
      });
  }
  if (all(headers, 'ARC-Seal').length)
    f('auth.arc', 'info', { count: all(headers, 'ARC-Seal').length });

  // --- Signatures DKIM ---
  const signatures = all(headers, 'DKIM-Signature').map(parseDkimSignature);
  for (const s of signatures) {
    if (/sha1/.test(s.algorithm))
      f('dkim.weakAlgorithm', 'warn', { domain: s.domain, algorithm: s.algorithm });
    if (s.expiration && s.expiration < now) f('dkim.expired', 'warn', { domain: s.domain });
    if (s.signedHeaders.length && !s.signedHeaders.includes('from'))
      f('dkim.fromNotSigned', 'error', { domain: s.domain });
  }

  // --- Alignement DMARC (relaxé) ---
  const spfDomain = hostOf(spf?.props['smtp.mailfrom'] ?? returnPath.address ?? '');
  const alignment = {
    spf: {
      domain: spfDomain,
      passed: spf?.result === 'pass',
      aligned: spf?.result === 'pass' && aligned(spfDomain, from.domain),
    },
    dkim: signatures.map((s) => ({
      domain: s.domain,
      selector: s.selector,
      passed: dkimResults.some(
        (r) => r.result === 'pass' && (r.props['header.d'] ?? '').toLowerCase() === s.domain,
      ),
      aligned: aligned(s.domain, from.domain),
    })),
  };
  const anyAligned = alignment.spf.aligned || alignment.dkim.some((d) => d.passed && d.aligned);
  if (from.domain && (spf || dkimResults.length)) {
    if (anyAligned) f('align.ok', 'ok', { domain: from.domain });
    else if (alignment.spf.passed || alignment.dkim.some((d) => d.passed))
      f('align.none', 'warn', { domain: from.domain });
  }

  // --- Signaux de spam et de courrier de masse ---
  const spam: NonNullable<HeadersAnalysis['spam']> = {};
  const status = first(headers, 'X-Spam-Status');
  if (status) {
    spam.spamAssassin = status;
    f(/^yes/i.test(status) ? 'spam.flagged' : 'spam.clean', /^yes/i.test(status) ? 'warn' : 'ok', {
      status: status.slice(0, 80),
    });
  }
  const scl =
    first(headers, 'X-MS-Exchange-Organization-SCL') ||
    /\bSCL:(-?\d+)/i.exec(first(headers, 'X-Forefront-Antispam-Report'))?.[1] ||
    '';
  if (scl !== '') {
    const level = Number(scl);
    spam.scl = level;
    f(level >= 5 ? 'spam.scl' : 'spam.sclLow', level >= 5 ? 'warn' : 'info', { scl: level });
  }
  const forefront = first(headers, 'X-Forefront-Antispam-Report');
  if (forefront)
    spam.forefront = Object.fromEntries(
      forefront
        .split(';')
        .map((p) => p.trim().split(/:(.*)/s))
        .filter(([k]) => k)
        .map(([k, v]) => [k ?? '', (v ?? '').trim()]),
    );
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
    authentication: {
      spf,
      dkim: dkimResults,
      dmarc,
      hosts: [...new Set(authResults.map((a) => a.host))],
    },
    signatures,
    alignment,
    spam,
    findings,
    counts: countBySeverity(findings),
  };
}
