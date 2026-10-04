import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })));
});

const palette = (page) => page.getByRole('dialog', { name: /Palette de commandes|Command palette/ });
const search = (page) => palette(page).getByRole('combobox');
const options = (page) => palette(page).getByRole('option');
const open = async (page) => {
  await page.keyboard.press('Control+k');
  await expect(palette(page)).toBeVisible();
};

test.describe('palette de commandes', () => {
  test('s\'ouvre avec Ctrl+K, le bouton de l\'en-tête ou « / », se ferme avec Échap et rend le focus', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner').getByRole('button', { name: /Rechercher ou lancer/ })).toBeVisible();

    const trigger = page.getByRole('banner').getByRole('button', { name: /Rechercher ou lancer/ });
    await trigger.focus();
    await trigger.press('Enter');
    await expect(palette(page)).toBeVisible();
    await expect(search(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(palette(page)).toBeHidden();
    await expect(trigger).toBeFocused();

    await open(page);
    await page.keyboard.press('Escape');
    await page.locator('body').click({ position: { x: 5, y: 300 } });
    await page.keyboard.press('/');
    await expect(palette(page)).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('« / » n\'ouvre pas la palette quand on tape dans un champ', async ({ page }) => {
    await page.goto('/');
    await page.locator('#contact-root').scrollIntoViewIfNeeded();
    await page.getByLabel('Votre message').fill('');
    await page.getByLabel('Votre message').press('/');
    await expect(palette(page)).toBeHidden();
    await expect(page.getByLabel('Votre message')).toHaveValue('/');
  });

  test('expose le motif ARIA combobox / listbox', async ({ page }) => {
    await page.goto('/');
    await open(page);
    await expect(search(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(search(page)).toHaveAttribute('aria-controls', 'palette-list');
    await expect(palette(page).getByRole('listbox')).toBeVisible();
    await expect(options(page).first()).toHaveAttribute('aria-selected', 'true');
    const active = await search(page).getAttribute('aria-activedescendant');
    expect(active).toBe(await options(page).first().getAttribute('id'));
    expect(await options(page).count()).toBeGreaterThan(10);
  });

  test('sans saisie : actions, pages et sections regroupées', async ({ page }) => {
    await page.goto('/');
    await open(page);
    for (const group of ['Actions', 'Pages', 'Outils', 'Accueil', 'Articles']) await expect(palette(page).locator('.palette-group', { hasText: group })).toBeVisible();
  });

  test('les flèches déplacent la sélection (avec retour à la ligne) et Entrée ouvre', async ({ page }) => {
    await page.goto('/');
    await open(page);
    await search(page).fill('blog');
    await expect(options(page).first()).toHaveAttribute('aria-selected', 'true');
    const count = await options(page).count();
    expect(count).toBeGreaterThan(1);
    await page.keyboard.press('ArrowDown');
    await expect(options(page).nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(search(page)).toHaveAttribute('aria-activedescendant', (await options(page).nth(1).getAttribute('id')) ?? '');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(options(page).nth(count - 1)).toHaveAttribute('aria-selected', 'true');
  });

  test('retrouve une page par son nom, ses mots-clés ou sans accent, et y mène', async ({ page }) => {
    await page.goto('/');
    await open(page);
    await search(page).fill('outil dns');
    await expect(options(page).first()).toContainText('Outil DNS et e-mail');
    await search(page).fill('verification');
    await expect(palette(page).getByRole('option', { name: /Outil DNS et e-mail/ })).toBeVisible(); // trouvé par ses mots-clés
    await search(page).fill('outil dns');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/outils\/dns\/$/);

    await open(page);
    await search(page).fill('stack');
    await expect(options(page).first()).toContainText('Compétences');
    await search(page).fill('competences');
    await expect(options(page).first()).toContainText('Compétences');
    await search(page).fill('spf dmarc');
    await expect(options(page).first()).toContainText(/SPF|DMARC/);
  });

  test('trouve un article par son titre et y mène', async ({ page }) => {
    await page.goto('/');
    await open(page);
    await search(page).fill('windows 11');
    await expect(options(page).first()).toContainText('Windows 11');
    await options(page).first().click();
    await expect(page).toHaveURL(/\/blog\/fin-support-windows-10/);
  });

  test('annonce l\'absence de résultat', async ({ page }) => {
    await page.goto('/');
    await open(page);
    await search(page).fill('zzzzqqqq');
    await expect(palette(page).getByText('Aucun résultat pour « zzzzqqqq »').first()).toBeVisible();
    await expect(options(page)).toHaveCount(0);
  });

  test('l\'action thème bascule le thème', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await open(page);
    await search(page).fill('thème');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('l\'action langue mène à la traduction de l\'article courant', async ({ page }) => {
    await page.goto('/blog/spf-dkim-dmarc-expliques/');
    await open(page);
    await search(page).fill('langue');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/en\/blog\/spf-dkim-dmarc-explained\/$/);
  });

  test('copie l\'adresse e-mail et le confirme sans fermer la palette', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await open(page);
    await search(page).fill('copier');
    await page.keyboard.press('Enter');
    await expect(palette(page).getByText('Adresse e-mail copiée').first()).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('contact@grichard.eu');
    await expect(palette(page)).toBeVisible();
  });

  test('est disponible sur toutes les pages, dans la langue de la page', async ({ page }) => {
    for (const path of ['/blog/', '/mentions-legales/', '/outils/dns/', '/en/']) {
      await page.goto(path);
      await open(page);
      await expect(options(page).first()).toBeVisible();
      await page.keyboard.press('Escape');
    }
    await page.goto('/en/');
    await open(page);
    await expect(palette(page).getByText('Change theme (light / dark)')).toBeVisible();
    await search(page).fill('skills');
    await expect(options(page).first()).toContainText('Skills');
  });

  test('un clic sur le fond la ferme', async ({ page }) => {
    await page.goto('/');
    await open(page);
    await page.mouse.click(5, 5);
    await expect(palette(page)).toBeHidden();
  });

  test('est entièrement masquée sans JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Rechercher ou lancer/ })).toBeHidden();
    await context.close();
  });

  test('le fichier d\'index ne contient que du contenu public et les deux langues', async ({ request }) => {
    const index = await (await request.get('/search-index.json')).json();
    expect(Object.keys(index)).toEqual(['fr', 'en']);
    for (const lang of ['fr', 'en']) {
      expect(index[lang].items.length).toBeGreaterThan(20);
      for (const item of index[lang].items) {
        expect(item.title).toBeTruthy();
        expect(item.url || item.action).toBeTruthy();
      }
    }
  });
});

test.describe('accessibilité et mobile', () => {
  for (const theme of ['dark', 'light']) {
    test(`respecte WCAG AA ouverte (axe, thème ${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
      await page.goto('/');
      await open(page);
      await search(page).fill('dns');
      await expect(options(page).first()).toBeVisible();
      const results = await new AxeBuilder({ page }).include('dialog.palette').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }

  test('ses options et son bouton de fermeture font 44 px, sans débordement à 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');
    await page.getByRole('banner').getByRole('button', { name: /Rechercher ou lancer/ }).click();
    await expect(palette(page)).toBeVisible();
    const small = await palette(page).locator('[role="option"], button').evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 43.5).map((e) => e.textContent.trim().slice(0, 20)));
    expect(small).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await palette(page).getByRole('button', { name: 'Fermer la palette' }).click();
    await expect(palette(page)).toBeHidden();
  });
});
