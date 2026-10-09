import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })),
  );
});

test('mouvement réduit (réglage par défaut des tests) : aucun curseur animé, aucun interrupteur', async ({
  page,
}) => {
  await page.goto('/');
  await page.mouse.move(200, 300);
  await page.mouse.move(400, 350);
  await expect(page.locator('.figma-cursor')).toHaveCount(0);
  await expect(page.locator('[data-cursor-toggle]')).toBeHidden();
});

test.describe('souris, animations autorisées', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('suit la souris, change d’état au survol, sans gêner le pointeur ni les lecteurs d’écran', async ({
    page,
  }) => {
    await page.goto('/');
    await page.mouse.move(300, 300);
    const cursor = page.locator('.figma-cursor');
    await expect(cursor).toHaveClass(/is-visible/);
    await expect(cursor).toHaveAttribute('aria-hidden', 'true');
    await expect(cursor).toHaveCSS('pointer-events', 'none');
    await expect(cursor).toContainText('Guillaume');
    await expect(page.locator('html')).not.toHaveCSS('cursor', 'none');

    await page.getByRole('link', { name: 'Me contacter' }).first().hover();
    await expect(cursor).toHaveAttribute('data-state', 'link');
    // le curseur décoratif ne bloque jamais le clic
    await page.getByRole('link', { name: 'Me contacter' }).first().click();
    await expect(page).toHaveURL(/\/contact\/$/);
    await page.getByLabel('Message').hover();
    await expect(cursor).toHaveAttribute('data-state', 'text');
  });

  test('l’interrupteur du pied de page le désactive, et le choix est mémorisé', async ({
    page,
  }) => {
    await page.goto('/');
    const toggle = page.getByRole('switch', { name: 'Curseur animé' });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await page.mouse.move(300, 300);
    await expect(page.locator('.figma-cursor')).not.toHaveClass(/is-visible/);
    await page.reload();
    await page.mouse.move(320, 320);
    await expect(page.locator('.figma-cursor')).toHaveCount(0);
    await expect(page.getByRole('switch', { name: 'Curseur animé' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  test('la commande « cursor off » du terminal le désactive', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(300, 300);
    await expect(page.locator('.figma-cursor')).toHaveClass(/is-visible/);
    const input = page.getByRole('textbox', { name: 'Commande du terminal' });
    await input.fill('cursor off');
    await input.press('Enter');
    await expect(page.locator('.figma-cursor')).not.toHaveClass(/is-visible/);
  });
});

test.describe('écran tactile', () => {
  test.use({ reducedMotion: 'no-preference', hasTouch: true, isMobile: true });

  test('aucun curseur animé sans pointeur fin', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(100, 200);
    await expect(page.locator('.figma-cursor')).toHaveCount(0);
  });
});
