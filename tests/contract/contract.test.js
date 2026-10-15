// Contrat public du site : chaque URL listée dans contract.json doit exister, avec le bon type de contenu.
// Sans CONTRACT_BASE_URL, vérifie le dossier CONTRACT_DIST (legacy/dist par défaut) : existence, JSON valide. Avec, vérifie un site en ligne (statut, Content-Type, JSON valide) :
//   CONTRACT_BASE_URL=https://grichard.eu pnpm test:contract
// La préproduction se vise avec CONTRACT_BASE_URL=https://grichard.eu/preprod (et CONTRACT_BASIC_AUTH si elle est protégée).
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const contract = JSON.parse(readFileSync(new URL('./contract.json', import.meta.url), 'utf-8'));
const base = process.env.CONTRACT_BASE_URL?.replace(/\/$/, '');

// Préproduction protégée par mot de passe : CONTRACT_BASIC_AUTH=utilisateur:mot-de-passe
const headers = process.env.CONTRACT_BASIC_AUTH
  ? { Authorization: `Basic ${Buffer.from(process.env.CONTRACT_BASIC_AUTH).toString('base64')}` }
  : {};

function distFile(path) {
  const file = (process.env.CONTRACT_DIST ?? 'legacy/dist') + decodeURIComponent(path);
  return path.endsWith('/') ? file + 'index.html' : file;
}

// Les URL apparues avec le nouveau site (« since": "web" ») n'existent pas dans l'ancien site (legacy/dist) : elles ne sont
// vérifiées que sur le nouveau build (CONTRACT_DIST) et en ligne.
const legacyDist = !base && !process.env.CONTRACT_DIST;
const entries = contract.entries.filter((entry) => !(legacyDist && entry.since === 'web'));
// Anciennes URL renommées : 301 vers la nouvelle (le site d'avant la refonte n'a pas ces URL).
const redirects = legacyDist ? [] : (contract.redirects ?? []);

// Sitemap : une liste d'URL (<urlset>) complète, jamais un index ni une page HTML (voir docs/seo.md).
function expectUrlset(xml) {
  expect(xml.startsWith('<?xml')).toBe(true);
  expect(xml).toMatch(/<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
  expect(xml).toMatch(/<loc>https:\/\/grichard\.eu\/<\/loc>/);
}

describe(base ? `contrat public en ligne (${base})` : 'contrat public (dist/)', () => {
  it.each(entries)('$path', async ({ path, type, kind }) => {
    if (!base) {
      expect(existsSync(distFile(path)), distFile(path)).toBe(true);
      if (kind === 'json')
        expect(() => JSON.parse(readFileSync(distFile(path), 'utf-8'))).not.toThrow();
      if (kind === 'sitemap') expectUrlset(readFileSync(distFile(path), 'utf-8'));
      return;
    }
    const res = await fetch(base + path, { redirect: 'manual', headers });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type') ?? '').toContain(type);
    if (kind === 'json') JSON.parse(await res.text());
    if (kind === 'sitemap') expectUrlset(await res.text());
  });

  // (Une suite sans test fait échouer vitest : sur le site d'avant la refonte, la liste est vide.)
  describe.runIf(redirects.length > 0)('anciennes URL renommées : 301 vers la nouvelle', () => {
    it.each(redirects)('$from -> $to', async ({ from, to }) => {
      if (base) {
        const res = await fetch(base + from, { redirect: 'manual', headers });
        expect(res.status).toBe(301);
        expect(new URL(res.headers.get('location') ?? '', base).pathname).toBe(to);
        return;
      }
      // Sur le build : une règle du .htaccess mène de l'ancienne URL à la nouvelle, et la nouvelle existe.
      const text = readFileSync(process.env.CONTRACT_DIST + '/.htaccess', 'utf-8');
      const rules = [
        ...text.matchAll(/RewriteRule \^(\S+?)\(\?:\/\(\.\*\)\)\?\$ (\S+)\$1 \[L,R=301\]/g),
      ].map((m) => ({ dir: '/' + m[1], target: m[2] }));
      const rule = rules.find((r) => from === r.dir || from.startsWith(r.dir + '/'));
      expect(rule, from).toBeDefined();
      expect(rule.target + from.slice(rule.dir.length).replace(/^\//, '')).toBe(to);
      expect(existsSync(distFile(to))).toBe(true);
    });
  });

  if (base) {
    it.each(contract.notFound)('%s renvoie un vrai 404', async (path) => {
      expect((await fetch(base + path, { headers })).status).toBe(404);
    });
  }
});
