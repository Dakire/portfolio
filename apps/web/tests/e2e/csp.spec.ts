import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// Le serveur de test ne lit pas le .htaccess : on y injecte la CSP réellement générée pour la production, puis on vérifie qu'aucune page
// ne la viole (scripts d'îlots, styles, polices, images, connexions), thème clair et sombre, avec l'outil hydraté.
// Lue au premier test seulement : dist/ est produit par le serveur de test, après la collecte des fichiers.
const loadCsp = (): string =>
  readFileSync('dist/.htaccess', 'utf-8')
    .match(/Content-Security-Policy "([^"]+)"/)![1]!
    // Sans objet en test (HTTP local) et fausserait toutes les requêtes.
    .replace('; upgrade-insecure-requests', '');

const PAGES = [
  '/',
  '/en/',
  '/a-propos/',
  '/competences/',
  '/projets/',
  '/contact/',
  '/en/contact/',
  '/blog/',
  '/blog/spf-dkim-dmarc-expliques/',
  '/en/blog/spf-dkim-dmarc-explained/',
  '/outils/',
  '/outils/dns/',
  '/outils/propagation-dns/',
  '/outils/ics-decouper/',
  '/outils/ics-comparer/',
  '/outils/en-tetes-email/',
  '/outils/calculateur-reseau/',
  '/outils/encodeur-decodeur/',
  '/outils/generateur-mot-de-passe/',
  '/outils/formateur-json/',
  '/outils/convertisseur-unites/',
  '/mentions-legales/',
  '/confidentialite/',
  '/accessibilite/',
  '/page-inexistante-csp/',
];

test.beforeEach(async ({ page }) => {
  const csp = loadCsp();
  await page.addInitScript(() => {
    localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() }));
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      (window as unknown as { __csp: string[] }).__csp.push(
        `${e.violatedDirective} : ${e.blockedURI || 'inline'} ${e.sample ?? ''}`.trim(),
      ),
    );
  });
  // Turnstile est tiers : remplacé par un double (le test porte sur nos propres ressources).
  await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.fallback();
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), 'content-security-policy': csp },
    });
  });
});

for (const path of PAGES) {
  for (const scheme of ['dark', 'light'] as const) {
    test(`${path} respecte la CSP (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && /Content Security Policy|CSP/i.test(msg.text()))
          consoleErrors.push(msg.text());
      });
      await page.goto(path);
      const islands = page.locator('astro-island');
      if (await islands.count()) {
        await islands.first().scrollIntoViewIfNeeded();
        await expect(page.locator('astro-island[ssr]')).toHaveCount(0, { timeout: 10_000 });
      }
      const violations = await page.evaluate(
        () => (window as unknown as { __csp: string[] }).__csp,
      );
      expect(violations).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  }
}
