import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { analyzeDomain } from '../../src/lib/dns/analyze.js';
import { analyzeDkim, analyzeDkimRecord, rsaKeyBits } from '../../src/lib/dns/dkim.js';
import { analyzeDmarc, analyzeDmarcRecord, parseDmarcTags, parseReportUris } from '../../src/lib/dns/dmarc.js';
import { normalizeDomain, orgDomain, parseSelectors } from '../../src/lib/dns/domain.js';
import { isIPv4, isIPv6, isPrivateIPv4, isPrivateIPv6 } from '../../src/lib/dns/ip.js';
import { analyzeMx, parseMx } from '../../src/lib/dns/mx.js';
import { detectProviders, guessSelectors } from '../../src/lib/dns/providers.js';
import { parseCaa, parseSoa } from '../../src/lib/dns/records.js';
import { parseTxtData } from '../../src/lib/dns/resolver.js';
import { analyzeSpf, parseSpf, parseTerm } from '../../src/lib/dns/spf.js';
import { classifyTxt } from '../../src/lib/dns/txt.js';
import { fakeResolver, healthyZone } from './helpers/fake-dns.js';

const codes = (findings) => findings.map((f) => f.code);
const has = (findings, code, severity) => findings.some((f) => f.code === code && (!severity || f.severity === severity));

const rsaPublicKey = (bits) => generateKeyPairSync('rsa', { modulusLength: bits }).publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

describe('normalizeDomain', () => {
  it.each([
    ['Example.COM', 'example.com'],
    ['https://www.example.com/chemin?x=1#a', 'www.example.com'],
    ['contact@example.org', 'example.org'],
    ['example.com.', 'example.com'],
    ['example.com:8080', 'example.com'],
    ['bücher.example', 'xn--bcher-kva.example'],
    ['  sous.domaine.example.fr  ', 'sous.domaine.example.fr'],
  ])('%s -> %s', (input, expected) => expect(normalizeDomain(input)).toEqual({ domain: expected }));

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['localhost', 'invalid'],
    ['192.168.0.1', 'ip'],
    ['-bad-.example.com', 'invalid'],
    ['exa mple.com', 'invalid'],
    ['a'.repeat(64) + '.com', 'invalid'],
  ])('refuse « %s » (%s)', (input, error) => expect(normalizeDomain(input)).toEqual({ error }));

  it('lit les sélecteurs DKIM saisis, sans doublon ni suffixe', () => {
    expect(parseSelectors('Google, selector1._domainkey.example.com; google  s2')).toEqual(['google', 'selector1', 's2']);
    expect(parseSelectors('')).toEqual([]);
  });

  it('trouve le domaine d\'organisation, y compris pour les suffixes à deux niveaux', () => {
    expect(orgDomain('mail.shop.example.com')).toBe('example.com');
    expect(orgDomain('www.example.co.uk')).toBe('example.co.uk');
    expect(orgDomain('example.fr')).toBe('example.fr');
  });
});

describe('adresses IP', () => {
  it('valide IPv4 et IPv6', () => {
    expect(isIPv4('1.2.3.4')).toBe(true);
    expect(isIPv4('256.1.1.1')).toBe(false);
    expect(isIPv4('01.2.3.4')).toBe(false);
    expect(isIPv6('2001:db8::1')).toBe(true);
    expect(isIPv6('::ffff:1.2.3.4')).toBe(true);
    expect(isIPv6('12345::')).toBe(false);
    expect(isIPv6('not-an-ip')).toBe(false);
  });

  it('reconnaît les adresses non routables', () => {
    for (const ip of ['10.1.2.3', '172.20.0.1', '192.168.1.1', '127.0.0.1', '169.254.1.1', '100.64.0.1']) expect(isPrivateIPv4(ip), ip).toBe(true);
    for (const ip of ['8.8.8.8', '172.32.0.1', '93.184.216.34']) expect(isPrivateIPv4(ip), ip).toBe(false);
    expect(isPrivateIPv6('fd00::1')).toBe(true);
    expect(isPrivateIPv6('2606:4700::1111')).toBe(false);
  });
});

describe('formats DNS', () => {
  it('assemble les chaînes d\'un TXT', () => {
    expect(parseTxtData('"v=spf1 " "include:a.com -all"').text).toBe('v=spf1 include:a.com -all');
    expect(parseTxtData('"a\\"b"').text).toBe('a"b');
    expect(parseTxtData('sans guillemets').text).toBe('sans guillemets');
    expect(parseTxtData('"x" "y"').parts).toEqual(['x', 'y']);
  });

  it('lit un MX, un SOA et un CAA', () => {
    expect(parseMx('10 mx.example.com.')).toEqual({ priority: 10, host: 'mx.example.com' });
    expect(parseMx('0 .')).toEqual({ priority: 0, host: '.' });
    expect(parseMx('nimportequoi')).toBeNull();
    expect(parseSoa('ns1. host. 5 7200 3600 1209600 3600')).toMatchObject({ serial: 5, refresh: 7200, expire: 1209600, minimum: 3600 });
    expect(parseCaa('0 issue "letsencrypt.org"')).toEqual({ flags: 0, tag: 'issue', value: 'letsencrypt.org' });
    // forme générique renvoyée par certains résolveurs : 0 issue "a.b"
    expect(parseCaa('\\# 12 000569737375656162')).toMatchObject({ tag: 'issue', value: 'ab' });
  });

  it('classe les TXT', () => {
    expect(classifyTxt('v=spf1 -all').kind).toBe('spf');
    expect(classifyTxt('v=DMARC1; p=none').kind).toBe('dmarc');
    expect(classifyTxt('v=DKIM1; p=abc').kind).toBe('dkim');
    expect(classifyTxt('google-site-verification=x')).toEqual({ kind: 'verification', vendor: 'Google' });
    expect(classifyTxt('autre chose').kind).toBe('other');
  });
});

describe('SPF : syntaxe', () => {
  it('accepte un enregistrement correct', () => {
    const { findings } = parseSpf('v=spf1 ip4:192.0.2.0/24 ip6:2001:db8::/32 a mx:mail.example.com include:_spf.google.com -all');
    expect(findings.filter((f) => f.severity === 'error')).toEqual([]);
    expect(has(findings, 'spf.hardfailAll', 'ok')).toBe(true);
  });

  it.each([
    ['v=spf1 +all', 'spf.plusAll', 'error'],
    ['v=spf1 all', 'spf.plusAll', 'error'],
    ['v=spf1 ?all', 'spf.neutralAll', 'warn'],
    ['v=spf1 ~all', 'spf.softfailAll', 'info'],
    ['v=spf1 mx', 'spf.noAll', 'warn'],
    ['v=spf1 ptr -all', 'spf.ptr', 'warn'],
    ['v=spf1 -all mx', 'spf.afterAll', 'warn'],
    ['v=spf1 redirect=a.example -all', 'spf.redirectIgnored', 'warn'],
    ['v=spf1 redirect=a.example redirect=b.example', 'spf.duplicateModifier', 'error'],
    ['v=spf1 foo:bar -all', 'spf.unknownTerm', 'error'],
    ['v=spf1 ip4:300.1.1.1 -all', 'spf.badIp', 'error'],
    ['v=spf1 ip4:1.2.3.4/33 -all', 'spf.badCidr', 'error'],
    ['v=spf1 include -all', 'spf.badSyntax', 'error'],
    ['v=spf1 include:bad domain.com -all', 'spf.unknownTerm', 'error'], // l'espace coupe le terme en deux
    ['v=spf1 ip4:0.0.0.0/0 -all', 'spf.allIp', 'error'],
    ['v=spf1 ip4:10.0.0.0/8 -all', 'spf.wideRange', 'warn'],
    ['v=spf1 ip4:192.0.2.7/24 -all', 'spf.hostBits', 'info'],
    ['v=spf1 mx mx -all', 'spf.duplicateTerm', 'warn'],
    ['v=spf1 include:a.com include:A.com -all', 'spf.duplicateTerm', 'warn'],
    [`v=spf1 ${Array.from({ length: 40 }, (_, i) => `ip4:192.0.2.${i}`).join(' ')} -all`, 'spf.tooLong', 'warn'],
  ])('%s -> %s', (record, code, severity) => expect(has(parseSpf(record).findings, code, severity), JSON.stringify(parseSpf(record).findings)).toBe(true));

  it('analyse chaque terme', () => {
    expect(parseTerm('-a:mail.example.com/24//64')).toMatchObject({ qualifier: '-', mechanism: 'a', value: 'mail.example.com', cidr4: 24, cidr6: 64 });
    expect(parseTerm('exists:%{i}._spf.example.com').errors).toEqual([]);
    expect(parseTerm('redirect=_spf.example.com')).toMatchObject({ kind: 'modifier', name: 'redirect' });
    expect(parseTerm('a/33').errors[0].code).toBe('spf.badCidr');
  });
});

describe('SPF : analyse récursive', () => {
  const run = (zone, texts) => analyzeSpf({ domain: 'example.com', texts, resolver: fakeResolver(zone) });

  it('compte les requêtes DNS des include imbriqués', async () => {
    const r = await run(
      { 'example.com': {}, 'a.test': { TXT: ['v=spf1 include:b.test -all'] }, 'b.test': { TXT: ['v=spf1 ip4:192.0.2.1 -all'] } },
      ['v=spf1 include:a.test mx -all'],
    );
    expect(r.lookups).toBe(3); // include a + include b + mx
    expect(r.tree.children[0].children[0].domain).toBe('b.test');
    expect(has(r.findings, 'spf.ok')).toBe(false); // mx sans MX publié : requête vide
  });

  it('détecte plus de 10 requêtes', async () => {
    const zone = { 'example.com': {} };
    const includes = Array.from({ length: 11 }, (_, i) => {
      zone[`i${i}.test`] = { TXT: ['v=spf1 -all'] };
      return `include:i${i}.test`;
    });
    const r = await run(zone, [`v=spf1 ${includes.join(' ')} -all`]);
    expect(r.lookups).toBe(11);
    expect(has(r.findings, 'spf.tooManyLookups', 'error')).toBe(true);
  });

  it('avertit près de la limite', async () => {
    const zone = { 'example.com': {} };
    const includes = Array.from({ length: 9 }, (_, i) => {
      zone[`i${i}.test`] = { TXT: ['v=spf1 -all'] };
      return `include:i${i}.test`;
    });
    const r = await run(zone, [`v=spf1 ${includes.join(' ')} -all`]);
    expect(has(r.findings, 'spf.nearLimit', 'warn')).toBe(true);
  });

  it('détecte une boucle', async () => {
    const r = await run({ 'example.com': {}, 'a.test': { TXT: ['v=spf1 include:b.test -all'] }, 'b.test': { TXT: ['v=spf1 include:a.test -all'] } }, ['v=spf1 include:a.test -all']);
    expect(has(r.findings, 'spf.loop', 'error')).toBe(true);
  });

  it('signale un include inexistant, sans SPF, ou avec plusieurs SPF', async () => {
    const r = await run(
      { 'example.com': {}, 'vide.test': { TXT: ['rien'] }, 'double.test': { TXT: ['v=spf1 -all', 'v=spf1 +all'] } },
      ['v=spf1 include:absent.test include:vide.test include:double.test -all'],
    );
    expect(has(r.findings, 'spf.includeNxdomain', 'error')).toBe(true);
    expect(has(r.findings, 'spf.includeNoRecord', 'error')).toBe(true);
    expect(has(r.findings, 'spf.includeMultiple', 'error')).toBe(true);
  });

  it('signale plusieurs SPF à la racine et l\'absence de SPF', async () => {
    expect(has((await run({ 'example.com': {} }, ['v=spf1 -all', 'v=spf1 mx -all'])).findings, 'spf.multiple', 'error')).toBe(true);
    expect(has((await run({ 'example.com': {} }, ['autre'])).findings, 'spf.missing')).toBe(true);
  });

  it('repère un include présent deux fois et deux plages qui se recouvrent', async () => {
    const r = await run(
      { 'example.com': {}, 'a.test': { TXT: ['v=spf1 include:c.test -all'] }, 'b.test': { TXT: ['v=spf1 include:c.test -all'] }, 'c.test': { TXT: ['v=spf1 -all'] } },
      ['v=spf1 include:a.test include:b.test ip4:192.0.2.0/24 ip4:192.0.2.10 -all'],
    );
    expect(has(r.findings, 'spf.duplicateInclude', 'warn')).toBe(true);
    expect(has(r.findings, 'spf.overlap', 'info')).toBe(true);
  });

  it('compte les requêtes « vides » (void lookups)', async () => {
    const r = await run({ 'example.com': {}, 'x.test': {} }, ['v=spf1 a:x.test a:y.test mx:z.test -all']);
    expect(r.voids).toBeGreaterThan(2);
    expect(has(r.findings, 'spf.tooManyVoids', 'warn')).toBe(true);
  });

  it('ignore la qualification du « all » des include (sans effet) mais pas +all', async () => {
    const r = await run({ 'example.com': {}, 'a.test': { TXT: ['v=spf1 ip4:192.0.2.1 ~all'] }, 'b.test': { TXT: ['v=spf1 +all'] } }, ['v=spf1 include:a.test include:b.test -all']);
    expect(r.findings.filter((f) => f.code === 'spf.softfailAll')).toEqual([]);
    expect(has(r.findings, 'spf.plusAll', 'error')).toBe(true);
    expect(has(r.findings, 'spf.hardfailAll', 'ok')).toBe(true);
  });

  it('rétrograde en information les défauts de style d\'un include tiers, pas ceux de la racine', async () => {
    const r = await run({ 'example.com': {}, 'fournisseur.test': { TXT: ['v=spf1 ptr ip4:10.0.0.0/8 -all'] } }, ['v=spf1 include:fournisseur.test ptr -all']);
    const ptr = r.findings.filter((f) => f.code === 'spf.ptr');
    expect(ptr.find((f) => f.params.domain === 'fournisseur.test').severity).toBe('info');
    expect(ptr.find((f) => f.params.domain === 'example.com').severity).toBe('warn');
    expect(r.findings.find((f) => f.code === 'spf.wideRange').severity).toBe('info');
  });

  it('reconnaît le fournisseur d\'après les include', async () => {
    const r = await run({ 'example.com': {}, '_spf.google.com': { TXT: ['v=spf1 ip4:192.0.2.1 -all'] } }, ['v=spf1 include:_spf.google.com ~all']);
    expect(r.findings.find((f) => f.code === 'spf.provider').params.names).toContain('Google Workspace');
  });

  it('s\'arrête proprement au-delà du budget de requêtes', async () => {
    const zone = { 'example.com': {} };
    const includes = Array.from({ length: 6 }, (_, i) => {
      zone[`i${i}.test`] = { TXT: ['v=spf1 -all'] };
      return `include:i${i}.test`;
    });
    const r = await analyzeSpf({ domain: 'example.com', texts: [`v=spf1 ${includes.join(' ')} -all`], resolver: fakeResolver(zone), maxQueries: 3 });
    expect(r.partial).toBe(true);
    expect(has(r.findings, 'spf.partial', 'info')).toBe(true);
  });
});

describe('DKIM', () => {
  it('lit la taille des clés RSA (SPKI)', () => {
    expect(rsaKeyBits(Buffer.from(rsaPublicKey(2048), 'base64'))).toBe(2048);
    expect(rsaKeyBits(Buffer.from(rsaPublicKey(1024), 'base64'))).toBe(1024);
  });

  it.each([
    [2048, 'dkim.goodKey', 'ok'],
    [1024, 'dkim.shortKey', 'warn'],
    [512, 'dkim.weakKey', 'error'],
  ])('clé RSA %i bits -> %s', (bits, code, severity) => {
    const { findings, key } = analyzeDkimRecord(`v=DKIM1; k=rsa; p=${rsaPublicKey(bits)}`);
    expect(key.bits).toBe(bits);
    expect(has(findings, code, severity)).toBe(true);
  });

  it('tolère les espaces dans p et l\'absence de v', () => {
    const p = rsaPublicKey(2048);
    const spaced = `${p.slice(0, 40)} ${p.slice(40)}`;
    expect(has(analyzeDkimRecord(`p=${spaced}`).findings, 'dkim.goodKey')).toBe(true);
  });

  it('gère Ed25519, la révocation, la troncature et les drapeaux', () => {
    expect(has(analyzeDkimRecord(`v=DKIM1; k=ed25519; p=${Buffer.alloc(32, 7).toString('base64')}`).findings, 'dkim.goodKey', 'ok')).toBe(true);
    expect(has(analyzeDkimRecord('v=DKIM1; k=ed25519; p=AAAA').findings, 'dkim.keyCorrupt', 'error')).toBe(true);
    expect(has(analyzeDkimRecord('v=DKIM1; p=').findings, 'dkim.revoked', 'warn')).toBe(true);
    expect(has(analyzeDkimRecord(`v=DKIM1; p=${rsaPublicKey(2048).slice(0, 100)}`).findings, 'dkim.keyCorrupt', 'error')).toBe(true);
    expect(has(analyzeDkimRecord('v=DKIM1; k=rsa').findings, 'dkim.pMissing', 'error')).toBe(true);
    expect(has(analyzeDkimRecord('v=DKIM1; k=dsa; p=AAAA').findings, 'dkim.keyType', 'error')).toBe(true);
    const flags = analyzeDkimRecord(`v=DKIM1; t=y:s; h=sha1; s=other; p=${rsaPublicKey(2048)}`).findings;
    for (const code of ['dkim.testing', 'dkim.strict', 'dkim.sha1', 'dkim.service']) expect(has(flags, code), code).toBe(true);
    expect(has(analyzeDkimRecord(`v=DKIM2; p=${rsaPublicKey(2048)}`).findings, 'dkim.badVersion', 'error')).toBe(true);
    expect(has(analyzeDkimRecord(`k=rsa; v=DKIM1; p=${rsaPublicKey(2048)}`).findings, 'dkim.versionNotFirst', 'warn')).toBe(true);
  });

  const key = rsaPublicKey(2048);
  const run = (zone, selectors, explicit) => analyzeDkim({ domain: 'example.com', selectors, explicit, resolver: fakeResolver({ 'example.com': {}, ...zone }) });

  it('trouve un sélecteur nommé et signale celui qui manque', async () => {
    const r = await run({ 'sel._domainkey.example.com': { TXT: [`v=DKIM1; p=${key}`] } }, [{ selector: 'sel' }, { selector: 'absent' }], true);
    expect(r.found.map((x) => x.selector)).toEqual(['sel']);
    expect(has(r.findings, 'dkim.selectorMissing', 'error')).toBe(true);
  });

  it('suit un CNAME (Microsoft 365) et le signale', async () => {
    const r = await run(
      { 'selector1._domainkey.example.com': { CNAME: ['selector1-example-com._domainkey.tenant.onmicrosoft.com'] }, 'selector1-example-com._domainkey.tenant.onmicrosoft.com': { TXT: [`v=DKIM1; p=${key}`] } },
      [{ selector: 'selector1', provider: 'Microsoft 365' }],
      false,
    );
    expect(r.found[0].cname).toBe('selector1-example-com._domainkey.tenant.onmicrosoft.com');
    expect(has(r.findings, 'dkim.cname', 'info')).toBe(true);
  });

  it('détecte deux enregistrements au même sélecteur et deux sélecteurs à la même clé', async () => {
    const r = await run(
      { 'a._domainkey.example.com': { TXT: [`v=DKIM1; p=${key}`, `v=DKIM1; p=${rsaPublicKey(1024)}`] }, 'b._domainkey.example.com': { TXT: [`v=DKIM1; p=${key}`] } },
      [{ selector: 'a' }, { selector: 'b' }],
      false,
    );
    expect(has(r.findings, 'dkim.multipleAtSelector', 'error')).toBe(true);
    expect(has(r.findings, 'dkim.sameKey', 'info')).toBe(true);
  });

  it('avertit si aucun sélecteur deviné n\'existe', async () => {
    const r = await run({}, [{ selector: 'default' }, { selector: 'dkim' }], false);
    expect(has(r.findings, 'dkim.none', 'warn')).toBe(true);
  });
});

describe('sélecteurs devinés d\'après le fournisseur', () => {
  it('propose les sélecteurs de Google, Microsoft 365 et OVH avant les noms courants', () => {
    const google = guessSelectors(detectProviders({ mxHosts: ['aspmx.l.google.com.', 'alt1.aspmx.l.google.com.'] }));
    expect(google[0]).toEqual({ selector: 'google', provider: 'Google Workspace' });

    const microsoft = guessSelectors(detectProviders({ mxHosts: ['example-com.mail.protection.outlook.com'] }));
    expect(microsoft.slice(0, 2).map((s) => s.selector)).toEqual(['selector1', 'selector2']);

    const ovh = guessSelectors(detectProviders({ mxHosts: ['mx1.mail.ovh.net'] }));
    expect(ovh.slice(0, 2).map((s) => s.selector)).toEqual(['ovhmo-selector-1', 'ovhmo-selector-2']);
    expect(ovh.some((s) => s.selector === 'default' && s.provider === null)).toBe(true);
  });

  it('reconnaît aussi le fournisseur d\'après le SPF, sans doublon de sélecteur', () => {
    const list = guessSelectors(detectProviders({ spfIncludes: ['spf.protection.outlook.com', '_spf.google.com'] }));
    const names = list.map((s) => s.selector);
    expect(names).toContain('google');
    expect(new Set(names).size).toBe(names.length);
  });

  it('retombe sur les noms courants sans fournisseur reconnu', () => {
    const list = guessSelectors(detectProviders({ mxHosts: ['mail.inconnu.test'] }));
    expect(list.map((s) => s.selector)).toContain('default');
    expect(list.every((s) => s.provider === null)).toBe(true);
  });
});

describe('DMARC', () => {
  const issues = (record) => analyzeDmarcRecord(record).findings;

  it('accepte une politique reject complète', () => {
    const f = issues('v=DMARC1; p=reject; rua=mailto:a@example.com; adkim=r; aspf=r; pct=100');
    expect(f.filter((x) => x.severity === 'error' || x.severity === 'warn')).toEqual([]);
    expect(has(f, 'dmarc.policyReject', 'ok')).toBe(true);
  });

  it.each([
    ['v=DMARC1; p=none; rua=mailto:a@example.com', 'dmarc.policyNone', 'warn'],
    ['v=DMARC1; p=quarantine', 'dmarc.policyQuarantine', 'info'],
    ['v=DMARC1; p=maybe', 'dmarc.pInvalid', 'error'],
    ['v=DMARC1; rua=mailto:a@example.com', 'dmarc.pMissing', 'warn'],
    ['v=DMARC1', 'dmarc.pMissing', 'error'],
    ['p=reject; v=DMARC1', 'dmarc.versionFirst', 'error'],
    ['v=DMARC1; p=reject; p=none', 'dmarc.duplicateTag', 'error'],
    ['v=DMARC1; p=reject; pct=150', 'dmarc.pctInvalid', 'error'],
    ['v=DMARC1; p=reject; pct=50', 'dmarc.pctPartial', 'warn'],
    ['v=DMARC1; p=reject; sp=none', 'dmarc.spWeaker', 'warn'],
    ['v=DMARC1; p=reject; sp=oups', 'dmarc.spInvalid', 'error'],
    ['v=DMARC1; p=reject; adkim=x', 'dmarc.adkimInvalid', 'error'],
    ['v=DMARC1; p=reject; aspf=z', 'dmarc.aspfInvalid', 'error'],
    ['v=DMARC1; p=reject; aspf=s', 'dmarc.strictAlignment', 'info'],
    ['v=DMARC1; p=reject; fo=2', 'dmarc.foInvalid', 'error'],
    ['v=DMARC1; p=reject; ri=0', 'dmarc.riInvalid', 'error'],
    ['v=DMARC1; p=reject; rf=json', 'dmarc.rfInvalid', 'error'],
    ['v=DMARC1; p=reject; rua=a@example.com', 'dmarc.uriInvalid', 'error'],
    ['v=DMARC1; p=reject; rua=mailto:a@example.com,mailto:A@example.com', 'dmarc.duplicateUri', 'warn'],
    ['v=DMARC1; p=reject; bidule=1', 'dmarc.unknownTag', 'info'],
    ['v=DMARC1; p=reject; ruf=mailto:a@example.com', 'dmarc.rufPrivacy', 'info'],
    ['v=DMARC1; p=reject', 'dmarc.noRua', 'info'],
    ['v=DMARC1; p=reject; nimportequoi', 'dmarc.syntax', 'error'],
  ])('%s -> %s', (record, code, severity) => expect(has(issues(record), code, severity), JSON.stringify(issues(record))).toBe(true));

  it('lit les balises et les adresses de rapport', () => {
    expect(parseDmarcTags('v=DMARC1;p=none ; rua=mailto:x@y.fr;').order).toEqual(['v', 'p', 'rua']);
    expect(parseReportUris('mailto:a@b.fr!10m, mailto:c@d.fr')).toMatchObject([{ address: 'a@b.fr', valid: true, domain: 'b.fr' }, { address: 'c@d.fr', valid: true }]);
    expect(parseReportUris('https://x.y')[0].valid).toBe(false);
  });

  const check = async (zone, domain = 'example.com') => {
    const resolver = fakeResolver(zone);
    return analyzeDmarc({ domain, first: await resolver.query(`_dmarc.${domain}`, 'TXT'), resolver });
  };

  it('signale un DMARC absent', async () => {
    const r = await check({ 'example.com': {} });
    expect(r.found).toBe(false);
    expect(has(r.findings, 'dmarc.missing', 'error')).toBe(true);
  });

  it('signale plusieurs enregistrements DMARC', async () => {
    const r = await check({ 'example.com': {}, '_dmarc.example.com': { TXT: ['v=DMARC1; p=none', 'v=DMARC1; p=reject'] } });
    expect(has(r.findings, 'dmarc.multiple', 'error')).toBe(true);
  });

  it('hérite de la politique du domaine d\'organisation pour un sous-domaine', async () => {
    const r = await check({ 'mail.example.com': {}, 'example.com': {}, '_dmarc.example.com': { TXT: ['v=DMARC1; p=reject; rua=mailto:a@example.com'] } }, 'mail.example.com');
    expect(r.inherited).toBe(true);
    expect(has(r.findings, 'dmarc.inherited', 'info')).toBe(true);
  });

  it('vérifie l\'autorisation des rapports envoyés à un autre domaine', async () => {
    const zone = {
      'example.com': {},
      '_dmarc.example.com': { TXT: ['v=DMARC1; p=reject; rua=mailto:ok@tiers.test,mailto:ko@autre.test'] },
      'example.com._report._dmarc.tiers.test': { TXT: ['v=DMARC1'] },
      'autre.test': {},
    };
    const r = await check(zone);
    expect(has(r.findings, 'dmarc.externalOk', 'ok')).toBe(true);
    expect(r.findings.find((f) => f.code === 'dmarc.externalNotAuthorized').params.domain).toBe('autre.test');
  });
});

describe('MX', () => {
  const run = (zone, mx) => analyzeMx({ domain: 'example.com', mxAnswers: mx.map((data) => ({ data, ttl: 300 })), resolver: fakeResolver(zone) });

  it('accepte deux MX corrects et reconnaît le fournisseur', async () => {
    const r = await run({ 'aspmx.l.google.com': { A: ['93.184.216.40'] }, 'alt1.aspmx.l.google.com': { A: ['93.184.216.41'] } }, ['1 aspmx.l.google.com.', '5 alt1.aspmx.l.google.com.']);
    expect(has(r.findings, 'mx.ok', 'ok')).toBe(true);
    expect(r.providers.map((p) => p.name)).toEqual(['Google Workspace']);
  });

  it('signale l\'absence de MX et le MX nul', async () => {
    expect(has((await run({}, [])).findings, 'mx.none', 'warn')).toBe(true);
    expect(has((await run({}, ['0 .'])).findings, 'mx.null', 'info')).toBe(true);
    expect(has((await run({ 'mx.test': { A: ['93.184.216.40'] } }, ['0 .', '10 mx.test.'])).findings, 'mx.nullMixed', 'error')).toBe(true);
  });

  it('signale un MX alias, introuvable, vers une IP ou une adresse privée', async () => {
    const zone = { 'alias.test': { CNAME: ['reel.test'] }, 'reel.test': { A: ['93.184.216.40'] }, 'prive.test': { A: ['192.168.1.10'] } };
    const f = (await run(zone, ['10 alias.test.', '20 absent.test.', '30 1.2.3.4', '40 prive.test.'])).findings;
    expect(has(f, 'mx.cname', 'error')).toBe(true);
    expect(has(f, 'mx.unresolved', 'error')).toBe(true);
    expect(has(f, 'mx.ip', 'error')).toBe(true);
    expect(has(f, 'mx.private', 'error')).toBe(true);
  });

  it('signale un MX unique, un doublon et des priorités égales', async () => {
    const zone = { 'mx.test': { A: ['93.184.216.40'] }, 'mx2.test': { A: ['93.184.216.41'] } };
    expect(has((await run(zone, ['10 mx.test.'])).findings, 'mx.single', 'info')).toBe(true);
    const dup = (await run(zone, ['10 mx.test.', '20 mx.test.'])).findings;
    expect(has(dup, 'mx.duplicateHost', 'warn')).toBe(true);
    expect(has((await run(zone, ['10 mx.test.', '10 mx2.test.'])).findings, 'mx.samePriority', 'info')).toBe(true);
  });
});

describe('analyse complète', () => {
  it('un domaine en bonne santé n\'a aucune erreur ni alerte', async () => {
    const zone = {
      ...healthyZone(),
      'default._domainkey.example.com': { TXT: [`v=DKIM1; k=rsa; p=${rsaPublicKey(2048)}`] }, // sélecteur courant, deviné
    };
    const report = await analyzeDomain({ domain: 'example.com', resolver: fakeResolver(zone, { ad: true }) });
    const bad = report.findings.filter((f) => f.severity === 'error' || f.severity === 'warn');
    expect(bad, JSON.stringify(bad)).toEqual([]);
    expect(report.counts.error).toBe(0);
    expect(report.checks.map((c) => c.id)).toEqual(['addresses', 'mx', 'spf', 'dkim', 'dmarc', 'txt', 'ns', 'soa', 'caa', 'dnssec', 'mtasts', 'tlsrpt', 'bimi']);
  });

  it('devine le sélecteur d\'un domaine Google Workspace', async () => {
    const zone = healthyZone();
    zone['example.com'].MX = ['1 aspmx.l.google.com.', '5 alt1.aspmx.l.google.com.'];
    zone['aspmx.l.google.com'] = { A: ['93.184.216.40'] };
    zone['alt1.aspmx.l.google.com'] = { A: ['93.184.216.41'] };
    zone['google._domainkey.example.com'] = { TXT: [`v=DKIM1; p=${rsaPublicKey(2048)}`] };
    const resolver = fakeResolver(zone);
    const report = await analyzeDomain({ domain: 'example.com', resolver });
    expect(report.providers).toEqual(['Google Workspace']);
    expect(report.checks.find((c) => c.id === 'dkim').data.found.map((r) => r.selector)).toEqual(['google']);
    expect(resolver.log[0]).toMatch(/example\.com/); // les requêtes indépendantes partent ensemble
  });

  it('ne teste que les sélecteurs nommés quand l\'utilisateur en donne', async () => {
    const resolver = fakeResolver(healthyZone());
    await analyzeDomain({ domain: 'example.com', selectors: ['unique'], resolver });
    const dkimQueries = resolver.log.filter((l) => l.includes('._domainkey.'));
    expect(dkimQueries).toEqual(['unique._domainkey.example.com TXT']);
  });

  it('regroupe les doublons (SPF, DMARC, TXT, MX) dans le rapport', async () => {
    const zone = healthyZone();
    zone['example.com'].TXT = ['v=spf1 -all', 'v=spf1 mx -all', 'dupli', 'dupli'];
    zone['example.com'].MX = ['10 mx1.mailhost.test.', '20 mx1.mailhost.test.'];
    zone['_dmarc.example.com'] = { TXT: ['v=DMARC1; p=none', 'v=DMARC1; p=reject'] };
    const report = await analyzeDomain({ domain: 'example.com', resolver: fakeResolver(zone) });
    const dup = report.duplicates.map((f) => f.code);
    for (const code of ['spf.multiple', 'txt.duplicate', 'mx.duplicateHost', 'dmarc.multiple']) expect(dup, code).toContain(code);
  });

  it('traite un domaine inexistant', async () => {
    const report = await analyzeDomain({ domain: 'absent.test', resolver: fakeResolver({}) });
    expect(report.exists).toBe(false);
    expect(codes(report.findings)).toEqual(['domain.nxdomain']);
  });

  it('considère l\'absence de SPF comme un simple conseil si le domaine n\'a pas de messagerie', async () => {
    const zone = { 'example.com': { A: ['93.184.216.34'], NS: ['ns1.example.net.'] }, '_dmarc.example.com': {} };
    const report = await analyzeDomain({ domain: 'example.com', resolver: fakeResolver(zone) });
    const spf = report.checks.find((c) => c.id === 'spf');
    expect(spf.findings.find((f) => f.code === 'spf.missingNoMail').severity).toBe('info');
  });

  it('signale DNSSEC non validé, TXT mal placés et BIMI sans DMARC appliqué', async () => {
    const zone = healthyZone();
    zone['example.com'].TXT.push('v=DMARC1; p=none', 'v=DKIM1; p=AAAA');
    zone['default._bimi.example.com'] = { TXT: ['v=BIMI1; l=https://example.com/logo.svg'] };
    zone['_dmarc.example.com'] = { TXT: ['v=DMARC1; p=none'] };
    const report = await analyzeDomain({ domain: 'example.com', resolver: fakeResolver(zone, { ad: false }) });
    const all = codes(report.findings);
    for (const code of ['dnssec.notValidated', 'txt.dmarcAtApex', 'txt.dkimAtApex', 'bimi.needsDmarc']) expect(all, code).toContain(code);
  });
});
