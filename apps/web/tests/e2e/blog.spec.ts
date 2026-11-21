import { expect, test } from '@playwright/test';

test('article : progression de lecture, copie du code, articles voisins', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/blog/spf-dkim-dmarc-expliques/');
  const bar = page.getByRole('progressbar', { name: 'Progression de la lecture' });
  await expect(bar).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await expect
    .poll(async () => Number(await bar.getAttribute('aria-valuenow')))
    .toBeGreaterThan(10);
  const copy = page.getByRole('button', { name: 'Copier le code' }).first();
  await copy.scrollIntoViewIfNeeded();
  await copy.click();
  await expect(copy).toHaveText('Copié');
  await expect(page.getByRole('button', { name: 'Copier le lien' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Articles voisins' })).toBeVisible();
});
