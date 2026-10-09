import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Turnstile et tools.php sont simulés : aucun test ne dépend du réseau.
const TURNSTILE_STUB = `window.turnstile = { render(el, o) { setTimeout(() => o.callback('jeton-test'), 0); return 'w1'; }, reset() {}, remove() {} };`;

const REPORT = {
  url: 'https://exemple.fr/',
  finalUrl: 'https://www.exemple.fr/',
  status: 200,
  score: 72,
  summary: { critical: 1, important: 1, info: 0, passed: 2 },
  checks: [
    {
      id: 'http_status',
      category: 'http',
      severity: 'critical',
      status: 'pass',
      data: { status: 200 },
    },
    {
      id: 'robots_meta',
      category: 'meta',
      severity: 'critical',
      status: 'fail',
      data: { meta: 'noindex', header: null },
    },
    {
      id: 'title',
      category: 'meta',
      severity: 'critical',
      status: 'pass',
      data: { value: 'Exemple : un titre de longueur correcte', length: 39 },
    },
    {
      id: 'canonical',
      category: 'meta',
      severity: 'important',
      status: 'fail',
      data: { value: null, count: 2 },
    },
    {
      id: 'images_alt',
      category: 'content',
      severity: 'important',
      status: 'fail',
      data: { total: 3, missing: 2, examples: ['/a.png', '/b.png'] },
    },
    {
      id: 'links',
      category: 'links',
      severity: 'info',
      status: 'info',
      data: { internal: 12, external: 3, nofollow: 0 },
    },
  ],
};

async function open(
  page: Page,
  reply: (
    body: Record<string, unknown>,
    headers: Record<string, string>,
  ) => { status: number; json: unknown },
) {
  await page.addInitScript(() =>
    localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })),
  );
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: TURNSTILE_STUB }),
  );
  await page.route('**/tools.php*', async (route) => {
    const request = route.request();
    if (request.method() === 'GET')
      return route.fulfill({
        json: { success: true, message: 'OK', data: { csrf: 'jeton-csrf' } },
      });
    const { status, json } = reply(
      request.postDataJSON() as Record<string, unknown>,
      request.headers(),
    );
    return route.fulfill({ status, json });
  });
  await page.goto('/outils/seo/');
  await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
}

test('analyse une page : jetons envoyés, points à corriger en tête, focus sur le rapport', async ({
  page,
}) => {
  let sent: Record<string, unknown> = {};
  let csrfHeader = '';
  await open(page, (body, headers) => {
    sent = body;
    csrfHeader = headers['x-csrf-token'] ?? '';
    return { status: 200, json: { success: true, message: 'OK', data: REPORT } };
  });
  await page.getByLabel('Adresse de la page').fill('exemple.fr');
  await page.getByRole('button', { name: 'Analyser la page' }).click();

  const report = page.getByRole('region', { name: 'Rapport', exact: true });
  await expect(page.getByRole('heading', { name: 'Rapport', level: 2, exact: true })).toBeFocused();
  expect(sent).toEqual({ tool: 'seo', url: 'exemple.fr', turnstileToken: 'jeton-test' });
  expect(csrfHeader).toBe('jeton-csrf');
  await expect(report.getByText('72')).toBeVisible();
  await expect(report.getByRole('meter')).toHaveAttribute('value', '72');
  await expect(report.getByRole('heading', { name: 'À corriger (3)' })).toBeVisible();
  const items = report.locator('h3 + ul > li');
  await expect(items.first()).toContainText('La page interdit son indexation (noindex)');
  await expect(items.first()).toContainText('Critique');
  // priorité à la gravité : les contrôles importants viennent après le critique
  await expect(items.nth(1)).toContainText('Important');
  await expect(items.nth(2)).toContainText('2 image(s) sans attribut alt sur 3');
  await expect(report.getByText('Conformes (3)')).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter en JSON' }).click();
  expect((await download).suggestedFilename()).toMatch(
    /^rapport-seo-www\.exemple\.fr-\d{4}-\d{2}-\d{2}\.json$/,
  );
});

test('affiche l’erreur du serveur (adresse non publique) et la valide côté client', async ({
  page,
}) => {
  await open(page, () => ({
    status: 422,
    json: { success: false, message: 'x', code: 'blocked_address' },
  }));
  await page.getByRole('button', { name: 'Analyser la page' }).click();
  await expect(page.getByText('Saisissez l’adresse d’une page.')).toBeVisible();
  await expect(page.getByLabel('Adresse de la page')).toBeFocused();
  await page.getByLabel('Adresse de la page').fill('http://127.0.0.1/');
  await page.getByRole('button', { name: 'Analyser la page' }).click();
  await expect(page.getByRole('alert')).toContainText('n’est pas publique');
});

test('quota dépassé : message explicite (anglais)', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })),
  );
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: TURNSTILE_STUB }),
  );
  await page.route('**/tools.php*', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ json: { success: true, data: { csrf: 'x' } } })
      : route.fulfill({ status: 429, json: { success: false, code: 'rate_limited' } }),
  );
  await page.goto('/en/tools/seo/');
  await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
  await page.getByLabel('Page address').fill('example.com');
  await page.getByRole('button', { name: 'Analyse the page' }).click();
  await expect(page.getByRole('alert')).toContainText('12 analyses per hour');
});
