import { setTheme } from './helpers/theme';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

// L'îlot est hydraté à l'approche de l'écran (client:visible) : on défile jusqu'à l'outil.
async function ready(page: Page, path = '/outils/generateur-qr-code/') {
  await page.addInitScript(() =>
    localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })),
  );
  await page.goto(path);
  await page.locator('#outil').scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
}

const preview = (page: Page) => page.getByRole('img', { name: 'Aperçu du QR code généré' });

// PNG de 1 pixel (logo de test)
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64',
);

test.describe('générateur de QR code', () => {
  test('affiche un aperçu pour un lien, avec le bouton « Tester le lien » sûr', async ({
    page,
  }) => {
    await ready(page);
    await expect(page.getByText('Remplissez le contenu pour voir le QR code.')).toBeVisible();
    await page.getByLabel('Adresse du lien').fill('grichard.eu');
    await expect(preview(page)).toBeVisible();
    const link = page.getByRole('link', { name: 'Tester le lien' });
    await expect(link).toHaveAttribute('href', 'https://grichard.eu/');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('valide en temps réel et relie le message au champ', async ({ page }) => {
    await ready(page);
    const field = page.getByLabel('Adresse du lien');
    await field.fill('javascript:alert(1)');
    await expect(page.getByText('Saisissez une adresse http ou https valide')).toBeVisible();
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(preview(page)).toHaveCount(0);
    await field.fill('https://exemple.fr');
    await expect(field).not.toHaveAttribute('aria-invalid', 'true');
    await expect(preview(page)).toBeVisible();
  });

  test('chaque type de contenu produit un aperçu', async ({ page }) => {
    await ready(page);
    const type = async (name: string) =>
      page.getByRole('radio', { name, exact: true }).check({ force: true });

    await type('Texte');
    await page.getByRole('textbox', { name: 'Texte', exact: true }).fill('Été à Évry 🚗');
    await expect(preview(page)).toBeVisible();

    await type('Wi-Fi');
    await page.getByLabel('Nom du réseau (SSID)').fill('MaBox');
    await page.getByLabel('Mot de passe').fill('secret-123');
    await expect(preview(page)).toBeVisible();

    await type('E-mail');
    await page.getByLabel('Destinataire').fill('contact@exemple.fr');
    await expect(preview(page)).toBeVisible();

    await type('Téléphone');
    await page.getByLabel('Numéro de téléphone').fill('06 12 34 56 78');
    await expect(page.getByText('Utilisez le format international')).toBeVisible();
    await page.getByLabel('Numéro de téléphone').fill('+33 6 12 34 56 78');
    await expect(preview(page)).toBeVisible();

    await type('Position');
    await page.getByLabel('Latitude').fill('95');
    await page.getByLabel('Longitude').fill('2.35');
    await expect(page.getByText('La latitude doit être un nombre entre −90 et 90.')).toBeVisible();
    await page.getByLabel('Latitude').fill('48.8566');
    await expect(preview(page)).toBeVisible();

    await type('Contact (vCard)');
    await page.getByLabel('Prénom').fill('Camille');
    await expect(preview(page)).toBeVisible();

    await type('Événement');
    await page.getByLabel('Titre').fill('Réunion');
    await page.getByLabel('Début').fill('2026-12-01T09:00');
    await page.getByLabel('Fin').fill('2026-12-01T08:00');
    await expect(page.getByText('La fin doit être après le début.')).toBeVisible();
    await page.getByLabel('Fin').fill('2026-12-01T10:00');
    await expect(preview(page)).toBeVisible();
  });

  test('aucune requête réseau n’emporte ce qui est saisi (mot de passe Wi-Fi compris) et rien n’est stocké', async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(`${request.url()} ${request.postData() ?? ''}`));
    await ready(page);
    await page.getByRole('radio', { name: 'Wi-Fi', exact: true }).check({ force: true });
    await page.getByLabel('Nom du réseau (SSID)').fill('ReseauSecretXYZ');
    await page.getByLabel('Mot de passe').fill('MotDePasseSecretXYZ');
    await expect(preview(page)).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger en SVG' }).click();
    await download;
    expect(requests.filter((r) => /SecretXYZ/i.test(decodeURIComponent(r)))).toEqual([]);
    const stored = await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    );
    expect(stored).not.toMatch(/SecretXYZ/);
  });

  test('exporte en SVG et en PNG avec un nom de fichier explicite', async ({ page }) => {
    await ready(page);
    await page.getByLabel('Adresse du lien').fill('https://exemple.fr');
    const svgDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger en SVG' }).click();
    const svgFile = await svgDownload;
    expect(svgFile.suggestedFilename()).toBe('qr-code-url.svg');
    const text = await readFile((await svgFile.path()) as string, 'utf-8');
    expect(text.startsWith('<svg')).toBe(true);
    expect(text).not.toMatch(/<script|onload/i);

    await page.getByText('5. Réglages avancés').click();
    await page.getByLabel('Nom du fichier').fill('mon code');
    const pngDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger en PNG' }).click();
    expect((await pngDownload).suggestedFilename()).toBe('mon-code.png');
  });

  test('un logo impose le niveau H, un logo trop grand est signalé', async ({ page }) => {
    await ready(page);
    await page.getByLabel('Adresse du lien').fill('https://exemple.fr');
    await page.getByRole('group').first(); // les sections sont des <details>
    await page.getByText('4. Logo').click();
    await page
      .getByLabel('Choisir un logo')
      .setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: PNG_1PX });
    await expect(page.getByText('Logo chargé : logo.png')).toBeVisible();
    await expect(page.getByText(/niveau H/).first()).toBeVisible();
    await page.getByLabel(/Taille du logo/).fill('50');
    await expect(page.getByText(/Le logo couvre 25 % de la surface/).first()).toBeVisible();
    await expect(page.getByText(/au-delà des 20 %/)).toBeVisible();
    await page.getByRole('button', { name: 'Retirer le logo' }).click();
    await expect(page.getByText('Logo chargé : logo.png')).toHaveCount(0);
  });

  test('un logo SVG piégé n’exécute rien et un fichier invalide est refusé', async ({ page }) => {
    await ready(page);
    await page.getByLabel('Adresse du lien').fill('https://exemple.fr');
    await page.getByText('4. Logo').click();
    const evil =
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" onload="window.__pwned=1"><script>window.__pwned=1</script><rect width="10" height="10" fill="red"/></svg>';
    await page
      .getByLabel('Choisir un logo')
      .setInputFiles({ name: 'evil.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(evil) });
    await expect(page.getByText('Logo chargé : evil.svg')).toBeVisible();
    expect(
      await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned),
    ).toBeUndefined();
    await page
      .getByLabel('Choisir un logo')
      .setInputFiles({ name: 'texte.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
    await expect(page.getByText('Format non pris en charge')).toBeVisible();
    await page.getByLabel('Choisir un logo').setInputFiles({
      name: 'gros.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
    });
    await expect(page.getByText('Fichier trop lourd')).toBeVisible();
  });

  test('signale un contraste insuffisant et des couleurs inversées', async ({ page }) => {
    await ready(page);
    await page.getByLabel('Adresse du lien').fill('https://exemple.fr');
    await page.getByText('3. Apparence').click();
    await page.getByLabel('Couleur du code').fill('#999999');
    await page.getByLabel('Couleur du fond').fill('#aaaaaa');
    await expect(page.getByText(/en dessous de 4:1/)).toBeVisible();
    await page.getByLabel('Couleur du code').fill('#ffffff');
    await page.getByLabel('Couleur du fond').fill('#000000');
    await expect(page.getByText(/plus clair que le fond/)).toBeVisible();
  });

  test('les formes se choisissent sur des vignettes, avec un nom accessible', async ({ page }) => {
    await ready(page);
    await page.getByLabel('Adresse du lien').fill('https://exemple.fr');
    await page.getByText('3. Apparence').click();
    for (const legend of [
      'Forme du corps',
      'Forme du contour des marqueurs',
      'Forme du centre des marqueurs',
    ]) {
      await expect(page.getByRole('group', { name: legend })).toBeVisible();
    }
    const before = await preview(page).getAttribute('src');
    await page.getByRole('radio', { name: 'Points', exact: true }).check({ force: true });
    await page.getByRole('radio', { name: 'Goutte' }).first().check({ force: true });
    expect(await preview(page).getAttribute('src')).not.toBe(before);
    // sélection au clavier : flèche droite dans le groupe
    await page.getByRole('radio', { name: 'Points', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: 'Feuilles' })).toBeChecked();
  });

  test('la forme du logo arrondit ses angles dans l’aperçu', async ({ page }) => {
    await ready(page);
    await page.getByLabel('Adresse du lien').fill('https://exemple.fr');
    await page.getByText('4. Logo').click();
    await page
      .getByLabel('Choisir un logo')
      .setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: PNG_1PX });
    await expect(page.getByRole('group', { name: 'Forme du logo' })).toBeVisible();
    await page.getByRole('radio', { name: 'Carré' }).last().check({ force: true });
    const square = decodeURIComponent((await preview(page).getAttribute('src')) ?? '');
    expect(square).not.toContain('clipPath');
    await page.getByRole('radio', { name: 'Angles arrondis' }).check({ force: true });
    expect(decodeURIComponent((await preview(page).getAttribute('src')) ?? '')).toContain(
      'clipPath',
    );
    await page.getByRole('radio', { name: 'Rond' }).last().check({ force: true });
    expect(decodeURIComponent((await preview(page).getAttribute('src')) ?? '')).toContain(
      'clipPath',
    );
  });

  test('la résolution du PNG se choisit près du bouton et fixe les dimensions du fichier', async ({
    page,
  }) => {
    await ready(page);
    await page.getByLabel('Adresse du lien').fill('https://exemple.fr');
    const dimensions = async () => {
      const download = page.waitForEvent('download');
      await page.getByRole('button', { name: /Télécharger en PNG/ }).click();
      const file = await readFile((await (await download).path()) as string);
      return [file.readUInt32BE(16), file.readUInt32BE(20)]; // largeur et hauteur dans l'en-tête IHDR
    };
    await page.getByRole('radio', { name: /^512 / }).check({ force: true });
    await expect(page.getByRole('button', { name: /Télécharger en PNG · 512 px/ })).toBeVisible();
    expect(await dimensions()).toEqual([512, 512]);
    await page.getByRole('radio', { name: /^2048 / }).check({ force: true });
    expect(await dimensions()).toEqual([2048, 2048]);
    await page.getByRole('radio', { name: /Autre/ }).check({ force: true });
    await page.getByLabel('Taille en pixels (côté)').fill('1500');
    expect(await dimensions()).toEqual([1500, 1500]);
    // valeur hors bornes : ramenée à la limite
    await page.getByLabel('Taille en pixels (côté)').fill('99999');
    await expect(page.getByRole('button', { name: /Télécharger en PNG · 8192 px/ })).toBeVisible();
  });

  test('tout se parcourt au clavier : les sections se déplient avec Entrée', async ({ page }) => {
    await ready(page);
    const summary = page.getByText('3. Apparence');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('group', { name: 'Forme du corps' })).toBeVisible();
  });

  test('version anglaise', async ({ page }) => {
    await ready(page, '/en/tools/qr-code-generator/');
    await expect(page.getByRole('heading', { level: 1, name: 'QR code generator' })).toBeVisible();
    await page.getByLabel('Link address').fill('https://example.com');
    await expect(page.getByRole('img', { name: 'Preview of the generated QR code' })).toBeVisible();
  });

  test('respecte WCAG 2.2 AA une fois utilisé (deux thèmes)', async ({ page }) => {
    await ready(page);
    await page.getByLabel('Adresse du lien').fill('https://exemple.fr');
    await page.getByText('3. Apparence').click();
    await page.getByText('4. Logo').click();
    await page.getByText('5. Réglages avancés').click();
    for (const scheme of ['dark', 'light'] as const) {
      await setTheme(page, scheme);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        results.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
        ),
      ).toEqual([]);
    }
  });

  test('mobile : pas de débordement horizontal et aperçu visible pendant la saisie', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await ready(page);
    await page.getByLabel('Adresse du lien').fill('https://exemple.fr');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByLabel('Adresse du lien').scrollIntoViewIfNeeded();
    await expect(preview(page)).toBeInViewport();
  });
});
