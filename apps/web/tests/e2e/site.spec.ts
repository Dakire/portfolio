import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Une page de chaque famille, dans les deux langues.
const PAGES = [
  '/',
  '/en/',
  '/a-propos/',
  '/en/about/',
  '/competences/',
  '/projets/',
  '/projets/homelab-proxmox/',
  '/projets/migrations-messagerie/',
  '/parcours/',
  '/ressources/',
  '/cheatsheets/',
  '/contact/',
  '/en/skills/',
  '/en/projects/',
  '/en/projects/homelab-proxmox/',
  '/en/career/',
  '/en/resources/',
  '/en/contact/',
  '/blog/',
  '/en/blog/',
  '/blog/spf-dkim-dmarc-expliques/',
  '/cheatsheets/bios-uefi/',
  '/en/cheatsheets/',
  '/en/cheatsheets/bios-uefi-keys/',
  '/en/blog/spf-dkim-dmarc-explained/',
  '/blog/categorie/dns/',
  '/outils/',
  '/en/tools/',
  '/outils/dns/',
  '/outils/propagation-dns/',
  '/outils/ics-decouper/',
  '/outils/ics-comparer/',
  '/outils/en-tetes-email/',
  '/outils/calculateur-reseau/',
  '/outils/encodeur-decodeur/',
  '/outils/generateur-mot-de-passe/',
  '/outils/formateur-json/',
  '/en/tools/dns/',
  '/en/tools/dns-propagation/',
  '/en/tools/ics-splitter/',
  '/en/tools/ics-compare/',
  '/en/tools/email-headers/',
  '/en/tools/subnet-calculator/',
  '/en/tools/encoder-decoder/',
  '/en/tools/password-generator/',
  '/en/tools/json-formatter/',
  '/outils/convertisseur-unites/',
  '/en/tools/unit-converter/',
  '/outils/seo/',
  '/en/tools/seo/',
  '/outils/sitemap/',
  '/en/tools/sitemap/',
  '/mentions-legales/',
  '/confidentialite/',
  '/en/privacy/',
  '/accessibilite/',
  '/en/accessibility/',
  '/404.html',
  '/design/',
];

for (const theme of ['dark', 'light'] as const) {
  for (const path of PAGES) {
    test(`WCAG 2.2 AA : ${path} (thème ${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        results.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
        ),
      ).toEqual([]);
    });
  }
}

test('le bandeau de consentement est accessible et atteint en premier au clavier', async ({
  page,
}) => {
  await page.goto('/');
  const banner = page.getByRole('region', { name: 'Gestion des cookies' });
  await expect(banner).toBeVisible();
  await page.keyboard.press('Tab'); // le bandeau précède tout le reste de la page : son lien d'information est atteint en premier
  await expect(banner.getByRole('link')).toBeFocused();
  const results = await new AxeBuilder({ page }).include('.consent').analyze();
  expect(results.violations).toEqual([]);
});

test('refuser mémorise le choix sans charger Google Analytics', async ({ page }) => {
  const google: string[] = [];
  page.on(
    'request',
    (r) => /googletagmanager|google-analytics/.test(r.url()) && google.push(r.url()),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Refuser' }).click();
  await expect(page.locator('.consent')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.consent')).toHaveCount(0);
  expect(google).toEqual([]);
});

test('le sélecteur de langue mène à la page équivalente', async ({ page }) => {
  await page.goto('/blog/spf-dkim-dmarc-expliques/');
  await page.getByRole('link', { name: 'English', exact: true }).first().click();
  await expect(page).toHaveURL(/\/en\/blog\/spf-dkim-dmarc-explained\/$/);
});

test('le sélecteur de thème change et mémorise le choix', async ({ page }) => {
  await page.goto('/');
  const group = page.getByRole('group', { name: 'Thème' });
  await group.getByRole('button', { name: 'clair' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await group.getByRole('button', { name: 'auto' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark'); // le système simulé est sombre
});

test('les touches BIOS/UEFI : la recherche trouve un constructeur sans entrée vide', async ({
  page,
}) => {
  await page.goto('/cheatsheets/bios-uefi/');
  await page.getByRole('searchbox').fill('thinkpad');
  const first = page.locator('[data-ref-results] > li > article').first();
  await expect(first).toContainText('Lenovo');
  await expect(first).toContainText('Menu de démarrage');
});

test('sans JavaScript, le contenu reste lisible', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'light' });
  const page = await context.newPage();
  await page.goto('http://localhost:4321/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-theme-switch]')).toBeHidden();
  await context.close();
});

test('aucun défilement horizontal de 320 à 1440 px', async ({ page }) => {
  for (const path of ['/', '/cheatsheets/bios-uefi/', '/blog/spf-dkim-dmarc-expliques/']) {
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} à ${width}px`).toBeLessThanOrEqual(0);
    }
  }
});

test("le lien d'évitement est le premier élément atteint au clavier et mène au contenu", async ({
  page,
}) => {
  // Choix de cookies déjà fait : sinon le bandeau, inséré en tête de page, est atteint avant le lien d'évitement (voulu).
  await page.addInitScript(() =>
    localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })),
  );
  await page.goto('/blog/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Aller au contenu' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#contenu')).toBeFocused();
});

test.describe('menu de navigation sur petit écran', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('le bouton Contact reste visible sans ouvrir le menu', async ({ page }) => {
    await page.goto('/projets/');
    const contact = page.getByRole('banner').getByRole('link', { name: 'Contact' });
    await expect(contact).toBeVisible();
    await contact.click();
    await expect(page).toHaveURL(/\/contact\/$/);
  });

  test('le bouton Menu déplie la navigation ; Échap la replie et rend le focus', async ({
    page,
  }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Menu' });
    const nav = page.getByRole('navigation', { name: 'Navigation principale' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();
    await nav.getByRole('link', { name: 'Réalisations' }).focus();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await expect(nav).toBeHidden();
  });

  test('sans JavaScript, la navigation reste visible et le bouton est absent', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();
    await page.goto('http://localhost:4321/');
    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
    await expect(page.locator('[data-nav-toggle]')).toBeHidden();
    await context.close();
  });
});

test('le bandeau de consentement ne décale pas la page (CLS) et ne masque pas la fin de page', async ({
  page,
}) => {
  // Position du contenu avec le bandeau, puis sans (choix déjà fait) : elle doit être identique.
  await page.goto('/');
  await expect(page.locator('.consent')).toBeVisible();
  const mainTop = () =>
    page.locator('#contenu').evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const withBanner = await mainTop();
  await expect(page.locator('.consent')).toHaveCSS('position', 'fixed');

  const footerLink = page.getByRole('button', { name: 'Gérer les cookies' });
  await footerLink.scrollIntoViewIfNeeded();
  const banner = await page.locator('.consent').boundingBox();
  const link = await footerLink.boundingBox();
  expect(link!.y + link!.height).toBeLessThanOrEqual(banner!.y);

  await page.getByRole('button', { name: 'Refuser' }).click();
  await page.reload();
  await expect(page.locator('.consent')).toHaveCount(0);
  expect(await mainTop()).toBe(withBanner);
});

test('la navigation principale : cinq entrées, Contact en bouton, page courante signalée', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/competences/');
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  await expect(nav.getByRole('link')).toHaveText([
    'À propos',
    'Parcours',
    'Compétences',
    'Réalisations',
    'Ressources',
  ]);
  await expect(nav.getByRole('link', { name: 'Compétences' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('banner').getByRole('link', { name: 'Contact' })).toBeVisible();
});

test('la section Ressources a sa sous-navigation et allume « Ressources » dans le menu', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/blog/spf-dkim-dmarc-expliques/');
  const sub = page.getByRole('navigation', { name: 'Ressources', exact: true });
  await expect(sub.getByRole('link')).toHaveText(['Ressources', 'Blog', 'Outils', 'Cheatsheets']);
  await expect(sub.getByRole('link', { name: 'Blog' })).toHaveAttribute('aria-current', 'true');
  await expect(
    page
      .getByRole('navigation', { name: 'Navigation principale' })
      .getByRole('link', { name: 'Ressources' }),
  ).toHaveAttribute('aria-current', 'true');
});

test("chaque page a un fil d'Ariane et le détail d'une réalisation renvoie vers sa liste", async ({
  page,
}) => {
  await page.goto('/projets/homelab-proxmox/');
  const crumbs = page.getByRole('navigation', { name: "Fil d'Ariane" });
  await expect(crumbs.getByRole('link')).toHaveText(['Accueil', 'Réalisations']);
  await expect(crumbs.locator('[aria-current="page"]')).toContainText('Homelab');
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(ld).toContain('BreadcrumbList');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});

test('le pied de page est structuré et donne accès aux deux CV', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  for (const name of ['Profil', 'Ressources', 'Contact'])
    await expect(footer.getByRole('heading', { name })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'CV en français (PDF)' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Resume in English (PDF)' })).toBeVisible();
});

test('au survol de « Ressources », le menu mène directement aux outils ; Échap le ferme', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  const dns = nav.getByRole('link', { name: 'DNS Lookup' });
  await expect(dns).toBeHidden();
  await nav.getByRole('link', { name: 'Ressources', exact: true }).hover();
  await expect(dns).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Calculatrice réseau' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dns).toBeHidden();
});

test('le menu « Ressources » s’ouvre aussi au clavier', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  await nav.getByRole('link', { name: 'Ressources', exact: true }).focus();
  await expect(nav.getByRole('link', { name: 'DNS Lookup' })).toBeVisible();
});
