import { expect, test, type Page } from '@playwright/test';
import { mailZone, stubDoh } from './helpers/doh';

// Un outil est « hydraté » quand Astro a retiré l'attribut ssr de son îlot.
async function ready(page: Page, path: string) {
  await page.addInitScript(() =>
    localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })),
  );
  await page.goto(path);
  await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
}

test.describe('encodeur / décodeur', () => {
  test('encode en Base64 et lit un JWT', async ({ page }) => {
    await ready(page, '/outils/encodeur-decodeur/');
    await page.locator('#enc-base64-in').fill('hello');
    await expect(page.locator('#enc-base64-out')).toHaveValue('aGVsbG8=');

    await page.getByRole('tab', { name: 'JWT' }).click();
    const token = [
      Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),
      Buffer.from('{"sub":"123","exp":4102444800}').toString('base64url'),
      'signature',
    ].join('.');
    await page.locator('#enc-jwt-in').fill(token);
    await expect(page.locator('pre.code-block').first()).toContainText('HS256');
    await expect(page.locator('pre.code-block').nth(1)).toContainText('"sub": "123"');
  });

  test('calcule des empreintes', async ({ page }) => {
    await ready(page, '/outils/encodeur-decodeur/');
    await page.getByRole('tab', { name: 'Empreintes' }).click();
    await page.locator('#enc-hash-in').fill('abc');
    await expect(
      page.getByText('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'),
    ).toBeVisible(); // SHA-256 de « abc »
    await expect(page.getByText('900150983cd24fb0d6963f7d28e17f72')).toBeVisible(); // MD5 de « abc »
  });
});

test.describe('calculatrice réseau', () => {
  test('décrit un réseau IPv4 et le découpe', async ({ page }) => {
    await ready(page, '/outils/calculateur-reseau/');
    await page.getByLabel('Adresse et masque ou préfixe').fill('192.168.1.10/24');
    await page.getByRole('button', { name: 'Calculer' }).click();
    await expect(page.getByText('192.168.1.255', { exact: true }).first()).toBeVisible(); // broadcast
    await expect(page.getByText('255.255.255.0', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('table').first()).toBeVisible(); // découpage en sous-réseaux
  });

  test('refuse une saisie invalide', async ({ page }) => {
    await ready(page, '/outils/calculateur-reseau/');
    await page.getByLabel('Adresse et masque ou préfixe').fill('999.1.1.1');
    await page.getByRole('button', { name: 'Calculer' }).click();
    await expect(page.locator('#cidr-input-error')).not.toBeEmpty();
  });
});

const event = (uid: string, summary: string, day: string) =>
  [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `SUMMARY:${summary}`,
    `DTSTART:${day}T090000Z`,
    `DTEND:${day}T100000Z`,
    'END:VEVENT',
  ].join('\r\n');
const calendar = (...events: string[]) =>
  ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//test//FR', ...events, 'END:VCALENDAR', ''].join(
    '\r\n',
  );
const upload = (page: Page, selector: string, name: string, body: string) =>
  page
    .locator(selector)
    .setInputFiles({ name, mimeType: 'text/calendar', buffer: Buffer.from(body) });

test.describe('outils ICS', () => {
  test('découpe un calendrier en fichiers', async ({ page }) => {
    await ready(page, '/outils/ics-decouper/');
    await upload(
      page,
      '#ics-file',
      'agenda.ics',
      calendar(
        event('A', 'Evt A', '20250101'),
        event('B', 'Evt B', '20250102'),
        event('C', 'Evt C', '20250103'),
      ),
    );
    await page.locator('#split-count').fill('1');
    await expect(
      page.getByRole('cell', { name: 'agenda-partie-3.ics', exact: true }),
    ).toBeVisible();
  });

  test('compare deux calendriers (source moins destination)', async ({ page }) => {
    await ready(page, '/outils/ics-comparer/');
    await upload(
      page,
      '#ics-source',
      'source.ics',
      calendar(event('1', 'Réunion', '20250110'), event('2', 'Déjeuner', '20250111')),
    );
    await upload(
      page,
      '#ics-destination',
      'destination.ics',
      calendar(event('1', 'Réunion', '20250110')),
    );
    await expect(page.locator('.stat-card.is-accent .stat-number')).toHaveText('1'); // un événement à importer
    await expect(page.getByRole('cell', { name: 'Déjeuner' })).toBeVisible();
  });

  test('refuse un fichier qui n’est pas un calendrier', async ({ page }) => {
    await ready(page, '/outils/ics-decouper/');
    await upload(page, '#ics-file', 'note.ics', 'ceci n’est pas un calendrier');
    await expect(page.locator('#ics-file-error')).not.toBeEmpty();
  });
});

test.describe('analyseur d’en-têtes d’e-mail', () => {
  test('analyse l’exemple et affiche constats et tableaux', async ({ page }) => {
    await ready(page, '/outils/en-tetes-email/');
    await page.getByRole('button', { name: 'Charger un exemple' }).click();
    await expect(page.locator('.finding').first()).toBeVisible();
    await expect(page.getByRole('table').first()).toBeVisible();
  });

  test('refuse un texte qui n’est pas un en-tête', async ({ page }) => {
    await ready(page, '/outils/en-tetes-email/');
    await page.getByLabel('En-têtes complets du message').fill('bonjour tout le monde');
    await page.getByRole('button', { name: 'Analyser' }).click();
    await expect(page.locator('#mail-headers-error')).toContainText('ne ressemble pas');
  });
});

test.describe('DNS Lookup', () => {
  test('analyse un domaine messagerie en bon état (résolveurs simulés)', async ({ page }) => {
    await stubDoh(page, mailZone('exemple.test'));
    await ready(page, '/outils/dns/');
    await page.getByLabel('Domaine à analyser').fill('exemple.test');
    await page.getByRole('button', { name: 'Analyser' }).click();
    for (const id of ['addresses', 'mx', 'spf', 'dkim', 'dmarc', 'ns', 'dnssec'])
      await expect(page.locator(`#check-${id}`)).toBeAttached();
    await expect(page.getByRole('heading', { name: /exemple\.test/ }).first()).toBeFocused(); // le focus arrive sur le résultat
  });

  test('signale un domaine inexistant', async ({ page }) => {
    await stubDoh(page, {});
    await ready(page, '/outils/dns/');
    await page.getByLabel('Domaine à analyser').fill('inexistant.test');
    await page.getByRole('button', { name: 'Analyser' }).click();
    await expect(page.locator('.finding').first()).toBeVisible();
  });

  test('refuse une adresse IP comme domaine', async ({ page }) => {
    await ready(page, '/outils/dns/');
    await page.getByLabel('Domaine à analyser').fill('192.168.1.1');
    await page.getByRole('button', { name: 'Analyser' }).click();
    await expect(page.locator('#dns-domain-error')).not.toBeEmpty();
  });

  test('relance l’analyse d’un lien partagé', async ({ page }) => {
    await stubDoh(page, mailZone('exemple.test'));
    await ready(page, '/outils/dns/?d=exemple.test');
    await expect(page.locator('#check-spf')).toBeAttached();
    await expect(page.getByLabel('Domaine à analyser')).toHaveValue('exemple.test');
  });
});

test.describe('propagation DNS', () => {
  test('compare les réponses de plusieurs résolveurs (simulés)', async ({ page }) => {
    // Résolveurs JSON simulés ; les résolveurs binaires sont coupés (« en échec », sans fausser le verdict)
    for (const host of [
      'cloudflare-dns.com/dns-query',
      'dns.google/resolve',
      'doh.dns.sb/dns-query',
      'dns.alidns.com/resolve',
    ]) {
      await page.route(`https://${host}*`, (route) =>
        route.fulfill({
          contentType: 'application/dns-json',
          json: {
            Status: 0,
            Answer: [{ name: 'exemple.test.', type: 1, TTL: 300, data: '203.0.113.7' }],
          },
        }),
      );
    }
    for (const host of [
      'dns.quad9.net',
      'dnsforge.de',
      'odvr.nic.cz',
      'freedns.controld.com',
      'public.dns.iij.jp',
    ])
      await page.route(`https://${host}/**`, (route) => route.abort());
    await ready(page, '/outils/propagation-dns/');
    await page.getByLabel(/Nom à vérifier/).fill('exemple.test');
    await page.getByLabel(/Valeur attendue/).fill('203.0.113.7');
    await page.getByRole('button', { name: 'Vérifier' }).click();
    await expect(page.locator('.resolver-row')).toHaveCount(9);
    await expect(page.locator('.verdict')).toContainText(/propag/i);
  });
});
