import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { stubResolvers } from './helpers/propagation.js';

const NEW = ['192.0.2.10'];
const OLD = ['192.0.2.1'];
const zone = (values = NEW) => ({ 'example.fr': { A: values, MX: ['10 mail.example.fr.'], TXT: ['v=spf1 -all'] } });

const check = async (page, { domain = 'example.fr', type, expected } = {}) => {
  await page.getByLabel(/Nom à vérifier|Name to check/).fill(domain);
  if (type) await page.getByLabel(/Type d'enregistrement|Record type/).selectOption(type);
  if (expected) await page.getByLabel(/Valeur attendue|Expected value/).fill(expected);
  await page.getByRole('button', { name: /^Vérifier$|^Check$/ }).click();
};
// Les phrases du verdict sont aussi lues par la zone d'annonce (role=status, invisible) : on ne cible que le paragraphe affiché
const says = (page, text) => page.locator('p', { hasText: text }).first();

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })));
});

test.describe('page de la propagation DNS', () => {
  test('affiche le titre et le formulaire sans lancer de vérification', async ({ page }) => {
    await page.goto('/outils/propagation-dns/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Propagation DNS');
    await expect(page.getByLabel('Nom à vérifier')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Résultats pour/ })).toHaveCount(0);
  });

  test('a ses métadonnées, sa version anglaise liée et figure dans la page Outils', async ({ page }) => {
    await page.goto('/outils/propagation-dns/');
    await expect(page).toHaveTitle(/Propagation DNS/);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://grichard.eu/en/tools/dns-propagation/');
    await page.goto('/outils/');
    await expect(page.getByRole('link', { name: /Propagation DNS/ }).first()).toHaveAttribute('href', '/outils/propagation-dns/');
  });
});

test.describe('vérification', () => {
  test('même réponse partout : verdict, neuf lignes, focus sur le résultat et annonce', async ({ page }) => {
    await stubResolvers(page, zone());
    await page.goto('/outils/propagation-dns/');
    await check(page);

    const heading = page.getByRole('heading', { name: 'Résultats pour example.fr (A)' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    await expect(says(page, 'Même réponse sur 9 résolveurs.')).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Même réponse' })).toHaveCount(1);
    for (const name of ['Cloudflare', 'Google', 'Quad9', 'DNS.SB', 'DNSForge', 'CZ.NIC ODVR', 'Control D', 'IIJ', 'AliDNS']) await expect(page.getByText(name, { exact: true })).toBeVisible();
    await expect(page.getByText('192.0.2.10', { exact: true })).toHaveCount(9);
    expect(page.url()).toContain('?d=example.fr&t=A');
  });

  test('valeur attendue : indique combien de résolveurs ont déjà le changement', async ({ page }) => {
    await stubResolvers(page, zone(NEW), { overrides: { quad9: zone(OLD), alidns: zone(OLD) } });
    await page.goto('/outils/propagation-dns/');
    await check(page, { expected: '192.0.2.10' });

    await expect(says(page, 'En cours : 7 résolveurs sur 9 renvoient la valeur attendue.')).toBeVisible();
    await expect(page.getByText("Un résolveur garde l'ancienne valeur")).toBeVisible();
    await expect(page.locator('li span', { hasText: /^Valeur attendue$/ })).toHaveCount(7);
    await expect(page.locator('li span', { hasText: /^Différent$/ })).toHaveCount(2);
    expect(page.url()).toContain('e=192.0.2.10');
  });

  test('propagé quand tous les résolveurs ont la valeur attendue', async ({ page }) => {
    await stubResolvers(page, zone(NEW));
    await page.goto('/outils/propagation-dns/');
    await check(page, { expected: '192.0.2.10' });
    await expect(says(page, 'Propagé : 9 résolveurs renvoient la valeur attendue.')).toBeVisible();
  });

  test('réponses différentes sans valeur attendue : repère la minorité', async ({ page }) => {
    await stubResolvers(page, zone(NEW), { overrides: { iij: zone(OLD) } });
    await page.goto('/outils/propagation-dns/');
    await check(page);
    await expect(says(page, 'Réponses différentes : 2 variantes sur 9 résolveurs.')).toBeVisible();
    await expect(page.getByText('Normal si le domaine répartit sa charge')).toBeVisible(); // adresses A : divergence fréquente
    await expect(page.getByText('Majoritaire', { exact: true })).toHaveCount(8);
    await expect(page.getByText('Différent', { exact: true })).toHaveCount(1);
  });

  test('un résolveur en panne est signalé et ne fausse pas le verdict', async ({ page }) => {
    await stubResolvers(page, zone(NEW), { overrides: { iij: 'down', dnssb: 'down' } });
    await page.goto('/outils/propagation-dns/');
    await check(page, { expected: '192.0.2.10' });
    await expect(says(page, 'Propagé : 7 résolveurs renvoient la valeur attendue.')).toBeVisible();
    await expect(page.getByText('2 résolveurs n\'ont pas répondu')).toBeVisible();
    await expect(page.getByText('Sans réponse', { exact: true })).toHaveCount(2);
    await expect(page.getByText('Injoignable')).toHaveCount(2);
  });

  test('lit les enregistrements MX et TXT, et accepte la priorité MX en option', async ({ page }) => {
    await stubResolvers(page, zone());
    await page.goto('/outils/propagation-dns/');
    await check(page, { type: 'MX', expected: 'mail.example.fr' });
    await expect(page.getByText('10 mail.example.fr', { exact: true })).toHaveCount(9);
    await expect(says(page, 'Propagé : 9 résolveurs renvoient la valeur attendue.')).toBeVisible();

    await page.getByLabel('Type d\'enregistrement').selectOption('TXT');
    await page.getByLabel(/Valeur attendue/).fill('v=spf1 -all');
    await page.getByRole('button', { name: /^Vérifier$/ }).click();
    await expect(page.getByRole('heading', { name: 'Résultats pour example.fr (TXT)' })).toBeVisible();
    await expect(says(page, 'Propagé : 9 résolveurs renvoient la valeur attendue.')).toBeVisible();
  });

  test('un nom inexistant et une absence d\'enregistrement sont distingués', async ({ page }) => {
    await stubResolvers(page, zone());
    await page.goto('/outils/propagation-dns/');
    await check(page, { domain: 'absent.example.fr' });
    await expect(page.getByText('Domaine inexistant')).toHaveCount(9);
    await check(page, { type: 'AAAA' });
    await expect(page.getByText('Aucun enregistrement')).toHaveCount(9);
  });

  test('refuse une saisie invalide', async ({ page }) => {
    await page.goto('/outils/propagation-dns/');
    await check(page, { domain: '192.0.2.1' });
    await expect(page.getByText("Une adresse IP n'est pas un nom")).toBeVisible();
    await check(page, { domain: '' });
    await expect(page.getByText('Indiquez un nom de domaine.')).toBeVisible();
  });

  test('un lien partagé relance la vérification', async ({ page }) => {
    const log = await stubResolvers(page, zone());
    await page.goto('/outils/propagation-dns/?d=example.fr&t=MX&e=mail.example.fr');
    await expect(page.getByRole('heading', { name: 'Résultats pour example.fr (MX)' })).toBeVisible();
    await expect(page.getByLabel('Nom à vérifier')).toHaveValue('example.fr');
    await expect(page.getByLabel(/Valeur attendue/)).toHaveValue('mail.example.fr');
    await expect(says(page, 'Propagé : 9 résolveurs')).toBeVisible();
    expect(log.filter((l) => l.endsWith('example.fr MX'))).toHaveLength(9);
  });

  test('la relance automatique repasse toutes les 30 s et suit la propagation', async ({ page }) => {
    await page.clock.install();
    const current = zone(OLD);
    await stubResolvers(page, current, { overrides: {} });
    await page.goto('/outils/propagation-dns/');
    await check(page, { expected: '192.0.2.10' });
    await expect(says(page, 'Pas encore : aucun résolveur ne renvoie la valeur attendue.')).toBeVisible();

    await page.getByLabel('Relancer toutes les 30 s').check();
    current['example.fr'].A = NEW; // le DNS a changé entre-temps
    await page.clock.fastForward(31_000);
    await expect(says(page, 'Propagé : 9 résolveurs renvoient la valeur attendue.')).toBeVisible();
  });

  test('la version anglaise vérifie et affiche ses textes', async ({ page }) => {
    await stubResolvers(page, zone(NEW), { overrides: { quad9: zone(OLD) } });
    await page.goto('/en/tools/dns-propagation/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('DNS Propagation');
    await check(page, { expected: '192.0.2.10' });
    await expect(page.getByRole('heading', { name: 'Results for example.fr (A)' })).toBeVisible();
    await expect(says(page, 'In progress: 8 of 9 resolvers return the expected value.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Analyse the domain in detail' })).toHaveAttribute('href', '/en/tools/dns/?d=example.fr');
  });
});

test.describe('accessibilité de la propagation', () => {
  for (const theme of ['dark', 'light']) {
    test(`le résultat respecte WCAG AA (axe, thème ${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
      await stubResolvers(page, zone(NEW), { overrides: { quad9: zone(OLD), iij: 'down' } });
      await page.goto('/outils/propagation-dns/');
      await check(page, { expected: '192.0.2.10' });
      await expect(page.getByRole('heading', { name: 'Résultats pour example.fr (A)' })).toBeFocused();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }

  test('aucun scroll horizontal à 320 px et cibles de 44 px sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await stubResolvers(page, zone(NEW), { overrides: { quad9: zone(OLD) } });
    await page.goto('/outils/propagation-dns/');
    await check(page, { expected: '192.0.2.10' });
    await expect(page.getByRole('heading', { name: 'Résultats pour example.fr (A)' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('#tool-root button, #tool-root a, #tool-root select, #tool-root input[type="text"], #tool-root label:has(input[type="checkbox"])')]
        .filter((el) => getComputedStyle(el).display !== 'inline' && el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().height < 43.5)
        .map((el) => `${el.tagName} "${(el.getAttribute('aria-label') || el.textContent).trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().height)}`),
    );
    expect(small).toEqual([]);
  });
});
