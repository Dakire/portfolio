import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // choix de cookies déjà fait : le bandeau ne recouvre pas le terminal
  await page.addInitScript(() =>
    localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })),
  );
});

test('exécute des commandes et annonce le résultat dans le journal', async ({ page }) => {
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Commande du terminal' });
  const log = page.getByRole('log', { name: 'Résultats des commandes' });
  await expect(input).toBeEnabled();
  await input.fill('help');
  await input.press('Enter');
  await expect(log).toContainText('Commandes disponibles');
  await expect(log).toContainText('neofetch');
  await input.fill('whoami');
  await input.press('Enter');
  await expect(log).toContainText('guillaume richard');
  await input.fill('nimporte');
  await input.press('Enter');
  await expect(log).toContainText('commande introuvable : nimporte');
  await input.fill('clear');
  await input.press('Enter');
  await expect(log).toBeEmpty();
});

test('historique aux flèches et complétion par Tab sans piège clavier', async ({ page }) => {
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Commande du terminal' });
  await expect(input).toBeEnabled();
  for (const command of ['about', 'skills']) {
    await input.fill(command);
    await input.press('Enter');
  }
  await input.press('ArrowUp');
  await expect(input).toHaveValue('skills');
  await input.press('ArrowUp');
  await expect(input).toHaveValue('about');
  await input.press('ArrowDown');
  await expect(input).toHaveValue('skills');
  await input.fill('neo');
  await input.press('Tab');
  await expect(input).toHaveValue('neofetch ');
  await expect(input).toBeFocused();
  // rien à compléter : Tab quitte le champ
  await input.fill('');
  await input.press('Tab');
  await expect(input).not.toBeFocused();
});

test('les suggestions, theme et open agissent sur la page', async ({ page }) => {
  await page.goto('/');
  const log = page.getByRole('log', { name: 'Résultats des commandes' });
  await page.getByRole('button', { name: 'projects', exact: true }).click();
  await expect(log).toContainText('Outil de Conversion Email');
  const input = page.getByRole('textbox', { name: 'Commande du terminal' });
  await input.fill('theme light');
  await input.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await input.fill('open dns');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/outils\/dns\/$/);
});

test('peut être désactivé, et le choix est mémorisé', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Désactiver le terminal' });
  await toggle.click();
  await expect(page.getByRole('textbox', { name: 'Commande du terminal' })).toBeHidden();
  const shortcuts = page.getByRole('navigation', { name: 'Raccourcis' });
  await expect(shortcuts).toBeVisible();
  await page.reload();
  await expect(shortcuts).toBeVisible();
  await page.getByRole('button', { name: 'Activer le terminal' }).click();
  await expect(page.getByRole('textbox', { name: 'Commande du terminal' })).toBeFocused();
});

test('boutons de la fenêtre : réduire, agrandir (Échap) et fermer', async ({ page }) => {
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Commande du terminal' });
  const minimize = page.getByRole('button', { name: 'Réduire le terminal' });
  const maximize = page.getByRole('button', { name: /^Agrandir le terminal/ });
  const close = page.getByRole('button', { name: 'Fermer le terminal' });
  await expect(input).toBeVisible();

  await minimize.click();
  await expect(minimize).toHaveAttribute('aria-pressed', 'true');
  await expect(input).toBeHidden();
  await minimize.click();
  await expect(input).toBeFocused();

  await maximize.click();
  await expect(maximize).toHaveAttribute('aria-pressed', 'true');
  const box = await page.locator('.terminal-window').boundingBox();
  expect(box?.height ?? 0).toBeGreaterThan(500);
  await page.keyboard.press('Escape');
  await expect(maximize).toHaveAttribute('aria-pressed', 'false');
  await expect(maximize).toBeFocused();

  await close.click();
  await expect(input).toBeHidden();
  await expect(page.getByRole('button', { name: 'Activer le terminal' })).toBeFocused();
});

test('sans JavaScript : présentation et raccourcis, pas de champ inutilisable', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:4321/');
  await expect(page.getByRole('navigation', { name: 'Raccourcis' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Raccourcis' }).getByRole('link')).toHaveCount(
    7,
  );
  await expect(page.locator('[data-terminal-form]')).toBeHidden();
  await context.close();
});

for (const theme of ['dark', 'light'] as const) {
  test(`WCAG 2.2 AA : terminal utilisé (thème ${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/en/');
    const input = page.getByRole('textbox', { name: 'Terminal command' });
    await expect(input).toBeEnabled();
    for (const command of ['help', 'projects', 'nope', 'neofetch']) {
      await input.fill(command);
      await input.press('Enter');
    }
    const results = await new AxeBuilder({ page })
      .include('.terminal')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}
