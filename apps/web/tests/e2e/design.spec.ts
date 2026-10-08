import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const theme of ['dark', 'light'] as const) {
  test(`la page de style respecte WCAG 2.2 AA (thème ${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/design/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('le sélecteur de thème change et mémorise le choix', async ({ page }) => {
  await page.goto('/design/');
  const group = page.getByRole('group', { name: 'Thème' });
  await expect(group).toBeVisible();
  await group.getByRole('button', { name: 'clair' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(group.getByRole('button', { name: 'clair' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await group.getByRole('button', { name: 'auto' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark'); // le système simulé est sombre
});

test('le lien d’évitement est le premier élément atteint au clavier', async ({ page }) => {
  await page.goto('/design/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Aller au contenu' })).toBeFocused();
});

test('sans JavaScript, la page reste lisible et le sélecteur reste masqué', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:4321/design/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-theme-switch]')).toBeHidden();
  await context.close();
});

test('aucun défilement horizontal de 320 à 1440 px', async ({ page }) => {
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/design/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${width}px`).toBeLessThanOrEqual(0);
  }
});
