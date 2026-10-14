import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const noConsent = (page: Page) =>
  page.addInitScript(() =>
    localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })),
  );

const results = (page: Page) => page.locator('[data-ref-results] > li > article');

test.describe('Référence : recherche', () => {
  test.beforeEach(async ({ page }) => noConsent(page));

  test('préfixe, casse et tiret : « get-mail » trouve Get-Mailbox', async ({ page }) => {
    await page.goto('/cheatsheets/powershell-m365/');
    await page.getByRole('searchbox').fill('get-mail');
    await expect(results(page).first().locator('h3')).toContainText('Get-Mailbox');
    await expect(page.locator('[data-ref-status]')).toContainText('résultat');
    await expect(page.locator('mark').first()).toBeVisible();
  });

  test('tolère une faute de frappe et ignore les accents', async ({ page }) => {
    await page.goto('/cheatsheets/powershell-m365/');
    const box = page.getByRole('searchbox');
    await box.fill('mailbx');
    await expect(results(page).first().locator('h3')).toContainText('Mailbox');
    await box.fill('etiquette externe'); // « Étiquette » dans la source
    await expect(results(page).first().locator('h3')).toContainText('New-TransportRule');
  });

  test('plusieurs mots : tous doivent correspondre (ET)', async ({ page }) => {
    await page.goto('/cheatsheets/windows-11/');
    const box = page.getByRole('searchbox');
    await box.fill('bitlocker status');
    await expect(results(page).first()).toBeVisible();
    const n1 = await results(page).count();
    await box.fill('bitlocker zzzzxqj');
    await expect(page.locator('.ref-empty')).toBeVisible();
    expect(n1).toBeGreaterThan(0);
  });

  test('la correspondance exacte du nom passe en premier', async ({ page }) => {
    await page.goto('/cheatsheets/windows-11/');
    await page.getByRole('searchbox').fill('sfc /scannow');
    await expect(results(page).first().locator('h3')).toContainText('sfc /scannow');
  });

  test('filtre par catégorie et paramètres d’URL ?q=&cat=', async ({ page }) => {
    await page.goto('/cheatsheets/windows-11/?q=get&cat=network');
    await expect(page.getByRole('button', { name: 'Réseau' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('searchbox')).toHaveValue('get');
    await expect(results(page).first()).toBeVisible();
    await page.getByRole('button', { name: 'Disque' }).click();
    await expect(page).toHaveURL(/cat=disk/);
    await expect(page).toHaveURL(/q=get/);
  });

  test('clavier : / focus, flèches, Entrée ouvre la doc, Échap vide', async ({ page, context }) => {
    await page.goto('/cheatsheets/windows-11/');
    await page.keyboard.press('/');
    await expect(page.getByRole('searchbox')).toBeFocused();
    await page.keyboard.type('get-process');
    await expect(results(page).first()).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(results(page).first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(results(page).nth(1)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('searchbox')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('searchbox')).toHaveValue('');
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('searchbox')).toBeFocused();

    await page.keyboard.type('sfc');
    await page.keyboard.press('ArrowDown');
    const popup = context.waitForEvent('page');
    await page.keyboard.press('Enter');
    const tab = await popup;
    expect(tab.url()).toContain('learn.microsoft.com');
  });

  test('bouton Copier', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/cheatsheets/windows-11/');
    await page.getByRole('searchbox').fill('systeminfo');
    await results(page)
      .first()
      .getByRole('button', { name: /Copier/ })
      .first()
      .click();
    await expect(page.locator('[data-ref-toast]')).toHaveText('Copié');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('systeminfo');
  });

  test('aucun résultat : suggestions et liens utiles', async ({ page }) => {
    await page.goto('/cheatsheets/windows-11/');
    await page.getByRole('searchbox').fill('qqqqwwww');
    const empty = page.locator('.ref-empty');
    await expect(empty).toContainText('Aucun résultat');
    await expect(empty.getByRole('link', { name: /Documentation Windows Commands/ })).toBeVisible();
    await expect(page.locator('[data-ref-status]')).toContainText('Aucun résultat');
  });

  test('GAM : trouve une commande et renvoie vers le wiki d’origine', async ({ page }) => {
    await page.goto('/cheatsheets/gam/');
    await page.getByRole('searchbox').fill('create user');
    const first = results(page).first();
    await expect(first.locator('h3')).toContainText(/gam create.*user/);
    await expect(first.getByRole('link', { name: /Documentation officielle/ })).toHaveAttribute(
      'href',
      /github\.com\/GAM-team\/GAM\/wiki\/Users/,
    );
    await expect(page.getByText('Apache License 2.0')).toBeVisible();
  });

  test('recherche globale sur /cheatsheets/', async ({ page }) => {
    await page.goto('/cheatsheets/?q=bitlocker');
    await expect(results(page).first()).toBeVisible();
    await expect(results(page).first().locator('.ref-badge-ref')).toBeVisible();
  });

  test('bloc Connexion de PowerShell M365', async ({ page }) => {
    await page.goto('/cheatsheets/powershell-m365/');
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    await expect(page.getByText('Connect-ExchangeOnline').first()).toBeVisible();
  });

  test('mobile : pas de défilement horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/cheatsheets/windows-11/?q=robocopy');
    await expect(results(page).first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

const PAGES = [
  '/cheatsheets/',
  '/cheatsheets/gam/',
  '/cheatsheets/powershell-m365/',
  '/cheatsheets/windows-11/',
];
for (const theme of ['dark', 'light'] as const) {
  for (const path of PAGES) {
    test(`WCAG 2.2 AA : ${path}?q=get (thème ${theme})`, async ({ page }) => {
      await noConsent(page);
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(`${path}?q=get`);
      await expect(results(page).first()).toBeVisible();
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(axe.violations).toEqual([]);
    });
  }
}
