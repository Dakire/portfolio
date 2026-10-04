import { existsSync, readdirSync, readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = [
  { name: 'accueil FR', path: '/', lang: 'fr' },
  { name: 'accueil EN', path: '/en/', lang: 'en' },
  { name: 'outils FR', path: '/outils/', lang: 'fr' },
  { name: 'outils EN', path: '/en/tools/', lang: 'en' },
  { name: 'découpeur ICS FR', path: '/outils/ics-decouper/', lang: 'fr' },
  { name: 'ICS splitter EN', path: '/en/tools/ics-splitter/', lang: 'en' },
  { name: 'comparateur ICS FR', path: '/outils/ics-comparer/', lang: 'fr' },
  { name: 'ICS comparer EN', path: '/en/tools/ics-compare/', lang: 'en' },
  { name: 'en-têtes e-mail FR', path: '/outils/en-tetes-email/', lang: 'fr' },
  { name: 'email headers EN', path: '/en/tools/email-headers/', lang: 'en' },
  { name: 'calculatrice réseau FR', path: '/outils/calculateur-reseau/', lang: 'fr' },
  { name: 'subnet calculator EN', path: '/en/tools/subnet-calculator/', lang: 'en' },
  { name: 'encodeur FR', path: '/outils/encodeur-decodeur/', lang: 'fr' },
  { name: 'encoder EN', path: '/en/tools/encoder-decoder/', lang: 'en' },
  { name: 'mot de passe FR', path: '/outils/generateur-mot-de-passe/', lang: 'fr' },
  { name: 'password generator EN', path: '/en/tools/password-generator/', lang: 'en' },
  { name: 'outil DNS FR', path: '/outils/dns/', lang: 'fr' },
  { name: 'outil DNS EN', path: '/en/tools/dns/', lang: 'en' },
  { name: 'blog FR', path: '/blog/', lang: 'fr' },
  { name: 'blog EN', path: '/en/blog/', lang: 'en' },
  { name: 'article FR', path: '/blog/spf-dkim-dmarc-expliques/', lang: 'fr' },
  { name: 'article EN', path: '/en/blog/spf-dkim-dmarc-explained/', lang: 'en' },
  { name: 'mentions légales', path: '/mentions-legales/', lang: 'fr' },
  { name: 'legal notice', path: '/en/legal-notice/', lang: 'en' },
  { name: '404', path: '/404.html', lang: 'fr' },
];
const THEMES = ['dark', 'light'];

// Le widget Cloudflare Turnstile est remplacé par un double : les tests ne dépendent pas du réseau.
const TURNSTILE_STUB = `window.turnstile = {
  render(el, options) { setTimeout(() => options.callback('test-token')); return 'widget-1'; },
  reset() {}, remove() {},
};`;
const stubTurnstile = (page) =>
  page.route('https://challenges.cloudflare.com/**', (route) => route.fulfill({ contentType: 'text/javascript', body: TURNSTILE_STUB }));

// Par défaut le bandeau de cookies est fermé (refus enregistré) et le thème est sombre ; `test.use({ storage })` peut les changer.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('consent')) localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() }));
  });
});
const withTheme = (page, theme) => page.addInitScript((t) => localStorage.setItem('theme', t), theme);

test.describe('accessibilité (axe, WCAG 2.x A/AA) dans les deux thèmes', () => {
  for (const theme of THEMES) {
    for (const { name, path } of PAGES) {
      test(`${name} (${theme})`, async ({ page }) => {
        await withTheme(page, theme);
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        expect(results.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
      });
    }
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
      await expect(page.locator('header')).toHaveCount(1);
      await expect(page.locator('footer')).toHaveCount(1);
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

  test('sur un article, le sélecteur de langue mène à sa traduction', async ({ page }) => {
    await page.goto('/blog/spf-dkim-dmarc-expliques/');
    await page.getByRole('banner').getByRole('link', { name: 'Read this site in English' }).click();
    await expect(page).toHaveURL(/\/en\/blog\/spf-dkim-dmarc-explained\/$/);
  });
});

test.describe('responsive', () => {
  const WIDTHS = [320, 375, 768, 1024, 1440, 2560];
  for (const { name, path } of PAGES) {
    test(`${name} : aucun scroll horizontal de 320 à 2560 px`, async ({ page }) => {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${width}px`).toBeLessThanOrEqual(0);
      }
    });
  }

  // Cibles tactiles : 44 x 44 px minimum pour les boutons et liens autonomes (les liens au fil d'un paragraphe en sont dispensés)
  for (const { name, path } of PAGES.filter((p) => !p.path.includes('/blog/') || p.path.endsWith('/blog/'))) {
    test(`${name} : cibles tactiles >= 44 px sur mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);
      await page.locator('[data-nav-toggle]').click(); // libellé selon la langue de la page
      const tooSmall = await page.evaluate(() =>
        [...document.querySelectorAll('a, button, summary, label:has(input[type="checkbox"])')]
          .filter((el) => {
            const box = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            // Un lien « inline » au fil d'une phrase est dispensé de la règle (WCAG 2.5.8)
            return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'inline' && !el.closest('[aria-hidden="true"], .article, .skip-link, #dodge-zone') && (box.height < 43.5 || box.width < 43.5);
          })
          .map((el) => `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent).trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`),
      );
      expect(tooSmall).toEqual([]);
    });
  }
});

test.describe('thème', () => {
  test('suit le réglage du système par défaut', async ({ browser }) => {
    for (const scheme of ['light', 'dark']) {
      const context = await browser.newContext({ colorScheme: scheme });
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
      await context.close();
    }
  });

  test('la bascule change de thème, le mémorise et met à jour aria-pressed', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Thème clair' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(248, 250, 252)');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByRole('button', { name: 'Thème clair' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('le choix manuel l\'emporte sur le système et vaut sur les autres pages', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })));
    await page.goto('/');
    await page.getByRole('button', { name: 'Thème clair' }).click();
    await page.goto('/blog/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await context.close();
  });
});

test.describe('sans JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('la navigation reste utilisable : menu affiché en clair, bouton et bascule masqués', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await expect(page.locator('#mobile-nav').getByRole('link', { name: 'Compétences' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ouvrir le menu' })).toBeHidden();
    await expect(page.locator('[data-theme-toggle]')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Guillaume');
  });
});

test.describe('navigation et îlots', () => {
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

  test('un clic en dehors du menu le ferme', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
    await page.mouse.click(195, 700); // hors du menu et du bouton
    await expect(page.locator('#mobile-nav')).toBeHidden();
  });

  test('un lien du menu mobile ferme le menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
    await page.locator('#mobile-nav').getByRole('link', { name: 'Compétences' }).click();
    await expect(page.locator('#mobile-nav')).toBeHidden();
  });

  test('le menu bureau surligne la section visible (aria-current)', async ({ page }) => {
    await page.goto('/');
    await page.locator('#skills').scrollIntoViewIfNeeded();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Compétences' }).first()).toHaveAttribute('aria-current', 'location');
  });

  test('sur le blog, le lien Blog est la page courante', async ({ page }) => {
    await page.goto('/blog/');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Blog' }).first()).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('bandeau de cookies', () => {
  test('apparaît en premier dans l\'ordre du clavier, avec des boutons de 44 px', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('consent'));
    await page.goto('/');
    const banner = page.getByRole('region', { name: 'Gestion des cookies' });
    await expect(banner).toBeVisible();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement.closest('.consent'))).toBe(true);
    for (const name of ['Refuser', 'Accepter']) {
      const box = await banner.getByRole('button', { name }).boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(43.5);
    }
  });

  for (const theme of THEMES) {
    test(`accessible (axe) en thème ${theme}`, async ({ page }) => {
      await page.addInitScript(() => localStorage.removeItem('consent'));
      await withTheme(page, theme);
      await page.goto('/');
      await expect(page.locator('.consent')).toBeVisible();
      const results = await new AxeBuilder({ page }).include('.consent').analyze();
      expect(results.violations).toEqual([]);
    });
  }
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
  const ready = (page) => expect.poll(() => page.evaluate(() => !!window.turnstile)).toBe(true);

  test('envoie le message avec le jeton Turnstile, confirme et déplace le focus sur la confirmation', async ({ page }) => {
    await stubTurnstile(page);
    let payload;
    await page.route('**/contact.php', (route) => {
      payload = route.request().postDataJSON();
      return route.fulfill({ json: { success: true, message: 'ok' } });
    });
    await fill(page);
    await ready(page);
    await page.getByRole('button', { name: /Envoyer/ }).click();

    const confirmation = page.getByRole('status').filter({ hasText: 'Message envoyé' });
    await expect(confirmation).toBeVisible();
    await expect(confirmation).toBeFocused();
    expect(payload).toMatchObject({ name: 'Ada Lovelace', email: 'ada@example.org', message: 'Bonjour !', website: '', turnstileToken: 'test-token' });
    await expect(page.getByLabel('Votre message')).toHaveValue('');

    // Un second message reste possible (le widget Turnstile a survécu)
    await page.getByRole('button', { name: 'Envoyer un autre message' }).click();
    await expect(page.getByRole('button', { name: /Envoyer le message/ })).toBeVisible();
  });

  test('un envoi vide affiche une erreur par champ et place le focus sur le premier', async ({ page }) => {
    await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
    let sent = false;
    await page.route('**/contact.php', (route) => {
      sent = true;
      return route.fulfill({ json: {} });
    });
    await page.goto('/');
    await page.locator('#contact-root form').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /Envoyer/ }).click();

    const name = page.getByLabel('Votre nom complet');
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#name-error')).toHaveText('Indiquez votre nom.');
    await expect(page.locator('#email-error')).toContainText('adresse e-mail valide');
    await expect(page.locator('#message-error')).toHaveText('Écrivez votre message.');
    await expect(page.locator('#gdpr-error')).toContainText('accepter');
    expect(sent).toBe(false);

    // L'erreur disparaît dès que le champ est corrigé
    await name.fill('Ada');
    await expect(name).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#name-error')).toHaveCount(0);
  });

  test('refuse une adresse e-mail mal formée', async ({ page }) => {
    await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
    await fill(page);
    await page.getByLabel('Votre adresse email').fill('pas-un-email');
    await page.getByRole('button', { name: /Envoyer/ }).click();
    await expect(page.locator('#email-error')).toBeVisible();
    await expect(page.getByLabel('Votre adresse email')).toBeFocused();
  });

  test('le compteur de caractères suit la saisie', async ({ page }) => {
    await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
    await page.goto('/');
    await page.getByLabel('Votre message').fill('Bonjour');
    await expect(page.locator('#message-counter')).toHaveText('7 / 5000');
  });

  test('429 : message dédié « trop de messages »', async ({ page }) => {
    await stubTurnstile(page);
    await page.route('**/contact.php', (route) => route.fulfill({ status: 429, json: { success: false } }));
    await fill(page);
    await ready(page);
    await page.getByRole('button', { name: /Envoyer/ }).click();
    await expect(page.getByRole('status')).toContainText('Trop de messages');
  });

  test('coupure réseau : message dédié, les champs restent remplis', async ({ page }) => {
    await stubTurnstile(page);
    await page.route('**/contact.php', (route) => route.abort('connectionrefused'));
    await fill(page);
    await ready(page);
    await page.getByRole('button', { name: /Envoyer/ }).click();
    await expect(page.getByRole('status')).toContainText('Connexion impossible');
    await expect(page.getByLabel('Votre message')).toHaveValue('Bonjour !');
  });

  test('pendant l\'envoi : bouton occupé (aria-busy), champs en lecture seule, focus conservé', async ({ page }) => {
    await stubTurnstile(page);
    let release;
    await page.route('**/contact.php', (route) => new Promise((resolve) => (release = () => resolve(route.fulfill({ json: { success: true } })))));
    await fill(page);
    await ready(page);
    const submit = page.getByRole('button', { name: /Envoyer/ });
    await submit.click();
    const busy = page.getByRole('button', { name: /Envoi en cours/ });
    await expect(busy).toHaveAttribute('aria-busy', 'true');
    await expect(busy).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByLabel('Votre message')).toHaveAttribute('readonly', '');
    await expect(busy).toBeFocused();
    release();
    await expect(page.getByRole('status').filter({ hasText: 'Message envoyé' })).toBeVisible();
  });

  test('Turnstile injoignable : message explicite, bouton de nouvelle tentative, aucun envoi', async ({ page }) => {
    await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
    let sent = false;
    await page.route('**/contact.php', (route) => {
      sent = true;
      return route.fulfill({ json: {} });
    });
    await fill(page);
    await expect(page.getByRole('status')).toContainText('vérification anti-robot');
    await expect(page.getByRole('button', { name: 'Recharger la vérification' })).toBeVisible();
    await page.getByRole('button', { name: /Envoyer/ }).click();
    expect(sent).toBe(false);
  });

  test('un squelette occupe la place du widget pendant son chargement', async ({ page }) => {
    // Le script Turnstile ne répond jamais : le squelette reste affiché
    await page.route('https://challenges.cloudflare.com/**', () => {});
    await page.goto('/');
    await page.locator('#contact-root form').scrollIntoViewIfNeeded();
    await expect(page.getByRole('img', { name: /Chargement de la vérification/ })).toBeVisible();
  });

  test('la région live garde le même rôle d\'un message à l\'autre', async ({ page }) => {
    await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
    await fill(page);
    const live = page.locator('#contact-root form [aria-live="polite"][role="status"]');
    await expect(live).toHaveCount(1);
    await page.getByRole('button', { name: /Envoyer/ }).click();
    await expect(live).toHaveCount(1);
  });
});

test.describe('états vides', () => {
  test('les pages du blog affichent les articles (pas d\'état vide quand il y en a)', async ({ page }) => {
    await page.goto('/blog/');
    await expect(page.locator('main article')).not.toHaveCount(0);
    await expect(page.getByText('Les premiers articles arrivent')).toHaveCount(0);
  });
});

test.describe('contenu produit (dist/)', () => {
  test('le manifeste Vite est supprimé après le pré-rendu', () => {
    expect(existsSync('dist/.vite')).toBe(false);
  });

  test("le code de l'outil DNS est dans son propre fichier, absent du bundle d'entrée", () => {
    const files = readdirSync('dist/assets').filter((f) => f.endsWith('.js'));
    const dns = files.find((f) => /^dns-.*.js$/.test(f));
    expect(dns, 'chunk dns-*.js').toBeTruthy();
    const entry = files.find((f) => /^index-.*.js$/.test(f));
    expect(readFileSync('dist/assets/' + entry, 'utf-8')).not.toContain('cloudflare-dns.com');
    expect(readFileSync('dist/assets/' + dns, 'utf-8')).toContain('cloudflare-dns.com');
  });

  test('theme.js est chargé dans le <head> sans defer ; nav.js et fx.js en fin de page', async ({ request }) => {
    const html = await (await request.get('/')).text();
    const head = html.slice(0, html.indexOf('</head>'));
    expect(head).toMatch(/<script src="\/js\/theme\.js\?v=[0-9a-f]+"><\/script>/);
    expect(html).toMatch(/<script defer src="\/js\/nav\.js\?v=/);
    expect(html).toMatch(/<script defer src="\/js\/fx\.js\?v=/);
  });

  test('le flux RSS est un XML valide avec un item par article, dans les deux langues', async ({ page, request }) => {
    for (const [path, count] of [['/rss.xml', 7], ['/en/rss.xml', 7]]) {
      const xml = await (await request.get(path)).text();
      const result = await page.evaluate((text) => {
        const doc = new DOMParser().parseFromString(text, 'application/xml');
        return { error: doc.querySelector('parsererror')?.textContent ?? null, items: doc.querySelectorAll('item').length, rss: doc.documentElement.tagName };
      }, xml);
      expect(result, path).toEqual({ error: null, items: count, rss: 'rss' });
    }
  });

  test('les pages du blog déclarent leur flux RSS et leur image de partage propre', async ({ page, request }) => {
    await page.goto('/blog/spf-dkim-dmarc-expliques/');
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute('href', 'https://grichard.eu/rss.xml');
    const image = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(image).toBe('https://grichard.eu/og/spf-dkim-dmarc-expliques.png');
    const png = await request.get('/og/spf-dkim-dmarc-expliques.png');
    expect(png.headers()['content-type']).toBe('image/png');
    expect((await png.body()).length).toBeGreaterThan(10_000);
    await page.goto('/en/');
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute('href', 'https://grichard.eu/en/rss.xml');
  });

  test('les PDF des CV sont présents dans dist/', () => {
    for (const file of ['CV_Guillaume_Richard_FR.pdf', 'Resume_Guillaume_Richard_EN.pdf']) {
      expect(existsSync('dist/' + file), file).toBe(true);
      expect(readFileSync('dist/' + file).subarray(0, 5).toString()).toBe('%PDF-');
    }
  });

  test('le sitemap liste les pages et les articles', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    for (const loc of ['/', '/en/', '/blog/', '/en/blog/', '/mentions-legales/', '/blog/spf-dkim-dmarc-expliques/']) {
      expect(xml).toContain(`<loc>https://grichard.eu${loc}</loc>`);
    }
    expect(xml).not.toContain('xhtml');
  });
});
