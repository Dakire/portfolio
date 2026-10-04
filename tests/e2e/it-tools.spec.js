import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })));
});

test.describe('calculatrice réseau', () => {
  test('décrit un réseau IPv4 et le découpe', async ({ page }) => {
    await page.goto('/outils/calculateur-reseau/');
    await page.getByLabel('Adresse et masque ou préfixe').fill('192.168.1.10/24');
    await page.getByRole('button', { name: 'Calculer' }).click();
    await expect(page.getByRole('heading', { name: 'Résultat' })).toBeVisible();
    await expect(page.locator('dd', { hasText: '192.168.1.255' }).first()).toBeVisible();
    await expect(page.locator('dd', { hasText: '255.255.255.0' }).first()).toBeVisible();

    await page.locator('#split-prefix').fill('26');
    await expect(page.locator('td.mono', { hasText: '192.168.1.192/26' })).toBeVisible();
  });

  test("plan VLSM et appartenance d'une adresse", async ({ page }) => {
    await page.goto('/outils/calculateur-reseau/');
    await page.getByLabel('Adresse et masque ou préfixe').fill('10.0.0.0/24');
    await page.getByRole('button', { name: 'Calculer' }).click();
    await page.locator('#vlsm-needs').fill('Ventes : 100\nIT : 25');
    await expect(page.locator('td.mono', { hasText: '10.0.0.0/25' })).toBeVisible();
    await page.locator('#check-input').fill('10.0.0.200');
    await expect(page.getByRole('status').filter({ hasText: /\S/ }).last()).toBeVisible();
  });

  test('refuse une saisie invalide avec un message', async ({ page }) => {
    await page.goto('/outils/calculateur-reseau/');
    await page.getByLabel('Adresse et masque ou préfixe').fill('300.1.1.1/24');
    await page.getByRole('button', { name: 'Calculer' }).click();
    await expect(page.locator('#cidr-input-error')).not.toBeEmpty();
  });
});

test.describe('générateur de mot de passe', () => {
  test('génère après hydratation, respecte la longueur et les jeux de caractères', async ({ page }) => {
    await page.goto('/outils/generateur-mot-de-passe/');
    const items = page.locator('ul code');
    await expect(items).toHaveCount(5);
    for (const text of await items.allTextContents()) expect(text).toHaveLength(20);

    await page.getByLabel(/Chiffres/).uncheck();
    await page.getByLabel(/Symboles/).uncheck();
    await expect(items.first()).toHaveText(/^[A-Za-z]{20}$/);
    for (const text of await items.allTextContents()) expect(text).toMatch(/^[A-Za-z]{20}$/);
  });

  test('mode prononçable et PIN', async ({ page }) => {
    await page.goto('/outils/generateur-mot-de-passe/');
    await page.getByRole('radio', { name: 'Code PIN' }).check();
    await expect(page.locator('ul code').first()).toHaveText(/^\d{6}$/);
    for (const text of await page.locator('ul code').allTextContents()) expect(text).toMatch(/^\d{6}$/);
    await page.getByRole('radio', { name: 'Prononçable' }).check();
    await expect(page.locator('ul code').first()).toHaveText(/-/);
    for (const text of await page.locator('ul code').allTextContents()) expect(text).toMatch(/-/);
  });

  test('masquer les mots de passe', async ({ page }) => {
    await page.goto('/outils/generateur-mot-de-passe/');
    await page.getByRole('button', { name: /Masquer/ }).click();
    expect(await page.locator('ul code').first().textContent()).toMatch(/^•+$/);
  });
});

test.describe('encodeur / décodeur', () => {
  test('Base64 aller-retour avec accents', async ({ page }) => {
    await page.goto('/outils/encodeur-decodeur/');
    await page.locator('#enc-base64-in').fill('Été à Laval');
    await expect(page.locator('#enc-base64-out')).toHaveValue('w4l0w6kgw6AgTGF2YWw=');
    await page.getByRole('radio', { name: 'Décoder' }).check();
    await page.locator('#enc-base64-in').fill('w4l0w6kgw6AgTGF2YWw=');
    await expect(page.locator('#enc-base64-out')).toHaveValue('Été à Laval');
  });

  test("navigation clavier entre onglets et lecture d'un JWT", async ({ page }) => {
    await page.goto('/outils/encodeur-decodeur/');
    await page.getByRole('tab', { name: 'Base64' }).focus();
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: 'UUID' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'JWT' }).click();
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    await page.locator('#enc-jwt-in').fill(token);
    await expect(page.getByText('"name": "John Doe"')).toBeVisible();
    await expect(page.getByText("Aucune date d'expiration (exp)")).toBeVisible();
  });

  test("empreinte SHA-256 d'un texte et comparaison", async ({ page }) => {
    await page.goto('/outils/encodeur-decodeur/');
    await page.getByRole('tab', { name: 'Empreintes' }).click();
    await page.locator('#enc-hash-in').fill('abc');
    const sha = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
    await expect(page.getByText(sha)).toBeVisible();
    await page.locator('#enc-hash-expected').fill(sha.toUpperCase());
    await expect(page.getByText(/Identique/)).toBeVisible();
  });

  test('timestamp et UUID', async ({ page }) => {
    await page.goto('/outils/encodeur-decodeur/');
    await page.getByRole('tab', { name: 'Timestamp' }).click();
    await page.locator('#enc-time-in').fill('1700000000');
    await expect(page.getByText('2023-11-14T22:13:20.000Z')).toBeVisible();
    await page.getByRole('tab', { name: 'UUID' }).click();
    await expect(page.locator('ul code').first()).toBeVisible();
    for (const text of await page.locator('ul code').allTextContents()) expect(text).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

test.describe("analyseur d'en-têtes d'e-mail", () => {
  test("analyse l'exemple : chemin, authentification, constats", async ({ page }) => {
    await page.goto('/outils/en-tetes-email/');
    await page.getByRole('button', { name: 'Charger un exemple' }).click();
    await expect(page.locator('#tool-root').getByRole('heading', { name: 'Chemin de livraison' })).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Constats' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Vérifier cette clé/ }).first()).toHaveAttribute('href', /\/outils\/dns\/\?d=.+&s=.+/);
  });

  test("signale un nom affiché trompeur et refuse un texte qui n'est pas des en-têtes", async ({ page }) => {
    await page.goto('/outils/en-tetes-email/');
    await page.getByLabel('En-têtes complets du message').fill('Hello world');
    await page.getByRole('button', { name: 'Analyser' }).click();
    await expect(page.locator('#mail-headers-error')).toContainText('ne ressemble pas');

    await page.getByLabel('En-têtes complets du message').fill('From: "paypal@paypal.com" <x@evil.example>\nSubject: Urgent\nMessage-ID: <1@evil.example>\nDate: Tue, 3 Jun 2025 10:00:00 +0000\n');
    await page.getByRole('button', { name: 'Analyser' }).click();
    await expect(page.getByText('Nom affiché trompeur').first()).toBeVisible();
  });
});
