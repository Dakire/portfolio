import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { describeHeaderFinding, EMAIL_HEADERS } from '../../../src/tools/email-headers/text';
import { SAMPLE_HEADERS } from '../../../src/tools/email-headers/sample';
import {
  analyzeHeaders,
  parseAddress,
  parseAuthenticationResults,
  parseDkimSignature,
  parseHeaders,
  parseReceived,
  parseReceivedSpf,
} from '@grichard/tools-core/mail/headers';

const has = (findings, code, severity) =>
  findings.some((f) => f.code === code && (!severity || f.severity === severity));
const NOW = Date.UTC(2025, 5, 3, 12, 0, 0);

describe('lecture des en-têtes', () => {
  it("déplie les lignes, ignore la ligne mbox et s'arrête au corps", () => {
    const h = parseHeaders(
      'From bounce@x.org Tue Jun  3 10:00:00 2025\r\nSubject: Un titre\r\n très long\r\n\tsuite\r\nX-Test: ok\r\n\r\nCorps: pas un en-tête\r\n',
    );
    expect(h).toEqual([
      { name: 'Subject', value: 'Un titre très long suite' },
      { name: 'X-Test', value: 'ok' },
    ]);
  });

  it('lit les adresses', () => {
    expect(parseAddress('"Jean Dupont" <Jean@Example.ORG>')).toEqual({
      name: 'Jean Dupont',
      address: 'jean@example.org',
      domain: 'example.org',
    });
    expect(parseAddress('jean@example.org')).toMatchObject({
      address: 'jean@example.org',
      name: '',
    });
    expect(parseAddress('<>')).toMatchObject({ address: '' });
  });

  it('lit un Received : hôtes, chiffrement, IP, date', () => {
    const r = parseReceived(
      'from a.example.net (a.example.net [203.0.113.5]) by mx.ovh.net with ESMTPS id x1 (version=TLSv1.3 cipher=TLS_AES_256_GCM_SHA384); Tue, 3 Jun 2025 10:00:07 +0200 (CEST)',
    );
    expect(r).toMatchObject({
      from: 'a.example.net',
      by: 'mx.ovh.net',
      protocol: 'ESMTPS',
      tls: true,
      ips: ['203.0.113.5'],
      id: 'x1',
      date: Date.UTC(2025, 5, 3, 8, 0, 7),
    });
    expect(parseReceived('from x by y with ESMTP id z; Tue, 3 Jun 2025 10:00:07 +0200').tls).toBe(
      false,
    );
    expect(parseReceived('from x by y with HTTP; Tue, 3 Jun 2025 10:00:07 +0200').tls).toBeNull();
    expect(parseReceived('from x by y; pas une date').date).toBeNull();
    expect(
      parseReceived('from [2001:db8::1] by y with ESMTP; Tue, 3 Jun 2025 10:00:07 +0200').ips,
    ).toContain('2001:db8::1');
  });

  it('lit Authentication-Results, Received-SPF et DKIM-Signature', () => {
    const ar = parseAuthenticationResults(
      'mx.google.com; dkim=pass header.i=@example.org header.s=sel header.b=abc; spf=pass (google.com: domain of x@y.fr designates 1.2.3.4 as permitted sender) smtp.mailfrom=x@y.fr; dmarc=fail (p=REJECT) header.from=example.org',
    );
    expect(ar.host).toBe('mx.google.com');
    expect(ar.results.map((r) => [r.method, r.result])).toEqual([
      ['dkim', 'pass'],
      ['spf', 'pass'],
      ['dmarc', 'fail'],
    ]);
    expect(ar.results[1].props['smtp.mailfrom']).toBe('x@y.fr');
    expect(ar.results[1].comment).toContain('permitted sender');
    expect(
      parseReceivedSpf(
        'Pass (mx: domain of a@b.c designates 1.2.3.4) client-ip=1.2.3.4; envelope-from="a@b.c"; helo=h.b.c;',
      ),
    ).toMatchObject({ result: 'pass', clientIp: '1.2.3.4', envelopeFrom: 'a@b.c', helo: 'h.b.c' });
    const sig = parseDkimSignature(
      'v=1; a=rsa-sha256; c=relaxed/relaxed; d=Example.ORG; s=sel; t=1748937604; x=1748941204; h=From:To:Subject; bh=abc; b=def',
    );
    expect(sig).toMatchObject({
      algorithm: 'rsa-sha256',
      domain: 'example.org',
      selector: 'sel',
      canonicalization: 'relaxed/relaxed',
      signedHeaders: ['from', 'to', 'subject'],
      timestamp: 1_748_937_604_000,
      expiration: 1_748_941_204_000,
    });
  });
});

describe("analyse du message d'exemple", () => {
  const r = analyzeHeaders(SAMPLE_HEADERS, { now: NOW });

  it("reconstitue le chemin (plus ancien d'abord) avec les délais", () => {
    expect(r.ok).toBe(true);
    expect(r.hops.map((h) => h.by)).toEqual([
      'smtp.example-mailer.net',
      'mail-out.example-mailer.net',
      'mx1.mail.ovh.net',
    ]);
    expect(r.hops.map((h) => h.delayMs)).toEqual([null, 1000, 2000]);
    expect(r.totalMs).toBe(3000);
    expect(r.hops.map((h) => h.tls)).toEqual([true, false, true]);
  });

  it("lit l'authentification et l'alignement", () => {
    expect(r.authentication.spf.result).toBe('pass');
    expect(r.authentication.dkim[0]).toMatchObject({ result: 'pass', host: 'mx1.mail.ovh.net' });
    expect(r.authentication.dmarc.result).toBe('pass');
    expect(r.signatures[0]).toMatchObject({
      domain: 'example-mailer.net',
      selector: 'mail2025',
      algorithm: 'rsa-sha256',
    });
    expect(r.alignment.spf).toMatchObject({ passed: true, aligned: true });
    expect(has(r.findings, 'align.ok', 'ok')).toBe(true);
  });

  it('ne signale que le nécessaire pour un message sain', () => {
    const bad = r.findings.filter((f) => f.severity === 'error');
    expect(bad).toEqual([]);
    expect(has(r.findings, 'hop.notEncrypted', 'warn')).toBe(true); // le saut intermédiaire est en clair
    expect(has(r.findings, 'bulk.listUnsubscribe', 'info')).toBe(true);
    expect(r.summary.subject).toBe('Votre facture de mai');
  });
});

describe('détection des problèmes', () => {
  const base = (extra) =>
    `From: "PayPal" <service@paypal.com>\nTo: moi@example.org\nSubject: Alerte\nDate: Tue, 3 Jun 2025 10:00:00 +0200\nMessage-ID: <abc@evil.test>\n${extra}`;

  it('échecs SPF / DKIM / DMARC', () => {
    const r = analyzeHeaders(
      base(
        'Authentication-Results: mx.test; spf=fail smtp.mailfrom=x@evil.test; dkim=none; dmarc=fail header.from=paypal.com\nReceived: from a by b with ESMTP; Tue, 3 Jun 2025 10:00:01 +0200',
      ),
      { now: NOW },
    );
    expect(has(r.findings, 'auth.spf', 'error')).toBe(true);
    expect(has(r.findings, 'auth.dkim', 'warn')).toBe(true);
    expect(has(r.findings, 'auth.dmarc', 'error')).toBe(true);
    expect(has(r.findings, 'hdr.messageIdDomain', 'info')).toBe(true);
  });

  it("absence d'authentification, de Received, de Message-ID", () => {
    const r = analyzeHeaders('From: a@b.fr\nSubject: x\n', { now: NOW });
    for (const code of ['auth.none', 'hdr.noReceived', 'hdr.noMessageId', 'hdr.noDate'])
      expect(has(r.findings, code, 'warn'), code).toBe(true);
    expect(analyzeHeaders('', { now: NOW }).ok).toBe(false);
    expect(has(analyzeHeaders('Subject: x\n', { now: NOW }).findings, 'hdr.noFrom', 'error')).toBe(
      true,
    );
  });

  it('usurpation du nom affiché, Reply-To et Return-Path différents', () => {
    const r = analyzeHeaders(
      'From: "ceo@banque.fr" <inconnu@evil.test>\nReply-To: boite@autre.test\nReturn-Path: <bounce@tiers.test>\nSender: gestion@evil.test\nMessage-ID: <1@evil.test>\nDate: Tue, 3 Jun 2025 10:00:00 +0200\nReceived: from a by b; Tue, 3 Jun 2025 10:00:00 +0200\n',
      { now: NOW },
    );
    expect(has(r.findings, 'id.displayNameSpoof', 'warn')).toBe(true);
    expect(has(r.findings, 'id.replyToMismatch', 'info')).toBe(true);
    expect(has(r.findings, 'id.returnPathMismatch', 'info')).toBe(true);
    expect(has(r.findings, 'id.senderDiffers', 'info')).toBe(true);
  });

  it('délais, horloge décalée, chiffrement et date incohérente', () => {
    const r = analyzeHeaders(
      `From: a@b.fr\nDate: Mon, 2 Jun 2025 08:00:00 +0200\nMessage-ID: <1@b.fr>\nReceived: from c by d with ESMTP; Tue, 3 Jun 2025 10:30:00 +0200\nReceived: from b by c with ESMTP; Tue, 3 Jun 2025 10:10:00 +0200\nReceived: from a by b with ESMTPS; Tue, 3 Jun 2025 10:09:00 +0200\n`,
      { now: NOW },
    );
    expect(has(r.findings, 'hop.delay', 'error')).toBe(true); // 20 minutes
    expect(has(r.findings, 'hdr.totalDelaySlow', 'warn')).toBe(true);
    expect(has(r.findings, 'hdr.dateSkew', 'warn')).toBe(true);
    const skew = analyzeHeaders(
      'From: a@b.fr\nReceived: from b by c; Tue, 3 Jun 2025 10:00:00 +0200\nReceived: from a by b; Tue, 3 Jun 2025 10:05:00 +0200\n',
      { now: NOW },
    );
    expect(has(skew.findings, 'hop.clockSkew', 'warn')).toBe(true);
    expect(
      has(
        analyzeHeaders('From: a@b.fr\nDate: Tue, 3 Jun 2030 10:00:00 +0200\n', { now: NOW })
          .findings,
        'hdr.dateFuture',
        'warn',
      ),
    ).toBe(true);
  });

  it('signature DKIM faible, expirée, sans From signé', () => {
    const r = analyzeHeaders(
      'From: a@b.fr\nDKIM-Signature: v=1; a=rsa-sha1; d=b.fr; s=x; x=1000000000; h=to:subject; bh=1; b=2\n',
      { now: NOW },
    );
    for (const code of ['dkim.weakAlgorithm', 'dkim.expired'])
      expect(has(r.findings, code, 'warn'), code).toBe(true);
    expect(has(r.findings, 'dkim.fromNotSigned', 'error')).toBe(true);
  });

  it('SPF et DKIM valides mais non alignés avec le From', () => {
    const r = analyzeHeaders(
      'From: a@marque.fr\nReturn-Path: <b@prestataire.test>\nAuthentication-Results: mx; spf=pass smtp.mailfrom=b@prestataire.test; dkim=pass header.d=prestataire.test header.s=s1\nDKIM-Signature: v=1; a=rsa-sha256; d=prestataire.test; s=s1; h=from; bh=1; b=2\nReceived: from x by y; Tue, 3 Jun 2025 10:00:00 +0200\nMessage-ID: <1@marque.fr>\nDate: Tue, 3 Jun 2025 10:00:00 +0200\n',
      { now: NOW },
    );
    expect(has(r.findings, 'align.none', 'warn')).toBe(true);
  });

  it('signaux de spam et de courrier de masse', () => {
    const r = analyzeHeaders(
      'From: a@b.fr\nX-Spam-Status: Yes, score=9.1 required=5.0\nX-MS-Exchange-Organization-SCL: 6\nX-Forefront-Antispam-Report: CIP:1.2.3.4;CTRY:US;SFV:SPM;SCL:6\nPrecedence: bulk\n',
      { now: NOW },
    );
    expect(has(r.findings, 'spam.flagged', 'warn')).toBe(true);
    expect(has(r.findings, 'spam.scl', 'warn')).toBe(true);
    expect(has(r.findings, 'bulk.noUnsubscribe', 'warn')).toBe(true);
    expect(r.spam.forefront.SFV).toBe('SPM');
    const ok = analyzeHeaders(
      'From: a@b.fr\nList-Unsubscribe: <https://x.test/u>\nList-Unsubscribe-Post: List-Unsubscribe=One-Click\n',
      { now: NOW },
    );
    expect(has(ok.findings, 'bulk.noOneClick')).toBe(false);
  });

  it('prend Received-SPF quand Authentication-Results est absent', () => {
    const r = analyzeHeaders(
      'From: a@b.fr\nReceived-SPF: softfail (x: domain of transitioning) client-ip=1.2.3.4; envelope-from=a@b.fr\n',
      { now: NOW },
    );
    expect(has(r.findings, 'auth.spf', 'warn')).toBe(true);
  });
});

describe("textes de l'analyseur d'en-têtes", () => {
  // Codes présents dans le code d'analyse, y compris ceux construits par gabarit (auth.<méthode>, spam.scl / spam.sclLow)
  const sourceCodes = () => {
    const source = readFileSync('../../packages/tools-core/src/mail/headers.ts', 'utf-8');
    const found = new Set(
      [...source.matchAll(/'((?:hdr|id|hop|auth|dkim|align|spam|bulk)\.[A-Za-z0-9]+)'/g)].map(
        (m) => m[1],
      ),
    );
    for (const method of ['spf', 'dkim', 'dmarc']) {
      found.add(`auth.${method}`);
      found.add(`auth.${method}Missing`);
    }
    return found;
  };

  it('chaque code de constat est traduit dans les deux langues, avec les mêmes paramètres', () => {
    const codes = sourceCodes();
    expect(codes.size).toBeGreaterThan(30);
    for (const lang of ['fr', 'en']) {
      expect(
        [...codes].filter((c) => !EMAIL_HEADERS[lang].messages[c]),
        `${lang}: codes sans traduction`,
      ).toEqual([]);
    }
    expect(Object.keys(EMAIL_HEADERS.en.messages).sort()).toEqual(
      Object.keys(EMAIL_HEADERS.fr.messages).sort(),
    );
    const params = (s) => [...(s ?? '').matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const [code, fr] of Object.entries(EMAIL_HEADERS.fr.messages)) {
      const en = EMAIL_HEADERS.en.messages[code];
      for (const key of ['title', 'detail', 'fix'])
        expect(params(en[key]), `${code}.${key}`).toEqual(params(fr[key]));
    }
  });

  it("aucun message ne reste sans code dans le code d'analyse", () => {
    const codes = sourceCodes();
    expect(Object.keys(EMAIL_HEADERS.fr.messages).filter((c) => !codes.has(c))).toEqual([]);
  });

  it('describeHeaderFinding remplit les paramètres', () => {
    const d = describeHeaderFinding('fr', {
      code: 'hop.delay',
      params: { index: 2, by: 'mx.example.org', minutes: 12 },
    });
    expect(d.detail).toContain('12 min');
    expect(d.detail).toContain('mx.example.org');
  });
});
