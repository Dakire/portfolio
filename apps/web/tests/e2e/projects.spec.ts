import { expect, test } from '@playwright/test';

test('la grille de projets se filtre par domaine et par technologie', async ({ page }) => {
  await page.goto('/projets/');
  const list = page.locator('.pgrid-list > li');
  await page.getByRole('group', { name: 'Filtrer par domaine' }).scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island[component-url*="ProjectGrid"]')).not.toHaveAttribute(
    'ssr',
    /.*/,
  );
  const total = await list.count();
  expect(total).toBeGreaterThan(4);
  const domain = page.getByRole('group', { name: 'Filtrer par domaine' });
  await domain.getByRole('button', { name: 'Réseau & Systèmes' }).click();
  await expect(domain.getByRole('button', { name: 'Réseau & Systèmes' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const filtered = await list.count();
  expect(filtered).toBeLessThan(total);
  await expect(page.getByRole('status')).toContainText('réalisation');
  await domain.getByRole('button', { name: 'Tous' }).click();
  await expect(list).toHaveCount(total);
  await page
    .getByRole('group', { name: 'Filtrer par technologie' })
    .getByRole('button')
    .first()
    .click();
  expect(await list.count()).toBeLessThan(total);
});

test('la page projets reste lisible sans JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:4321/projets/');
  await expect(page.getByRole('link', { name: /Homelab Proxmox/ }).first()).toBeVisible();
  await context.close();
});
