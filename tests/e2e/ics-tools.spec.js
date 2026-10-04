import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })));
});

const CRLF = '\r\n';
const vevent = (uid, summary, start, end, extra = []) => ['BEGIN:VEVENT', `UID:${uid}`, 'DTSTAMP:20250101T000000Z', `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${summary}`, ...extra, 'END:VEVENT'];
const ics = (events) => ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Test//EN', ...events.flat(), 'END:VCALENDAR'].join(CRLF) + CRLF;
const file = (name, content) => ({ name, mimeType: 'text/calendar', buffer: Buffer.from(content) });

const AGENDA = ics([
  vevent('a', 'Dentiste', '20240115T090000Z', '20240115T100000Z'),
  vevent('b', 'Vacances', '20240620T090000Z', '20240620T100000Z'),
  vevent('c', 'Cours', '20250105T090000Z', '20250105T100000Z', ['RRULE:FREQ=WEEKLY']),
  vevent('c', 'Cours déplacé', '20250112T100000Z', '20250112T110000Z', ['RECURRENCE-ID:20250112T090000Z']),
  vevent('d', 'Garagiste', '20250301T090000Z', '20250301T100000Z'),
]);

test.describe('découpeur ICS', () => {
  test('lit le fichier, résume son contenu et propose les fichiers produits', async ({ page }) => {
    await page.goto('/outils/ics-decouper/');
    await page.locator('#ics-file').setInputFiles(file('agenda.ics', AGENDA));
    await expect(page.getByText('5', { exact: true }).first()).toBeVisible();
    await expect(page.locator('#tool-root').getByText('événements').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fichiers produits' })).toBeVisible();
    await expect(page.getByText('Vérification : aucun événement perdu ni dupliqué.')).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'fichier' })).toHaveCount(1);
  });

  test('par année : un fichier par année, séries entières, téléchargement valide', async ({ page }) => {
    await page.goto('/outils/ics-decouper/');
    await page.locator('#ics-file').setInputFiles(file('agenda.ics', AGENDA));
    await page.getByRole('radio', { name: /Par année/ }).check();
    await expect(page.locator('td.mono')).toHaveText(['agenda-2024.ics', 'agenda-2025.ics']);

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Télécharger : agenda-2025.ics' }).click()]);
    expect(download.suggestedFilename()).toBe('agenda-2025.ics');
    const text = readFileSync(await download.path(), 'utf-8');
    expect(text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(3); // Cours + exception + Garagiste
    expect(text).toContain('RECURRENCE-ID:20250112T090000Z');
    expect(text).not.toContain('Dentiste');
  });

  test('par nombre : une série et ses exceptions restent dans le même fichier', async ({ page }) => {
    await page.goto('/outils/ics-decouper/');
    await page.locator('#ics-file').setInputFiles(file('agenda.ics', AGENDA));
    await page.getByRole('spinbutton', { name: 'Événements par fichier' }).fill('2');
    await expect(page.locator('td.mono')).toHaveCount(3);
    await expect(page.locator('tbody tr').nth(1).locator('td').nth(1)).toHaveText('2'); // Cours + exception
  });

  test('l\'archive ZIP contient tous les fichiers', async ({ page }) => {
    await page.goto('/outils/ics-decouper/');
    await page.locator('#ics-file').setInputFiles(file('agenda.ics', AGENDA));
    await page.getByRole('radio', { name: /Par mois/ }).check();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Tout télécharger/ }).click()]);
    expect(download.suggestedFilename()).toBe('agenda-decoupe.zip');
    const zip = readFileSync(await download.path());
    expect(zip.subarray(0, 2).toString()).toBe('PK');
    const names = zip.toString('latin1');
    for (const name of ['agenda-2024-01.ics', 'agenda-2024-06.ics', 'agenda-2025-01.ics', 'agenda-2025-03.ics']) expect(names).toContain(name);
  });

  test('refuse un fichier qui n\'est pas un calendrier', async ({ page }) => {
    await page.goto('/outils/ics-decouper/');
    await page.locator('#ics-file').setInputFiles(file('notes.txt', 'juste du texte'));
    await expect(page.getByRole('alert')).toContainText('ne ressemble pas à un calendrier');
    await expect(page.getByRole('heading', { name: 'Fichiers produits' })).toHaveCount(0);
  });

  test('tolère un fichier abîmé et le signale', async ({ page }) => {
    await page.goto('/outils/ics-decouper/');
    const broken = ['BEGIN:VCALENDAR', ...vevent('a', 'Ok', '20250101T090000Z', '20250101T100000Z'), 'BEGIN:VEVENT', 'UID:b', 'SUMMARY:ouvert', 'ligne bizarre'].join('\n');
    await page.locator('#ics-file').setInputFiles(file('abime.ics', broken));
    await expect(page.getByText(/anomalie\(s\) tolérée\(s\)/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fichiers produits' })).toBeVisible();
  });

  test('version anglaise', async ({ page }) => {
    await page.goto('/en/tools/ics-splitter/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Split an ICS file');
    await page.locator('#ics-file').setInputFiles(file('agenda.ics', AGENDA));
    await expect(page.getByRole('heading', { name: 'Files produced' })).toBeVisible();
    await expect(page.getByText('5 events spread over 1 file')).toBeVisible();
  });
});

const SOURCE = ics([
  vevent('g1', 'Dentiste', '20250110T090000Z', '20250110T100000Z'),
  vevent('g2', 'Réunion équipe', '20250111T090000Z', '20250111T100000Z', ['LOCATION:Salle 2']),
  vevent('g3', 'Anniversaire', '20250112T090000Z', '20250112T100000Z'),
  vevent('g4', 'Anniversaire', '20250112T090000Z', '20250112T100000Z'), // doublon dans la source
  vevent('g5', 'Congrès', '20250120T090000Z', '20250120T100000Z'),
]);
const DESTINATION = ics([
  vevent('outlook-77', 'Dentiste', '20250110T090000Z', '20250110T100000Z'), // même contenu, autre UID
  vevent('g2', 'Réunion équipe', '20250111T090000Z', '20250111T100000Z', ['LOCATION:Salle 1']), // modifié
  vevent('x9', 'Seulement ici', '20250130T090000Z', '20250130T100000Z'),
]);

const load = async (page, source = SOURCE, destination = DESTINATION) => {
  await page.locator('#ics-source').setInputFiles(file('google.ics', source));
  await page.locator('#ics-destination').setInputFiles(file('outlook.ics', destination));
};

test.describe('comparateur ICS', () => {
  test('source moins destination : compte, liste et fichier à importer', async ({ page }) => {
    await page.goto('/outils/ics-comparer/');
    await load(page);
    await expect(page.getByRole('heading', { name: 'Résultat' })).toBeVisible();
    const stats = page.locator('li', { hasText: 'À importer' }).first();
    await expect(stats).toContainText('2'); // Anniversaire (doublon réduit à un exemplaire) + Congrès
    await expect(page.getByRole('status').filter({ hasText: 'Comparaison terminée' })).toHaveCount(1);

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Télécharger les événements à importer/ }).click()]);
    expect(download.suggestedFilename()).toBe('google-moins-outlook.ics');
    const text = readFileSync(await download.path(), 'utf-8');
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(text).toContain('SUMMARY:Anniversaire');
    expect(text).toContain('SUMMARY:Congrès');
    expect(text).not.toContain('Dentiste'); // déjà en destination (reconnu par son contenu)
    expect(text).not.toContain('Réunion équipe'); // déjà en destination (modifié : exclu par défaut)
  });

  test('signale les doublons, les modifiés et ce qui n\'existe que dans la destination', async ({ page }) => {
    await page.goto('/outils/ics-comparer/');
    await load(page);
    await page.getByRole('heading', { name: 'Résultat' }).waitFor();
    await expect(page.getByText('1 doublon(s) de la source retiré(s)')).toBeVisible();

    const modified = page.locator('details.check', { hasText: 'Événements modifiés' });
    await expect(modified).toHaveAttribute('open', '');
    await expect(modified).toContainText('Réunion équipe');
    await expect(modified).toContainText('lieu');

    const onlyDestination = page.locator('details.check', { hasText: 'seulement dans la destination' });
    await onlyDestination.locator('summary').click();
    await expect(onlyDestination).toContainText('Seulement ici');

    const matched = page.locator('details.check', { hasText: 'déjà présents' });
    await matched.locator('summary').click();
    await expect(matched).toContainText('Dentiste');
    await expect(matched).toContainText('contenu');
  });

  test('les options changent le résultat (UID seul, inclure les modifiés)', async ({ page }) => {
    await page.goto('/outils/ics-comparer/');
    await load(page);
    await page.getByRole('heading', { name: 'Résultat' }).waitFor();
    const toImport = page.getByText('À importer', { exact: true }).locator('..');
    await expect(toImport).toContainText('2');

    await page.getByRole('radio', { name: /Identifiant \(UID\) seulement/ }).check();
    await expect(toImport).toContainText('3'); // Dentiste n'a plus le même UID : à importer

    await page.getByRole('radio', { name: /Identifiant ou contenu/ }).check();
    await page.getByLabel(/Inclure aussi les événements modifiés/).check();
    await expect(toImport).toContainText('3');
  });

  test('rien à importer quand la destination contient déjà tout', async ({ page }) => {
    await page.goto('/outils/ics-comparer/');
    await load(page, DESTINATION, DESTINATION);
    await expect(page.getByText('Rien à importer')).toBeVisible();
    await expect(page.getByRole('button', { name: /Télécharger les événements à importer/ })).toHaveCount(0);
  });

  test('inverser la source et la destination', async ({ page }) => {
    await page.goto('/outils/ics-comparer/');
    await load(page);
    await page.getByRole('heading', { name: 'Résultat' }).waitFor();
    await page.getByRole('button', { name: 'Inverser source et destination' }).click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Télécharger les événements à importer/ }).click()]);
    expect(download.suggestedFilename()).toBe('outlook-moins-google.ics');
    expect(readFileSync(await download.path(), 'utf-8')).toContain('Seulement ici');
  });

  test('refuse un fichier invalide et fonctionne en anglais', async ({ page }) => {
    await page.goto('/en/tools/ics-compare/');
    await page.locator('#ics-source').setInputFiles(file('x.txt', 'hello'));
    await expect(page.getByRole('alert')).toContainText('does not look like an iCalendar file');
    await load(page);
    await expect(page.getByRole('heading', { name: 'Result' })).toBeVisible();
    await expect(page.getByText('To import', { exact: true })).toBeVisible();
  });
});

test.describe('accessibilité et mobile des outils ICS', () => {
  for (const theme of ['dark', 'light']) {
    test(`résultats du découpeur et du comparateur : WCAG AA (axe, thème ${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
      await page.goto('/outils/ics-decouper/');
      await page.locator('#ics-file').setInputFiles(file('agenda.ics', AGENDA));
      await page.getByRole('heading', { name: 'Fichiers produits' }).waitFor();
      let results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);

      await page.goto('/outils/ics-comparer/');
      await load(page);
      await page.getByRole('heading', { name: 'Résultat' }).waitFor();
      await page.locator('details.check summary').first().click();
      results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }

  test('aucun scroll horizontal à 320 px, boutons de 44 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/outils/ics-comparer/');
    await load(page);
    await page.getByRole('heading', { name: 'Résultat' }).waitFor();
    await page.locator('details.check summary').first().click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('#tool-root button, #tool-root summary, #tool-root label.btn')]
        .filter((el) => el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().height < 43.5)
        .map((el) => (el.getAttribute('aria-label') || el.textContent).trim().slice(0, 30)),
    );
    expect(small).toEqual([]);
  });

  test('le sélecteur de fichier est utilisable au clavier', async ({ page }) => {
    await page.goto('/outils/ics-decouper/');
    await page.locator('#ics-file').focus();
    await expect(page.locator('#ics-file')).toBeFocused();
    await expect(page.locator('label[for="ics-file"]')).toBeVisible();
  });
});

test.describe('page « Outils »', () => {
  test('liste tous les outils avec un lien chacun, dans les deux langues', async ({ page }) => {
    await page.goto('/outils/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Outils pour techniciens IT');
    for (const [name, href] of [['Outil DNS et e-mail', '/outils/dns/'], ['Découpeur de fichier ICS', '/outils/ics-decouper/'], ['Comparateur de fichiers ICS', '/outils/ics-comparer/']]) {
      await expect(page.getByRole('link', { name: new RegExp(name) })).toHaveAttribute('href', href);
    }
    await page.getByRole('banner').getByRole('link', { name: 'Read this site in English' }).click();
    await expect(page).toHaveURL(/\/en\/tools\/$/);
    await expect(page.getByRole('link', { name: /ICS file splitter/ })).toHaveAttribute('href', '/en/tools/ics-splitter/');
  });

  test('le lien « Outils » du menu est la page courante sur chaque outil', async ({ page }) => {
    await page.goto('/outils/ics-comparer/');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Outils' }).first()).toHaveAttribute('aria-current', 'page');
  });

  test('a ses données structurées et chaque outil a les siennes', async ({ page }) => {
    await page.goto('/outils/');
    const hub = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    expect(hub['@type']).toBe('CollectionPage');
    expect(hub.mainEntity.itemListElement.length).toBeGreaterThanOrEqual(3);
    await page.goto('/outils/ics-comparer/');
    const tool = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    expect(tool['@graph'].map((n) => n['@type'])).toEqual(['WebApplication', 'BreadcrumbList', 'FAQPage']);
    expect(tool['@graph'][1].itemListElement).toHaveLength(3);
  });

  test('le plan du site, llms.txt et la palette connaissent les outils', async ({ page, request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    for (const loc of ['/outils/', '/outils/dns/', '/outils/ics-decouper/', '/en/tools/ics-compare/']) expect(xml).toContain(`<loc>https://grichard.eu${loc}</loc>`);
    const llms = await (await request.get('/llms.txt')).text();
    expect(llms).toContain('## Outils en ligne (français)');
    expect(llms).toContain('https://grichard.eu/outils/ics-comparer/');
    await page.goto('/');
    await page.keyboard.press('Control+k');
    await page.getByRole('combobox').fill('comparer ics');
    await expect(page.getByRole('option').first()).toContainText('Comparateur de fichiers ICS');
  });
});
