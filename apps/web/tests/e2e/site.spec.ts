import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Une page de chaque famille, dans les deux langues.
const PAGES = [
  '/',
  '/en/',
  '/a-propos/',
  '/en/about/',
  '/competences/',
  '/projets/',
  '/contact/',
  '/blog/',
  '/en/blog/',
  '/blog/spf-dkim-dmarc-expliques/',
  '/blog/touches-bios-uefi-boot-menu-par-marque/',
  '/en/blog/spf-dkim-dmarc-explained/',
  '/blog/categorie/dns/',
  '/outils/',
  '/en/tools/',
  '/outils/dns/',
  '/outils/propagation-dns/',
  '/outils/ics-decouper/',
  '/outils/ics-comparer/',
  '/outils/en-tetes-email/',
  '/outils/calculateur-reseau/',
  '/outils/encodeur-decodeur/',
  '/outils/generateur-mot-de-passe/',
  '/outils/formateur-json/',
  '/en/tools/dns/',
  '/en/tools/dns-propagation/',
  '/en/tools/ics-splitter/',
  '/en/tools/ics-compare/',
  '/en/tools/email-headers/',
  '/en/tools/subnet-calculator/',
  '/en/tools/encoder-decoder/',
  '/en/tools/password-generator/',
  '/en/tools/json-formatter/',
  '/outils/convertisseur-unites/',
  '/en/tools/unit-converter/',
  '/outils/seo/',
  '/en/tools/seo/',
  '/mentions-legales/',
  '/confidentialite/',
  '/en/privacy/',
  '/accessibilite/',
  '/en/accessibility/',
  '/404.html',
  '/design/',
];

for (const theme of ['dark', 'light'] as const) {
  for (const path of PAGES) {
    test(`WCAG 2.2 AA : ${path} (thème ${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        results.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
        ),
      ).toEqual([]);
    });
  }
}

test('le bandeau de consentement est accessible et atteint en premier au clavier', async ({
  page,
}) => {
  await page.goto('/');
  const banner = page.getByRole('region', { name: 'Gestion des cookies' });
  await expect(banner).toBeVisible();
  await page.keyboard.press('Tab'); // le bandeau précède tout le reste de la page : son lien d'information est atteint en premier
  await expect(banner.getByRole('link')).toBeFocused();
  const results = await new AxeBuilder({ page }).include('.consent').analyze();
  expect(results.violations).toEqual([]);
});

test('refuser mémorise le choix sans charger Google Analytics', async ({ page }) => {
  const google: string[] = [];
  page.on(
    'request',
    (r) => /googletagmanager|google-analytics/.test(r.url()) && google.push(r.url()),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Refuser' }).click();
  await expect(page.locator('.consent')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.consent')).toHaveCount(0);
  expect(google).toEqual([]);
});

test('le sélecteur de langue mène à la page équivalente', async ({ page }) => {
  await page.goto('/blog/spf-dkim-dmarc-expliques/');
  await page.getByRole('link', { name: 'English', exact: true }).first().click();
  await expect(page).toHaveURL(/\/en\/blog\/spf-dkim-dmarc-explained\/$/);
});

test('le sélecteur de thème change et mémorise le choix', async ({ page }) => {
  await page.goto('/');
  const group = page.getByRole('group', { name: 'Thème' });
  await group.getByRole('button', { name: 'clair' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await group.getByRole('button', { name: 'auto' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark'); // le système simulé est sombre
});

test("le filtre de tableau de l'article BIOS fonctionne", async ({ page }) => {
  await page.goto('/blog/touches-bios-uefi-boot-menu-par-marque/');
  const search = page.getByRole('searchbox');
  await expect(search).toBeVisible();
  await search.fill('thinkpad');
  await expect(page.getByRole('status')).toContainText('résultat');
});

test('sans JavaScript, le contenu reste lisible', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'light' });
  const page = await context.newPage();
  await page.goto('http://localhost:4321/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-theme-switch]')).toBeHidden();
  await context.close();
});

test('aucun défilement horizontal de 320 à 1440 px', async ({ page }) => {
  for (const path of [
    '/',
    '/blog/touches-bios-uefi-boot-menu-par-marque/',
    '/blog/spf-dkim-dmarc-expliques/',
  ]) {
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} à ${width}px`).toBeLessThanOrEqual(0);
    }
  }
});

test("le lien d'évitement est le premier élément atteint au clavier et mène au contenu", async ({
  page,
}) => {
  // Choix de cookies déjà fait : sinon le bandeau, inséré en tête de page, est atteint avant le lien d'évitement (voulu).
  await page.addInitScript(() =>
    localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })),
  );
  await page.goto('/blog/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Aller au contenu' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#contenu')).toBeFocused();
});

test.describe('menu de navigation sur petit écran', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('le bouton Menu déplie la navigation ; Échap la replie et rend le focus', async ({
    page,
  }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Menu' });
    const nav = page.getByRole('navigation', { name: 'Navigation principale' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();
    await nav.getByRole('link', { name: 'Projets' }).focus();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await expect(nav).toBeHidden();
  });

  test('sans JavaScript, la navigation reste visible et le bouton est absent', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();
    await page.goto('http://localhost:4321/');
    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
    await expect(page.locator('[data-nav-toggle]')).toBeHidden();
    await context.close();
  });
});

test('le bandeau de consentement ne décale pas la page (CLS) et ne masque pas la fin de page', async ({
  page,
}) => {
  // Position du contenu avec le bandeau, puis sans (choix déjà fait) : elle doit être identique.
  await page.goto('/');
  await expect(page.locator('.consent')).toBeVisible();
  const mainTop = () =>
    page.locator('#contenu').evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const withBanner = await mainTop();
  await expect(page.locator('.consent')).toHaveCSS('position', 'fixed');

  const footerLink = page.getByRole('button', { name: 'Gérer les cookies' });
  await footerLink.scrollIntoViewIfNeeded();
  const banner = await page.locator('.consent').boundingBox();
  const link = await footerLink.boundingBox();
  expect(link!.y + link!.height).toBeLessThanOrEqual(banner!.y);

  await page.getByRole('button', { name: 'Refuser' }).click();
  await page.reload();
  await expect(page.locator('.consent')).toHaveCount(0);
  expect(await mainTop()).toBe(withBanner);
});
