import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mailZone, rsaKey, stubDoh } from './helpers/doh.js';

const analyse = async (page, domain, selector) => {
  await page.getByLabel(/Domaine à analyser|Domain to analyse/).fill(domain);
  if (selector) await page.getByLabel(/Sélecteur DKIM|DKIM selector/).fill(selector);
  await page.getByRole('button', { name: /^Analyser|^Analyse$/ }).click();
};
// Constat « li » d'une section (le titre de la section répète le premier constat : on cible la liste)
const finding = (section, text) => section.locator('li', { hasText: text }).first();
const sectionOf = (page, id) => page.locator('details.check', { has: page.locator(`#check-${id}`) });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })));
});

test.describe('page de l\'outil DNS', () => {
  test('affiche le titre, l\'explication et le formulaire sans exécuter d\'analyse', async ({ page }) => {
    await page.goto('/outils/dns/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('DNS Lookup');
    await expect(page.getByRole('heading', { name: "Ce que l'outil vérifie" })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Analyser' })).toBeVisible();
    await expect(page.locator('details.check')).toHaveCount(0);
  });

  test('a ses métadonnées, son JSON-LD et sa version anglaise liée', async ({ page }) => {
    await page.goto('/outils/dns/');
    await expect(page).toHaveTitle(/DNS Lookup/);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://grichard.eu/en/tools/dns/');
    const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    expect(ld['@graph'].map((n) => n['@type'])).toEqual(['WebApplication', 'BreadcrumbList', 'FAQPage']);
    await page.getByRole('banner').getByRole('link', { name: 'Read this site in English' }).click();
    await expect(page).toHaveURL(/\/en\/tools\/dns\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('DNS Lookup');
  });

  test('est référencée dans le menu et le plan du site', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Outils' })).toHaveAttribute('href', '/outils/');
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('<loc>https://grichard.eu/outils/dns/</loc>');
    expect(xml).toContain('<loc>https://grichard.eu/en/tools/dns/</loc>');
  });

  test('ne charge le code de l\'outil que sur sa page', async ({ page }) => {
    const loaded = [];
    page.on('request', (r) => r.url().includes('/assets/') && loaded.push(r.url()));
    await page.goto('/blog/');
    expect(loaded.filter((u) => u.endsWith('.js'))).toEqual([]);
    loaded.length = 0;
    await page.goto('/');
    expect(loaded.some((u) => /\/dns-/.test(u))).toBe(false);
    loaded.length = 0;
    await page.goto('/outils/dns/');
    await expect.poll(() => loaded.some((u) => /\/dns-.*\.js$/.test(u))).toBe(true);
  });
});

test.describe('analyse', () => {
  test('un domaine en bonne santé : synthèse, sections, focus sur le résultat et annonce', async ({ page }) => {
    await stubDoh(page, mailZone());
    await page.goto('/outils/dns/');
    await analyse(page, 'example.fr');

    const heading = page.getByRole('heading', { name: 'Résultats pour example.fr' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    await expect(page.getByRole('status').filter({ hasText: 'Analyse terminée' })).toHaveCount(1);
    await expect(page.getByText('Google Workspace').first()).toBeVisible();
    await expect(page.getByText('Doublons', { exact: true })).toHaveCount(0); // rien à signaler : pas de bloc vide
    for (const id of ['mx', 'spf', 'dkim', 'dmarc', 'addresses', 'dnssec']) await expect(page.locator(`#check-${id}`)).toBeVisible();
    expect(page.url()).toContain('?d=example.fr');
  });

  test('liste d\'abord ce qu\'il faut corriger, et la vue d\'ensemble déplie la vérification choisie', async ({ page }) => {
    const zone = mailZone();
    zone['example.fr'].TXT = ['v=spf1 -all', 'v=spf1 mx -all'];
    await stubDoh(page, zone);
    await page.goto('/outils/dns/');
    await analyse(page, 'example.fr');
    await page.getByRole('heading', { name: 'Résultats pour example.fr' }).waitFor();

    const fixFirst = page.getByRole('heading', { name: 'À corriger en priorité' }).locator('xpath=..');
    await expect(fixFirst.locator('li').filter({ hasText: /SPF/ }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Tout replier' }).click();
    const spf = sectionOf(page, 'spf');
    await expect(spf).not.toHaveAttribute('open', '');
    await page.getByRole('navigation', { name: 'Vue d\'ensemble' }).getByRole('button', { name: /SPF/ }).click();
    await expect(spf).toHaveAttribute('open', '');
    await expect(spf.locator(':scope > summary')).toBeFocused();
  });

  test('sans erreur ni avertissement, le rapport le dit', async ({ page }) => {
    await stubDoh(page, mailZone());
    await page.goto('/outils/dns/');
    await analyse(page, 'example.fr');
    await page.getByRole('heading', { name: 'Résultats pour example.fr' }).waitFor();
    const fixFirst = page.getByRole('heading', { name: 'À corriger en priorité' }).locator('xpath=..');
    const nbToFix = await fixFirst.locator('li').count();
    if (nbToFix === 0) await expect(fixFirst).toContainText('Rien à corriger');
  });

  test('devine le sélecteur DKIM d\'après le fournisseur (Google : google)', async ({ page }) => {
    const log = await stubDoh(page, mailZone());
    await page.goto('/outils/dns/');
    await analyse(page, 'example.fr');
    await page.getByRole('heading', { name: 'Résultats pour example.fr' }).waitFor();
    const dkim = sectionOf(page, 'dkim');
    await dkim.locator(':scope > summary').click();
    await expect(finding(dkim, 'Sélecteurs trouvés par déduction')).toBeVisible();
    await expect(dkim.getByText(/google/).first()).toBeVisible();
    expect(log).toContain('google._domainkey.example.fr TXT');
  });

  test('devine ovhmo-selector-1 et ovhmo-selector-2 pour OVH, et selector1/2 pour Microsoft 365', async ({ page }) => {
    const zone = mailZone('ovh.test');
    zone['ovh.test'].MX = ['1 mx1.mail.ovh.net.'];
    zone['ovh.test'].TXT = ['v=spf1 include:mx.ovh.com ~all'];
    zone['mx1.mail.ovh.net'] = { A: ['93.184.216.50'] };
    zone['mx.ovh.com'] = { TXT: ['v=spf1 ip4:93.184.216.0/24 ~all'] };
    delete zone['google._domainkey.ovh.test'];
    zone['ovhmo-selector-1._domainkey.ovh.test'] = { TXT: [`v=DKIM1; k=rsa; p=${rsaKey(2048)}`] };
    const log = await stubDoh(page, zone);
    await page.goto('/outils/dns/');
    await analyse(page, 'ovh.test');
    await page.getByRole('heading', { name: 'Résultats pour ovh.test' }).waitFor();
    expect(log).toContain('ovhmo-selector-1._domainkey.ovh.test TXT');
    expect(log).toContain('ovhmo-selector-2._domainkey.ovh.test TXT');
    const dkim = sectionOf(page, 'dkim');
    await dkim.locator(':scope > summary').click();
    await expect(dkim.getByText('ovhmo-selector-1').first()).toBeVisible();

    const ms = mailZone('ms.test');
    ms['ms.test'].MX = ['0 ms-test.mail.protection.outlook.com.'];
    ms['ms.test'].TXT = ['v=spf1 include:spf.protection.outlook.com -all'];
    ms['ms-test.mail.protection.outlook.com'] = { A: ['93.184.216.60'] };
    ms['spf.protection.outlook.com'] = { TXT: ['v=spf1 ip4:93.184.216.0/24 -all'] };
    log.length = 0;
    await page.unrouteAll();
    await stubDoh(page, ms, { log });
    await page.goto('/outils/dns/?d=ms.test');
    await page.getByRole('heading', { name: 'Résultats pour ms.test' }).waitFor();
    expect(log).toContain('selector1._domainkey.ms.test TXT');
    expect(log).toContain('selector2._domainkey.ms.test TXT');
  });

  test('un sélecteur nommé est le seul testé ; absent, c\'est une erreur', async ({ page }) => {
    const log = await stubDoh(page, mailZone());
    await page.goto('/outils/dns/');
    await analyse(page, 'example.fr', 'inconnu');
    await page.getByRole('heading', { name: 'Résultats pour example.fr' }).waitFor();
    expect(log.filter((l) => l.includes('._domainkey.'))).toEqual(['inconnu._domainkey.example.fr TXT']);
    const dkim = sectionOf(page, 'dkim');
    await expect(dkim).toHaveAttribute('open', '');
    await expect(finding(dkim, 'Sélecteur introuvable')).toBeVisible();
  });

  test('signale les doublons SPF, DMARC, MX et TXT, et les erreurs SPF', async ({ page }) => {
    const zone = mailZone();
    zone['example.fr'].TXT = ['v=spf1 -all', 'v=spf1 mx -all', 'dupli', 'dupli'];
    zone['example.fr'].MX = ['1 aspmx.l.google.com.', '5 aspmx.l.google.com.'];
    zone['_dmarc.example.fr'] = { TXT: ['v=DMARC1; p=none', 'v=DMARC1; p=reject'] };
    await stubDoh(page, zone);
    await page.goto('/outils/dns/');
    await analyse(page, 'example.fr');
    await page.getByRole('heading', { name: 'Résultats pour example.fr' }).waitFor();
    const duplicates = page.getByText('Doublons', { exact: true }).locator('..');
    await expect(duplicates.getByText('Plusieurs enregistrements SPF')).toBeVisible();
    await expect(duplicates.getByText('Plusieurs enregistrements DMARC')).toBeVisible();
    await expect(duplicates.getByText('Hôte MX en double')).toBeVisible();
    await expect(duplicates.getByText('TXT en double')).toBeVisible();
  });

  test('décompte les requêtes SPF et valide la syntaxe', async ({ page }) => {
    const zone = mailZone();
    zone['example.fr'].TXT = ['v=spf1 include:_spf.google.com ip4:300.1.1.1 ptr +all'];
    await stubDoh(page, zone);
    await page.goto('/outils/dns/');
    await analyse(page, 'example.fr');
    await page.getByRole('heading', { name: 'Résultats pour example.fr' }).waitFor();
    const spf = sectionOf(page, 'spf');
    await expect(spf).toHaveAttribute('open', '');
    await expect(finding(spf, 'Adresse IP invalide')).toBeVisible();
    await expect(finding(spf, 'Mécanisme ptr déprécié')).toBeVisible();
    await expect(spf.getByText(/« \+all » : tout le monde est autorisé/)).toBeVisible();
    await expect(spf.getByText(/requêtes DNS sur 10 autorisées/)).toBeVisible();
  });

  test('un domaine inexistant est signalé', async ({ page }) => {
    await stubDoh(page, {});
    await page.goto('/outils/dns/');
    await analyse(page, 'absent.test');
    await expect(page.getByText("Le domaine n'existe pas")).toBeVisible();
  });

  test('accepte une URL ou une adresse e-mail et refuse le reste', async ({ page }) => {
    await stubDoh(page, mailZone());
    await page.goto('/outils/dns/');
    await analyse(page, 'https://www.example.fr/page');
    await expect(page.getByRole('heading', { name: 'Résultats pour www.example.fr' })).toBeVisible();

    await page.getByLabel('Domaine à analyser').fill('192.168.0.1');
    await page.getByRole('button', { name: 'Analyser' }).click();
    await expect(page.getByText(/adresse IP n'est pas un domaine/)).toBeVisible();
    await expect(page.getByLabel('Domaine à analyser')).toHaveAttribute('aria-invalid', 'true');

    await page.getByLabel('Domaine à analyser').fill('pas un domaine');
    await page.getByRole('button', { name: 'Analyser' }).click();
    await expect(page.getByText(/valide|valid/).first()).toBeVisible();
  });

  test('un lien partagé relance l\'analyse', async ({ page }) => {
    await stubDoh(page, mailZone());
    await page.goto('/outils/dns/?d=example.fr&s=google');
    await expect(page.getByRole('heading', { name: 'Résultats pour example.fr' })).toBeVisible();
    await expect(page.getByLabel('Domaine à analyser')).toHaveValue('example.fr');
    await expect(page.getByLabel(/Sélecteur DKIM/)).toHaveValue('google');
  });

  test('bascule sur Google si Cloudflare est en panne', async ({ page }) => {
    const log = await stubDoh(page, mailZone(), { cloudflareDown: true });
    await page.goto('/outils/dns/');
    await analyse(page, 'example.fr');
    await expect(page.getByRole('heading', { name: 'Résultats pour example.fr' })).toBeVisible();
    expect(log.length).toBeGreaterThan(10); // toutes les requêtes ont été servies par le second résolveur
  });

  test("signale clairement l'échec quand aucun résolveur ne répond", async ({ page }) => {
    await page.route('https://cloudflare-dns.com/**', (route) => route.abort());
    await page.route('https://dns.google/**', (route) => route.abort());
    await page.goto('/outils/dns/');
    await analyse(page, 'example.fr');
    await expect(page.getByRole('alert')).toContainText('injoignables');
    await expect(page.getByRole('button', { name: 'Analyser' })).toBeEnabled();
  });

  test('plier et déplier tout, copier le rapport et le lien', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await stubDoh(page, mailZone());
    await page.goto('/outils/dns/');
    await analyse(page, 'example.fr');
    await page.getByRole('heading', { name: 'Résultats pour example.fr' }).waitFor();

    await page.getByRole('button', { name: 'Tout déplier' }).click();
    await expect(page.locator('details.check[open]')).toHaveCount(13);
    await page.getByRole('button', { name: 'Tout replier' }).click();
    await expect(page.locator('details.check[open]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Copier le rapport' }).click();
    const report = await page.evaluate(() => navigator.clipboard.readText());
    expect(report).toContain('# Résultats pour example.fr');
    expect(report).toContain('## ✅ SPF');
    await page.getByRole('button', { name: 'Copier le lien' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('?d=example.fr');
  });

  test('la version anglaise analyse et affiche ses textes', async ({ page }) => {
    await stubDoh(page, mailZone());
    await page.goto('/en/tools/dns/');
    await analyse(page, 'example.fr');
    await expect(page.getByRole('heading', { name: 'Results for example.fr' })).toBeVisible();
    await expect(page.getByText('Duplicates', { exact: true })).toHaveCount(0);
  });
});

test.describe('accessibilité de l\'outil', () => {
  for (const theme of ['dark', 'light']) {
    test(`le rapport complet respecte WCAG AA (axe, thème ${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
      const zone = mailZone();
      zone['example.fr'].TXT = ['v=spf1 include:_spf.google.com ptr ~all', 'v=spf1 -all', 'dupli', 'dupli'];
      zone['_dmarc.example.fr'] = { TXT: ['v=DMARC1; p=none; rua=mailto:a@tiers.test'] };
      await stubDoh(page, zone, { ad: false });
      await page.goto('/outils/dns/');
      await analyse(page, 'example.fr');
      await page.getByRole('heading', { name: 'Résultats pour example.fr' }).waitFor();
      await page.getByRole('button', { name: 'Tout déplier' }).click();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }

  test('aucun scroll horizontal à 320 px avec un rapport ouvert', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await stubDoh(page, mailZone());
    await page.goto('/outils/dns/');
    await analyse(page, 'example.fr');
    await page.getByRole('heading', { name: 'Résultats pour example.fr' }).waitFor();
    await page.getByRole('button', { name: 'Tout déplier' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test('les boutons et résumés du rapport font au moins 44 px sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await stubDoh(page, mailZone());
    await page.goto('/outils/dns/');
    await analyse(page, 'example.fr');
    await page.getByRole('heading', { name: 'Résultats pour example.fr' }).waitFor();
    await page.getByRole('button', { name: 'Tout déplier' }).click();
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('#tool-root button, #tool-root summary')]
        .filter((el) => getComputedStyle(el).display !== 'inline' && el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().height < 43.5)
        .map((el) => `${el.tagName} "${(el.getAttribute('aria-label') || el.textContent).trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().height)}`),
    );
    expect(small).toEqual([]);
  });
});
