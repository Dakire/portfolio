import { describe, expect, it } from 'vitest';
import {
  checkPropagation,
  formatValue,
  matchesExpected,
  normalizeExpected,
  PROPAGATION_RESOLVERS,
  queryResolver,
  summarize,
} from '../src/dns/propagation.js';
import { buildResponse } from './helpers/dns-wire.js';

const JSON_RESOLVER = PROPAGATION_RESOLVERS.find((r) => r.format === 'json');
const WIRE_RESOLVER = PROPAGATION_RESOLVERS.find((r) => r.format === 'wire');

const json = (body, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/dns-json' },
    }),
  );
const wire = (bytes, status = 200) => Promise.resolve(new Response(bytes, { status }));

describe('formatValue', () => {
  it('rend les valeurs comparables', () => {
    expect(formatValue('A', '93.184.216.34')).toBe('93.184.216.34');
    expect(formatValue('AAAA', '2606:4700::ABCD')).toBe('2606:4700::abcd');
    expect(formatValue('CNAME', 'Cible.Exemple.fr.')).toBe('cible.exemple.fr');
    expect(formatValue('MX', '10 MX.Exemple.fr.')).toBe('10 mx.exemple.fr');
    expect(formatValue('TXT', '"v=spf1 " "-all"')).toBe('v=spf1 -all');
    expect(
      formatValue(
        'SOA',
        'ns1.exemple.fr. hostmaster.exemple.fr. 2024010101 7200 3600 1209600 3600',
      ),
    ).toBe('ns1.exemple.fr hostmaster.exemple.fr 2024010101 7200 3600 1209600 3600');
  });
});

describe('queryResolver', () => {
  it("lit la réponse JSON : valeurs triées, sans doublon, TTL minimal, enregistrements d'un autre type ignorés", async () => {
    const fetchImpl = () =>
      json({
        Status: 0,
        Answer: [
          { name: 'www.exemple.fr.', type: 5, TTL: 60, data: 'exemple.fr.' }, // alias suivi : pas une valeur « A »
          { name: 'exemple.fr.', type: 1, TTL: 300, data: '192.0.2.2' },
          { name: 'exemple.fr.', type: 1, TTL: 120, data: '192.0.2.1' },
          { name: 'exemple.fr.', type: 1, TTL: 300, data: '192.0.2.1' },
        ],
      });
    expect(await queryResolver(JSON_RESOLVER, 'www.exemple.fr', 'A', { fetchImpl })).toMatchObject({
      id: JSON_RESOLVER.id,
      state: 'answer',
      values: ['192.0.2.1', '192.0.2.2'],
      ttl: 120,
    });
  });

  it('envoie la requête attendue selon le format du résolveur', async () => {
    const urls = [];
    const fetchImpl = (url) => {
      urls.push(String(url));
      return url.includes('dns=')
        ? wire(buildResponse({ name: 'exemple.fr', type: 'A', answers: ['192.0.2.1'] }))
        : json({ Status: 0, Answer: [] });
    };
    await queryResolver(JSON_RESOLVER, 'exemple.fr', 'MX', { fetchImpl });
    await queryResolver(WIRE_RESOLVER, 'exemple.fr', 'A', { fetchImpl });
    expect(urls[0]).toBe(`${JSON_RESOLVER.url}?name=exemple.fr&type=15`);
    expect(urls[1]).toBe(`${WIRE_RESOLVER.url}?dns=AAABAAABAAAAAAAAB2V4ZW1wbGUCZnIAAAEAAQ`);
  });

  it('lit la réponse binaire', async () => {
    const fetchImpl = () =>
      wire(
        buildResponse({
          name: 'exemple.fr',
          type: 'MX',
          answers: ['5 mx2.exemple.fr', '10 mx1.exemple.fr'],
          ttl: 42,
        }),
      );
    expect(await queryResolver(WIRE_RESOLVER, 'exemple.fr', 'MX', { fetchImpl })).toMatchObject({
      state: 'answer',
      values: ['10 mx1.exemple.fr', '5 mx2.exemple.fr'],
      ttl: 42,
    });
  });

  it('distingue « aucun enregistrement », domaine inexistant, SERVFAIL et refus', async () => {
    const answer = (status) => () => json({ Status: status });
    expect(
      (await queryResolver(JSON_RESOLVER, 'exemple.fr', 'TXT', { fetchImpl: answer(0) })).state,
    ).toBe('empty');
    expect(
      (await queryResolver(JSON_RESOLVER, 'exemple.fr', 'TXT', { fetchImpl: answer(3) })).state,
    ).toBe('nxdomain');
    expect(
      (await queryResolver(JSON_RESOLVER, 'exemple.fr', 'TXT', { fetchImpl: answer(2) })).state,
    ).toBe('servfail');
    expect(
      (await queryResolver(JSON_RESOLVER, 'exemple.fr', 'TXT', { fetchImpl: answer(5) })).state,
    ).toBe('refused');
    expect(
      (
        await queryResolver(WIRE_RESOLVER, 'exemple.fr', 'A', {
          fetchImpl: () => wire(buildResponse({ name: 'exemple.fr', type: 'A', rcode: 3 })),
        })
      ).state,
    ).toBe('nxdomain');
  });

  it('transforme une panne en état « error » au lieu de lever une exception', async () => {
    expect(
      (await queryResolver(JSON_RESOLVER, 'exemple.fr', 'A', { fetchImpl: () => json({}, 503) }))
        .state,
    ).toBe('error');
    expect(
      (
        await queryResolver(JSON_RESOLVER, 'exemple.fr', 'A', {
          fetchImpl: () => Promise.reject(new TypeError('Failed to fetch')),
        })
      ).state,
    ).toBe('error');
    expect(
      (
        await queryResolver(WIRE_RESOLVER, 'exemple.fr', 'A', {
          fetchImpl: () => wire(new Uint8Array(3)),
        })
      ).state,
    ).toBe('error'); // message binaire illisible
  });

  it("propage une annulation demandée par l'appelant", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImpl = (_url, { signal }) =>
      signal.aborted ? Promise.reject(signal.reason) : json({ Status: 0 });
    await expect(
      queryResolver(JSON_RESOLVER, 'exemple.fr', 'A', { fetchImpl, signal: controller.signal }),
    ).rejects.toBeDefined();
  });
});

describe('valeur attendue', () => {
  it('normalise la saisie selon le type', () => {
    expect(normalizeExpected('A', ' 192.0.2.1 ')).toBe('192.0.2.1');
    expect(normalizeExpected('CNAME', 'Cible.Exemple.fr.')).toBe('cible.exemple.fr');
    expect(normalizeExpected('TXT', '"v=spf1 -all"')).toBe('v=spf1 -all');
    expect(normalizeExpected('MX', 'MX.Exemple.fr.')).toBe('mx.exemple.fr');
    expect(normalizeExpected('MX', '10 MX.Exemple.fr.')).toBe('10 mx.exemple.fr');
    expect(normalizeExpected('A', '   ')).toBe('');
  });

  it('compare avec les valeurs reçues', () => {
    expect(matchesExpected('A', ['192.0.2.1', '192.0.2.2'], '192.0.2.2')).toBe(true);
    expect(matchesExpected('A', ['192.0.2.1'], '192.0.2.9')).toBe(false);
    expect(
      matchesExpected('TXT', ['v=spf1 include:_spf.google.com -all'], 'include:_spf.google.com'),
    ).toBe(true); // un TXT peut être cité en partie
    expect(matchesExpected('MX', ['10 mx.exemple.fr'], 'mx.exemple.fr')).toBe(true); // priorité facultative
    expect(matchesExpected('MX', ['10 mx.exemple.fr'], '20 mx.exemple.fr')).toBe(false);
    expect(matchesExpected('A', ['192.0.2.1'], '')).toBeNull();
  });
});

describe('summarize', () => {
  const three = PROPAGATION_RESOLVERS.slice(0, 3);
  const answer = (id, ...values) => ({ id, state: 'answer', values, ttl: 300, ms: 10 });

  it("est « en attente » tant que tous les résolveurs n'ont pas répondu", () => {
    const s = summarize(three, [answer(three[0].id, '192.0.2.1')], 'A');
    expect(s.verdict).toBe('pending');
    expect(s.counts).toMatchObject({ total: 3, pending: 2, usable: 1 });
    expect(s.rows[1].state).toBe('pending');
  });

  it('constate une réponse identique partout', () => {
    const s = summarize(
      three,
      three.map((r) => answer(r.id, '192.0.2.1')),
      'A',
    );
    expect(s.verdict).toBe('consistent');
    expect(s.counts).toMatchObject({ agree: 3, groups: 1 });
  });

  it('signale des réponses différentes et repère la minorité', () => {
    const s = summarize(
      three,
      [
        answer(three[0].id, '192.0.2.1'),
        answer(three[1].id, '192.0.2.1'),
        answer(three[2].id, '192.0.2.9'),
      ],
      'A',
    );
    expect(s.verdict).toBe('diverging');
    expect(s.counts).toMatchObject({ agree: 2, groups: 2 });
    expect(s.rows.map((r) => r.inMajority)).toEqual([true, true, false]);
  });

  it('suit la propagation vers la valeur attendue', () => {
    const results = (values) => three.map((r, i) => answer(r.id, values[i]));
    expect(
      summarize(three, results(['1.1.1.1', '1.1.1.1', '1.1.1.1']), 'A', '1.1.1.1').verdict,
    ).toBe('propagated');
    const partial = summarize(three, results(['1.1.1.1', '2.2.2.2', '1.1.1.1']), 'A', '1.1.1.1');
    expect(partial.verdict).toBe('partial');
    expect(partial.counts.matches).toBe(2);
    expect(partial.rows.map((r) => r.match)).toEqual([true, false, true]);
    expect(
      summarize(three, results(['2.2.2.2', '2.2.2.2', '2.2.2.2']), 'A', '1.1.1.1').verdict,
    ).toBe('none');
  });

  it('ignore les résolveurs en panne dans le verdict, mais les compte', () => {
    const s = summarize(
      three,
      [
        answer(three[0].id, '1.1.1.1'),
        answer(three[1].id, '1.1.1.1'),
        { id: three[2].id, state: 'error', values: [], ttl: null, ms: 6000 },
      ],
      'A',
      '1.1.1.1',
    );
    expect(s.verdict).toBe('propagated');
    expect(s.counts).toMatchObject({ failed: 1, usable: 2 });
    expect(s.rows[2].match).toBeNull();
  });

  it('est « injoignable » quand aucun résolveur ne répond', () => {
    const s = summarize(
      three,
      three.map((r) => ({ id: r.id, state: 'error', values: [], ttl: null, ms: 1 })),
      'A',
    );
    expect(s.verdict).toBe('unreachable');
  });

  it('groupe aussi les réponses vides ou NXDOMAIN', () => {
    const s = summarize(
      three,
      [
        answer(three[0].id, '1.1.1.1'),
        { id: three[1].id, state: 'nxdomain', values: [], ttl: null, ms: 1 },
        { id: three[2].id, state: 'nxdomain', values: [], ttl: null, ms: 1 },
      ],
      'A',
    );
    expect(s.verdict).toBe('diverging');
    expect(s.counts.agree).toBe(2);
  });
});

describe('checkPropagation', () => {
  it('interroge tous les résolveurs et signale chaque réponse au fur et à mesure', async () => {
    const seen = [];
    const fetchImpl = (url) =>
      url.includes('dns=')
        ? wire(buildResponse({ name: 'exemple.fr', type: 'A', answers: ['192.0.2.1'] }))
        : json({
            Status: 0,
            Answer: [{ name: 'exemple.fr.', type: 1, TTL: 60, data: '192.0.2.1' }],
          });
    const results = await checkPropagation({
      domain: 'exemple.fr',
      type: 'A',
      fetchImpl,
      onResult: (r) => seen.push(r.id),
    });
    expect(results.map((r) => r.id)).toEqual(PROPAGATION_RESOLVERS.map((r) => r.id));
    expect(seen.sort()).toEqual(PROPAGATION_RESOLVERS.map((r) => r.id).sort());
    expect(results.every((r) => r.state === 'answer' && r.values[0] === '192.0.2.1')).toBe(true);
  });

  it('chaque résolveur a un identifiant et une adresse https uniques', () => {
    expect(new Set(PROPAGATION_RESOLVERS.map((r) => r.id)).size).toBe(PROPAGATION_RESOLVERS.length);
    for (const r of PROPAGATION_RESOLVERS) expect(r.url.startsWith('https://')).toBe(true);
  });
});
