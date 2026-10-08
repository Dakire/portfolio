import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })));
});

for (const [lang, path, all, hub] of [['fr', '/', 'Tous les outils', '/outils/'], ['en', '/en/', 'All tools', '/en/tools/']]) {
  test(`l'accueil (${lang}) présente les outils, chacun avec un lien valide`, async ({ page, request }) => {
    await page.goto(path);
    const section = page.locator('#tools');
    await expect(section.getByRole('heading', { level: 2 })).toHaveText(lang === 'fr' ? 'Outils' : 'Tools');
    const links = section.locator('ul a');
    expect(await links.count()).toBeGreaterThanOrEqual(9);
    for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))) {
      expect((await request.get(href)).status(), href).toBe(200);
    }
    await expect(section.getByRole('link', { name: all })).toHaveAttribute('href', hub);
  });
}

test('le terminal mène à la section Outils', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/Commande du terminal/).fill('goto tools');
  await page.getByLabel(/Commande du terminal/).press('Enter');
  await expect(page.getByRole('log')).toContainText('outils');
  await expect(page.locator('#tools')).toBeInViewport();
});
