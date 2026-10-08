import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Un outil est « hydraté » quand Astro a retiré l'attribut ssr de son îlot.
async function ready(page: Page, path: string) {
  await page.addInitScript(() =>
    localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })),
  );
  await page.goto(path);
  await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
}

test.describe('convertisseur d’unités', () => {
  test('convertit une taille, un débit et une base', async ({ page }) => {
    await ready(page, '/outils/convertisseur-unites/');
    await page.getByLabel('Valeur').fill('500');
    await expect(page.getByRole('term').filter({ hasText: 'Gio' })).toBeVisible();
    await expect(
      page
        .locator('dd.mono')
        .filter({ hasText: /^465[,.]\d+$/ })
        .first(),
    ).toBeVisible(); // 500 Go ≈ 465,66 Gio

    await page.getByRole('tab', { name: 'Débit et durée' }).click();
    await expect(page.getByText('Durée estimée', { exact: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Bases numériques' }).click();
    await page.getByLabel('Nombre entier').fill('255');
    await expect(page.locator('dd.mono').filter({ hasText: /^FF$/ })).toBeVisible();
  });

  test('signale une saisie invalide', async ({ page }) => {
    await ready(page, '/outils/convertisseur-unites/');
    await page.getByLabel('Valeur').fill('abc');
    await expect(page.getByText('Saisissez un nombre')).toBeVisible();
  });

  test('les onglets se parcourent aux flèches', async ({ page }) => {
    await ready(page, '/outils/convertisseur-unites/');
    await page.getByRole('tab', { name: 'Tailles' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Débit et durée' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('tab', { name: 'Débit et durée' })).toBeFocused();
  });

  test('respecte WCAG 2.2 AA une fois utilisé (deux thèmes)', async ({ page }) => {
    await ready(page, '/outils/convertisseur-unites/');
    await page.getByRole('tab', { name: 'Bases numériques' }).click();
    for (const scheme of ['dark', 'light'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        results.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
        ),
      ).toEqual([]);
    }
  });
});
