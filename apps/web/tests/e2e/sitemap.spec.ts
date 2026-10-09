import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Turnstile et tools.php sont simulés : aucun test ne dépend du réseau.
const TURNSTILE_STUB = `window.turnstile = { render(el, o) { setTimeout(() => o.callback('jeton-test'), 0); return 'w1'; }, reset() {}, remove() {} };`;

const REPORT = {
  url: 'https://exemple.fr/',
  score: 64,
  summary: { critical: 1, important: 1, info: 1, passed: 2 },
  discovery: { method: 'robots', robotsFound: true, declared: ['https://exemple.fr/sitemap.xml'] },
  files: [
    {
      url: 'https://exemple.fr/sitemap.xml',
      status: 200,
      error: null,
      contentType: 'application/xml',
      bytes: 900,
      uncompressedBytes: 900,
      gzip: false,
      wellFormed: true,
      parseError: null,
      type: 'sitemapindex',
      count: 1,
      depth: 0,
    },
    {
      url: 'https://exemple.fr/pages.xml',
      status: 200,
      error: null,
      contentType: 'application/xml',
      bytes: 4096,
      uncompressedBytes: 4096,
      gzip: true,
      wellFormed: true,
      parseError: null,
      type: 'urlset',
      count: 42,
      depth: 1,
    },
  ],
  urls: { total: 42, unique: 41 },
  sample: [
    {
      url: 'https://exemple.fr/',
      status: 200,
      finalUrl: 'https://exemple.fr/',
      redirects: 0,
      noindex: false,
      canonical: null,
      canonicalMismatch: false,
      error: null,
    },
    {
      url: 'https://exemple.fr/ancienne/',
      status: 404,
      finalUrl: 'https://exemple.fr/ancienne/',
      redirects: 0,
      noindex: false,
      canonical: null,
      canonicalMismatch: false,
      error: null,
    },
  ],
  checks: [
    {
      id: 'sitemap_found',
      category: 'discovery',
      severity: 'critical',
      status: 'pass',
      data: { url: 'https://exemple.fr/sitemap.xml', status: 200 },
    },
    {
      id: 'robots_blocked',
      category: 'urls',
      severity: 'critical',
      status: 'fail',
      data: { count: 2, examples: ['https://exemple.fr/prive/a'] },
    },
    {
      id: 'loc_duplicates',
      category: 'urls',
      severity: 'important',
      status: 'warn',
      data: { count: 1, examples: ['https://exemple.fr/a'] },
    },
    {
      id: 'priority_changefreq',
      category: 'urls',
      severity: 'info',
      status: 'info',
      data: { priority: 42, changefreq: 42, priorityInvalid: 0 },
    },
    {
      id: 'xml_valid',
      category: 'files',
      severity: 'critical',
      status: 'pass',
      data: { invalid: [] },
    },
  ],
};

test('vérifie un sitemap : priorités, tableaux des fichiers et de l’échantillon, accessible', async ({
  page,
}) => {
  let sent: Record<string, unknown> = {};
  await page.addInitScript(() =>
    localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })),
  );
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: TURNSTILE_STUB }),
  );
  await page.route('**/tools.php*', (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({ json: { success: true, data: { csrf: 'jeton-csrf' } } });
    sent = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ json: { success: true, message: 'OK', data: REPORT } });
  });
  await page.goto('/outils/sitemap/');
  await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
  await page.getByLabel('Adresse du site ou du sitemap').fill('exemple.fr');
  await page.getByRole('button', { name: 'Vérifier le sitemap' }).click();

  await expect(page.getByRole('heading', { name: 'Rapport', exact: true })).toBeFocused();
  expect(sent).toEqual({ tool: 'sitemap', url: 'exemple.fr', turnstileToken: 'jeton-test' });
  const report = page.getByRole('region', { name: 'Rapport', exact: true });
  const items = report.locator('h3 + ul > li');
  await expect(items.first()).toContainText('2 URL bloquée(s) par robots.txt');
  await expect(items.nth(1)).toContainText('1 doublon(s)');
  await expect(report.getByText('déclaré dans robots.txt')).toBeVisible();
  const files = page.getByRole('region', { name: 'Fichiers lus' });
  await expect(files.getByRole('row')).toHaveCount(3);
  await expect(files).toContainText('urlset · gzip');
  const sample = page.getByRole('region', { name: 'Échantillon de pages testées' });
  await expect(sample.getByRole('row', { name: /ancienne/ })).toContainText('HTTP 404');

  for (const theme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme: theme });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id} (${theme})`)).toEqual([]);
  }
});
