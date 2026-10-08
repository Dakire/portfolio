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

describe(base ? `contrat public en ligne (${base})` : 'contrat public (dist/)', () => {
  it.each(contract.entries)('$path', async ({ path, type, kind }) => {
    if (!base) {
      expect(existsSync(distFile(path)), distFile(path)).toBe(true);
      if (kind === 'json')
        expect(() => JSON.parse(readFileSync(distFile(path), 'utf-8'))).not.toThrow();
      return;
    }
    const res = await fetch(base + path, { redirect: 'manual', headers });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type') ?? '').toContain(type);
    if (kind === 'json') JSON.parse(await res.text());
  });

  if (base) {
    it.each(contract.notFound)('%s renvoie un vrai 404', async (path) => {
      expect((await fetch(base + path, { headers })).status).toBe(404);
    });
  }
});
