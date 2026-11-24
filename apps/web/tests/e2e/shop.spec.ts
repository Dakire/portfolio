import { setTheme } from './helpers/theme';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Boutique (ADR 0017) : vitrine masquée jusqu'à l'ouverture (SHOP_OPEN = false dans src/shop/config.ts).
const PAGES = [
  '/boutique/',
  '/boutique/prevenez-moi-rupture/',
  '/boutique/cgv/',
  '/en/shop/',
  '/en/shop/standup-slack/',
  '/en/shop/refunds/',
];

const noConsent = (page: Page) =>
  page.addInitScript(() =>
    localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })),
  );

for (const theme of ['light', 'dark'] as const) {
  for (const path of PAGES) {
    test(`boutique WCAG 2.2 AA : ${path} (thème ${theme})`, async ({ page }) => {
      await setTheme(page, theme);
      await noConsent(page);
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
}

test('la boutique est masquée : noindex, aucun achat, et aucun lien depuis le reste du site', async ({
  page,
}) => {
  await noConsent(page);
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('main').locator('form, button')).toHaveCount(0);
  }
  for (const path of ['/', '/en/', '/outils/', '/projets/']) {
    await page.goto(path);
    await expect(page.locator('a[href^="/boutique/"], a[href^="/en/shop/"]')).toHaveCount(0);
  }
});

test('l’accueil de la boutique affiche tous les tarifs et renvoie vers chaque fiche et chaque condition', async ({
  page,
}) => {
  await noConsent(page);
  await page.goto('/boutique/');
  await expect(page.getByRole('heading', { level: 1, name: 'Boutique' })).toBeVisible();
  await expect(page.locator('table.table tbody tr')).not.toHaveCount(0);
  for (const href of ['/boutique/cgv/', '/boutique/remboursement/', '/boutique/licence/'])
    await expect(page.locator(`main a[href="${href}"]`)).toHaveCount(1);
  await page.locator('main a[href="/boutique/standup-slack/"]').first().click();
  await expect(page).toHaveURL(/\/boutique\/standup-slack\/$/);
  await expect(page.getByText('Vendu par Paddle')).toBeVisible();
});
