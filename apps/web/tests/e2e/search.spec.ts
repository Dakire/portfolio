import { expect, test } from '@playwright/test';

test('la palette de recherche s’ouvre au clavier, groupe les résultats et se ferme avec Échap', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog', { name: 'Rechercher' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Rechercher' })).toBeFocused();
  // Champ vide : suggestions
  await expect(dialog.locator('.search-group-title').first()).toBeVisible();
  await page.keyboard.type('proxmox');
  await expect(dialog.getByRole('heading', { name: 'Projets' })).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Homelab Proxmox/ }).first()).toBeVisible();
  // Insensible à la casse et aux accents
  await page.getByRole('searchbox', { name: 'Rechercher' }).fill('MESSAGERIE CLOUD');
  await expect(dialog.getByRole('link').first()).toBeVisible();
  await page.getByRole('searchbox', { name: 'Rechercher' }).fill('qjxkvwzb');
  await expect(dialog.locator('.search-message')).toHaveText('Aucun résultat.');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('la page /search/?q= est partageable', async ({ page }) => {
  await page.goto('/search/?q=cidr');
  await expect(page.getByRole('link', { name: /CIDR expliqués/ }).first()).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Rechercher' })).toHaveValue('cidr');
});
