import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })));
});

const terminal = (page) => page.getByRole('region', { name: /Terminal interactif|Interactive terminal/ });
const prompt = (page) => page.getByLabel(/Commande du terminal|Terminal command/);
const log = (page) => page.getByRole('log');
const type = async (page, command) => {
  await prompt(page).fill(command);
  await prompt(page).press('Enter');
};

test.describe('terminal interactif', () => {
  test('affiche son prompt, ses suggestions et reste inactif tant que React n\'a pas hydraté', async ({ page, request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toMatch(/<input id="term-input"[^>]*disabled/); // le formulaire ne peut pas être envoyé avant l'hydratation
    await page.goto('/');
    await expect(terminal(page)).toBeVisible();
    await expect(prompt(page)).toBeEnabled();
    await expect(terminal(page).getByRole('button', { name: 'help' })).toBeEnabled();
    await expect(page.getByText('Tapez une commande')).toBeVisible();
  });

  test('exécute help, annonce la sortie dans un journal et vide le champ', async ({ page }) => {
    await page.goto('/');
    await type(page, 'help');
    await expect(log(page)).toContainText('Commandes disponibles');
    await expect(log(page)).toContainText('skills');
    await expect(prompt(page)).toHaveValue('');
    await expect(log(page)).toHaveAttribute('aria-live', 'polite');
  });

  test('les suggestions lancent une commande sans clavier', async ({ page }) => {
    await page.goto('/');
    await terminal(page).getByRole('button', { name: 'skills' }).click();
    await expect(log(page)).toContainText('Systèmes & Réseaux');
    await expect(log(page)).toContainText('Messagerie & Cloud');
  });

  test('l\'historique se parcourt avec les flèches', async ({ page }) => {
    await page.goto('/');
    await type(page, 'whoami');
    await type(page, 'skills');
    await prompt(page).focus();
    await prompt(page).press('ArrowUp');
    await expect(prompt(page)).toHaveValue('skills');
    await prompt(page).press('ArrowUp');
    await expect(prompt(page)).toHaveValue('whoami');
    await prompt(page).press('ArrowDown');
    await expect(prompt(page)).toHaveValue('skills');
    await prompt(page).press('ArrowDown');
    await expect(prompt(page)).toHaveValue('');
  });

  test('Tab complète une commande ou un argument, et ne piège jamais le focus', async ({ page }) => {
    await page.goto('/');
    await prompt(page).fill('sk');
    await prompt(page).press('Tab');
    await expect(prompt(page)).toHaveValue('skills ');
    await prompt(page).fill('goto ex');
    await prompt(page).press('Tab');
    await expect(prompt(page)).toHaveValue('goto experience');

    // Rien à compléter : Tab quitte le champ
    await prompt(page).fill('');
    await prompt(page).press('Tab');
    await expect(prompt(page)).not.toBeFocused();
    await prompt(page).fill('zzz');
    await prompt(page).focus();
    await prompt(page).press('Tab');
    await expect(prompt(page)).not.toBeFocused();
  });

  test('goto fait défiler jusqu\'à la section', async ({ page }) => {
    await page.goto('/');
    await type(page, 'goto contact');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    await expect(page.locator('#contact')).toBeInViewport();
  });

  test('theme change le thème et lang change de langue', async ({ page }) => {
    await page.goto('/');
    await type(page, 'theme light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await type(page, 'theme dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await type(page, 'lang en');
    await expect(page).toHaveURL(/\/en\/$/);
    await expect(terminal(page)).toBeVisible();
  });

  test('blog, links et cv produisent des liens utilisables', async ({ page }) => {
    await page.goto('/');
    await type(page, 'blog');
    await expect(log(page).getByRole('link', { name: 'Tous les articles' })).toHaveAttribute('href', '/blog/');
    await expect(log(page).getByRole('link').first()).toHaveAttribute('href', /^\/blog\/.+\/$/);
    await type(page, 'links');
    await expect(log(page).getByRole('link', { name: 'https://github.com/Dakire' })).toHaveAttribute('target', '_blank');
    await expect(log(page).getByRole('link', { name: 'outil DNS et e-mail' })).toHaveAttribute('href', '/outils/dns/');

    // cv ouvre le PDF dans un nouvel onglet (window.open observé : le lecteur PDF de Chromium n'a pas à être testé)
    await page.evaluate(() => {
      window.__opened = [];
      window.open = (...args) => window.__opened.push(args);
    });
    await type(page, 'cv');
    expect(await page.evaluate(() => window.__opened)).toEqual([['/CV_Guillaume_Richard_FR.pdf', '_blank', 'noopener']]);
  });

  test('clear efface, Ctrl+L aussi ; une commande inconnue est signalée', async ({ page }) => {
    await page.goto('/');
    await type(page, 'bidule');
    await expect(log(page)).toContainText('commande introuvable : bidule');
    await type(page, 'clear');
    await expect(log(page)).not.toContainText('bidule');
    await type(page, 'whoami');
    await prompt(page).press('Control+l');
    await expect(log(page)).not.toContainText('guillaume');
  });

  test('n\'interprète jamais de HTML saisi', async ({ page }) => {
    await page.goto('/');
    await type(page, 'echo <img src=x onerror=window.pwned=1><b>x</b>');
    await expect(log(page)).toContainText('<img src=x onerror=window.pwned=1><b>x</b>');
    expect(await page.evaluate(() => window.pwned)).toBeUndefined();
    await expect(log(page).locator('img, b')).toHaveCount(0);
  });

  test('la version anglaise a ses textes et ses liens', async ({ page }) => {
    await page.goto('/en/');
    await expect(terminal(page)).toBeVisible();
    await type(page, 'help');
    await expect(log(page)).toContainText('Available commands');
    await type(page, 'nope');
    await expect(log(page)).toContainText('command not found: nope');
    await type(page, 'blog');
    await expect(log(page).getByRole('link').first()).toHaveAttribute('href', /^\/en\/blog\//);
  });

  test('ne déborde pas à 320 px et ses boutons font 44 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/');
    await type(page, 'skills');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const heights = await terminal(page).getByRole('button').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(43.5);
  });

  for (const theme of ['dark', 'light']) {
    test(`respecte WCAG AA avec des sorties affichées (axe, thème ${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
      await page.goto('/');
      await type(page, 'help');
      await type(page, 'projects');
      await type(page, 'blog');
      const results = await new AxeBuilder({ page }).include('#terminal-root').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
});
