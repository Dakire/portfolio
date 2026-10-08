// Tests contre les VRAIS résolveurs DNS-over-HTTPS (réseau requis) : ils vérifient que les formats de réponse réels sont toujours
// ceux que le code attend. Non lancés par `npm test` ni par la CI (réseau, domaines tiers) : `npm run test:live`.
import { describe, expect, it } from 'vitest';
import { analyzeDomain } from '../../src/lib/dns/analyze.js';
import { createResolver, ENDPOINTS, exists, recordsOf, txtRecords } from '../../src/lib/dns/resolver.js';

describe.each(ENDPOINTS)('résolveur $name', (endpoint) => {
  const resolver = createResolver({ endpoints: [endpoint] });

  it('lit un TXT (format avec ou sans guillemets) et un MX nul', async () => {
    const txt = txtRecords(await resolver.query('example.com', 'TXT'));
    expect(txt.some((t) => /^v=spf1 /.test(t.text))).toBe(true);
    const mx = recordsOf(await resolver.query('example.com', 'MX'), 'MX');
    expect(mx.map((r) => r.data.trim())).toContain('0 .');
  });

  it('renvoie NXDOMAIN pour un domaine inexistant', async () => {
    const res = await resolver.query('ce-nom-n-existe-pas.invalid', 'A');
    expect(res.status).toBe(3);
    expect(exists(res)).toBe(false);
  });

  it('renvoie le drapeau AD pour un domaine signé (DNSSEC)', async () => {
    const res = await resolver.query('cloudflare.com', 'DS');
    expect(recordsOf(res, 'DS').length).toBeGreaterThan(0);
    expect(res.ad).toBe(true);
  });

  it('lit un CAA', async () => {
    const caa = recordsOf(await resolver.query('gmail.com', 'CAA'), 'CAA');
    expect(caa.length).toBeGreaterThan(0);
  });
});

describe('analyse complète sur des domaines réels', () => {
  it('reconnaît Google Workspace et un DMARC valide pour gmail.com', async () => {
    const report = await analyzeDomain({ domain: 'gmail.com', resolver: createResolver() });
    expect(report.exists).toBe(true);
    expect(report.providers).toContain('Google Workspace');
    expect(report.checks.find((c) => c.id === 'dmarc').data.found).toBe(true);
  });

  it('devine les sélecteurs DKIM d\'un domaine Microsoft 365 (microsoft.com)', async () => {
    const report = await analyzeDomain({ domain: 'microsoft.com', resolver: createResolver() });
    expect(report.providers).toContain('Microsoft 365');
    expect(report.checks.find((c) => c.id === 'dkim').data.found.map((s) => s.selector)).toEqual(expect.arrayContaining(['selector2']));
  });
});
