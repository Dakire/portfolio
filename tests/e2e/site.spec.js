import { existsSync, readdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = [
  { name: 'accueil FR', path: '/', lang: 'fr' },
  { name: 'accueil EN', path: '/en/', lang: 'en' },
  { name: 'blog FR', path: '/blog/', lang: 'fr' },
  { name: 'blog EN', path: '/en/blog/', lang: 'en' },
  { name: 'article FR', path: '/blog/spf-dkim-dmarc-expliques/', lang: 'fr' },
  { name: 'article EN', path: '/en/blog/spf-dkim-dmarc-explained/', lang: 'en' },
  { name: 'mentions légales', path: '/mentions-legales/', lang: 'fr' },
  { name: 'legal notice', path: '/en/legal-notice/', lang: 'en' },
  { name: '404', path: '/404.html', lang: 'fr' },
];

// Le widget Cloudflare Turnstile est remplacé par un double : les tests ne dépendent pas du réseau.
const TURNSTILE_STUB = `window.turnstile = {
  render(el, options) { setTimeout(() => options.callback('test-token')); return 'widget-1'; },
  reset() {}, remove() {},
};`;
const stubTurnstile = (page) =>
  page.route('https://challenges.cloudflare.com/**', (route) => route.fulfill({ contentType: 'text/javascript', body: TURNSTILE_STUB }));

// Le bandeau de cookies est hors sujet pour ces tests : on le ferme en enregistrant un refus.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })));
});

test.describe('accessibilité (axe, WCAG 2.x A/AA)', () => {
  for (const { name, path } of PAGES) {
    test(name, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
});

test.describe('structure et SEO', () => {
  for (const { name, path, lang } of PAGES) {
    test(`${name} : langue, titre, un seul h1, canonical`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page).toHaveTitle(/\S/);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`^https://grichard\\.eu${path === '/404.html' ? '/404' : path}`));
    });
  }

  test('l\'accueil déclare ses variantes de langue', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://grichard.eu/en/');
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', 'https://grichard.eu/');
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  });

  test('le sélecteur de langue mène à l\'autre version', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Read this site in English' }).click();
    await expect(page).toHaveURL(/\/en\/$/);
  });
});

test.describe('hydratation des îlots', () => {
  for (const path of ['/', '/en/']) {
    test(`${path} : aucune erreur ni avertissement React`, async ({ page }) => {
      const problems = [];
      page.on('console', (msg) => ['error', 'warning'].includes(msg.type()) && problems.push(msg.text()));
      page.on('pageerror', (error) => problems.push(error.message));
      await stubTurnstile(page);
      await page.goto(path);
      await page.locator('#contact-root form').scrollIntoViewIfNeeded();
      await expect(page.getByRole('button', { name: /Envoyer|Send/ })).toBeVisible();
      expect(problems).toEqual([]);
    });
  }

  test('le menu mobile s\'ouvre, se ferme avec Échap et rend le focus au bouton', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Ouvrir le menu' });
    const nav = page.locator('#mobile-nav');
    await expect(nav).toBeHidden();

    await toggle.click();
    await expect(nav).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fermer le menu' })).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(page.getByRole('button', { name: 'Ouvrir le menu' })).toBeFocused();
  });

  test('un lien du menu mobile ferme le menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
    await page.locator('#mobile-nav').getByRole('link', { name: 'Compétences' }).click();
    await expect(page.locator('#mobile-nav')).toBeHidden();
  });
});

test.describe('formulaire de contact', () => {
  const fill = async (page) => {
    await page.goto('/');
    await page.locator('#contact-root form').scrollIntoViewIfNeeded();
    await page.getByLabel('Votre nom complet').fill('Ada Lovelace');
    await page.getByLabel('Votre adresse email').fill('ada@example.org');
    await page.getByLabel('Votre message').fill('Bonjour !');
    await page.getByLabel(/J'accepte/).check();
  };

  test('envoie le message avec le jeton Turnstile et confirme', async ({ page }) => {
    await stubTurnstile(page);
    let payload;
    await page.route('**/contact.php', (route) => {
      payload = route.request().postDataJSON();
      return route.fulfill({ json: { success: true, message: 'ok' } });
    });
    await fill(page);
    await expect.poll(() => page.evaluate(() => !!window.turnstile)).toBe(true);
    await page.getByRole('button', { name: /Envoyer/ }).click();

    await expect(page.getByRole('status').filter({ hasText: 'Message envoyé' })).toBeVisible();
    expect(payload).toMatchObject({ name: 'Ada Lovelace', email: 'ada@example.org', message: 'Bonjour !', website: '', turnstileToken: 'test-token' });
    await expect(page.getByLabel('Votre message')).toHaveValue('');
  });

  test('429 : message dédié « trop de messages »', async ({ page }) => {
    await stubTurnstile(page);
    await page.route('**/contact.php', (route) => route.fulfill({ status: 429, json: { success: false } }));
    await fill(page);
    await expect.poll(() => page.evaluate(() => !!window.turnstile)).toBe(true);
    await page.getByRole('button', { name: /Envoyer/ }).click();
    await expect(page.getByRole('status')).toContainText('Trop de messages');
  });

  test('coupure réseau : message dédié, les champs restent remplis', async ({ page }) => {
    await stubTurnstile(page);
    await page.route('**/contact.php', (route) => route.abort('connectionrefused'));
    await fill(page);
    await expect.poll(() => page.evaluate(() => !!window.turnstile)).toBe(true);
    await page.getByRole('button', { name: /Envoyer/ }).click();
    await expect(page.getByRole('status')).toContainText('Connexion impossible');
    await expect(page.getByLabel('Votre message')).toHaveValue('Bonjour !');
  });

  test('Turnstile injoignable : message explicite, aucun envoi', async ({ page }) => {
    await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
    let sent = false;
    await page.route('**/contact.php', (route) => {
      sent = true;
      return route.fulfill({ json: {} });
    });
    await fill(page);
    await expect(page.getByRole('status')).toContainText('vérification anti-robot');
    await page.getByRole('button', { name: /Envoyer/ }).click();
    expect(sent).toBe(false);
  });

  test('la région live garde le même rôle d\'un message à l\'autre', async ({ page }) => {
    await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
    await fill(page);
    const live = page.locator('#contact-root form p[aria-live]');
    await expect(live).toHaveAttribute('role', 'status');
    await page.getByRole('button', { name: /Envoyer/ }).click();
    await expect(live).toHaveAttribute('role', 'status');
  });
});

test.describe('contenu produit (dist/)', () => {
  test('le manifeste Vite est supprimé après le pré-rendu', () => {
    expect(existsSync('dist/.vite')).toBe(false);
  });

  test('un seul bundle JS, sans le code des sections statiques', () => {
    const scripts = readdirSync('dist/assets').filter((f) => f.endsWith('.js'));
    expect(scripts).toHaveLength(1);
  });

  test('le sitemap liste les pages et les articles', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    for (const loc of ['/', '/en/', '/blog/', '/en/blog/', '/mentions-legales/', '/blog/spf-dkim-dmarc-expliques/']) {
      expect(xml).toContain(`<loc>https://grichard.eu${loc}</loc>`);
    }
    expect(xml).not.toContain('xhtml');
  });
});
