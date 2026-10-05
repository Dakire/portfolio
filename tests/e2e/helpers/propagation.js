// Faux résolveurs pour l'outil de propagation : les neuf services (JSON et binaire) répondent à partir d'une « zone » décrite en clair.
//   await stubResolvers(page, { 'example.fr': { A: ['192.0.2.1'] } }, { overrides: { quad9: { 'example.fr': { A: ['192.0.2.9'] } }, iij: 'down' } })
// `overrides` remplace la zone pour un résolveur ; la valeur 'down' le fait répondre par une erreur 503.
import { PROPAGATION_RESOLVERS } from '../../../src/lib/dns/propagation.js';
import { buildResponse } from '../../helpers/dns-wire.js';

const CODES = { A: 1, NS: 2, CNAME: 5, SOA: 6, MX: 15, TXT: 16, AAAA: 28, CAA: 257 };
const NAMES = Object.fromEntries(Object.entries(CODES).map(([k, v]) => [v, k]));

/** Nom et type demandés dans une requête binaire (paramètre `dns`, base64 URL). */
function parseWireQuery(encoded) {
  const bytes = Buffer.from(encoded, 'base64url');
  const labels = [];
  let offset = 12;
  while (bytes[offset] !== 0) {
    labels.push(bytes.subarray(offset + 1, offset + 1 + bytes[offset]).toString());
    offset += 1 + bytes[offset];
  }
  return { name: labels.join('.'), code: bytes.readUInt16BE(offset + 1) };
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, Record<string, string[]>>} zone
 * @param {{ overrides?: Record<string, object|'down'>, log?: string[] }} [options] `zone` mutable : modifier l'objet change les réponses suivantes
 */
export async function stubResolvers(page, zone, { overrides = {}, log = [] } = {}) {
  for (const resolver of PROPAGATION_RESOLVERS) {
    await page.route(`${resolver.url}*`, (route) => {
      const url = new URL(route.request().url());
      const { name, code } = resolver.format === 'wire' ? parseWireQuery(url.searchParams.get('dns')) : { name: url.searchParams.get('name'), code: Number(url.searchParams.get('type')) };
      const type = NAMES[code];
      log.push(`${resolver.id} ${name} ${type}`);
      const override = overrides[resolver.id];
      if (override === 'down') return route.fulfill({ status: 503, body: 'panne' });
      const records = (override ?? zone)[name.toLowerCase()];
      if (!records) {
        return resolver.format === 'wire'
          ? route.fulfill({ contentType: 'application/dns-message', body: buildResponse({ name, type, rcode: 3 }) })
          : route.fulfill({ contentType: 'application/dns-json', json: { Status: 3, Answer: [] } });
      }
      const values = records[type] ?? [];
      if (resolver.format === 'wire') return route.fulfill({ contentType: 'application/dns-message', body: buildResponse({ name, type, answers: values }) });
      return route.fulfill({
        contentType: 'application/dns-json',
        json: { Status: 0, Answer: values.map((data) => ({ name: `${name}.`, type: code, TTL: 300, data: type === 'TXT' ? `"${data}"` : data })) },
      });
    });
  }
  return log;
}
