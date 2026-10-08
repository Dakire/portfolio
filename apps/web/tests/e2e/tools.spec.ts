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

test.describe('formateur JSON', () => {
  test('valide, localise une erreur et formate', async ({ page }) => {
    await ready(page, '/outils/formateur-json/');
    await page.getByLabel('JSON à analyser').fill('{"a":1,"b":[1,2,]}');
    await expect(page.getByRole('status').filter({ hasText: 'JSON invalide' })).toBeVisible();
    await expect(page.locator('#json-input-error')).toContainText('Virgule en trop');

    await page
      .getByLabel('JSON à analyser')
      .fill('{"nom":"x","valeurs":[1,2],"n":12345678901234567890}');
    await expect(page.getByRole('status').filter({ hasText: 'JSON valide' })).toBeVisible();
    await expect(page.getByLabel('Résultat', { exact: true })).toHaveValue(/ {2}"nom": "x"/);
    await expect(page.getByLabel('Résultat', { exact: true })).toHaveValue(/12345678901234567890/); // jamais arrondi
  });
});

test.describe('générateur de mots de passe', () => {
  test('génère des mots de passe de la bonne longueur', async ({ page }) => {
    await ready(page, '/outils/generateur-mot-de-passe/');
    const first = page.locator('.secret-list code').first();
    await expect(first).toHaveText(/.{20}/);
    await page.getByRole('button', { name: 'Générer' }).click();
    await expect(page.locator('.secret-list li')).toHaveCount(5);
  });

  test('refuse un jeu de caractères vide', async ({ page }) => {
    await ready(page, '/outils/generateur-mot-de-passe/');
    for (const name of ['Minuscules', 'Majuscules', 'Chiffres', 'Symboles'])
      await page.getByLabel(new RegExp(name)).uncheck();
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
