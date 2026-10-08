import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })));
});

// Valeur (<dd>) de la ligne dont le libellé (<dt>) commence par `label`
const row = (page, label) => page.locator('dt', { hasText: label }).locator('xpath=following-sibling::dd[1]');

test.describe('formateur JSON', () => {
  const input = (page) => page.getByLabel('JSON à analyser');
  const output = (page) => page.locator('#json-output');

  test('valide, indente, minifie et trie sans modifier les valeurs', async ({ page }) => {
    await page.goto('/outils/formateur-json/');
    await expect(page.getByText('Collez du JSON pour commencer.')).toBeVisible();
    await input(page).fill('{"b":12345678901234567890,"a":[1.10,{"z":null,"y":true}]}');
    await expect(page.getByRole('status').filter({ hasText: 'JSON valide' })).toBeVisible();
    await expect(output(page)).toHaveValue('{\n  "b": 12345678901234567890,\n  "a": [\n    1.10,\n    {\n      "z": null,\n      "y": true\n    }\n  ]\n}');

    await page.getByLabel('Trier les clés par ordre alphabétique').check();
    await expect(output(page)).toHaveValue(/^\{\n {2}"a": \[/);
    await page.getByLabel('Minifié').check();
    await expect(output(page)).toHaveValue('{"a":[1.10,{"y":true,"z":null}],"b":12345678901234567890}');
    await page.getByLabel('Tabulation').check();
    await expect(output(page)).toHaveValue(/\n\t"a"/);
  });

  test("localise une erreur, l'explique et y place le curseur", async ({ page }) => {
    await page.goto('/outils/formateur-json/');
    await input(page).fill('{\n  "a": 1,\n  "b": 2,\n}');
    await expect(page.getByRole('status').filter({ hasText: 'JSON invalide' })).toContainText('ligne 4, colonne 1');
    await expect(page.locator('#json-input-error')).toContainText('Virgule en trop');
    await expect(input(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(output(page)).toHaveValue('');

    await page.getByRole('button', { name: "Aller à l'erreur" }).click();
    await expect(input(page)).toBeFocused();
    expect(await input(page).evaluate((el) => [el.selectionStart, el.value.slice(el.selectionStart, el.selectionEnd)])).toEqual([22, '}']);

    await input(page).fill("{'a': 1}");
    await expect(page.locator('#json-input-error')).toContainText('guillemets doubles');
    await input(page).fill('');
    await expect(page.getByText('Collez du JSON pour commencer.')).toBeVisible();
    await expect(input(page)).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('signale les clés en double, insère un exemple et efface', async ({ page }) => {
    await page.goto('/outils/formateur-json/');
    await input(page).fill('{"a":1,"a":2}');
    await expect(page.getByText(/Clés en double : a/)).toBeVisible();
    await page.getByRole('button', { name: 'Insérer un exemple' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'JSON valide' })).toBeVisible();
    await page.getByRole('button', { name: 'Effacer' }).click();
    await expect(input(page)).toHaveValue('');
    await expect(input(page)).toBeFocused();
  });

  test('un document volumineux reste traité', async ({ page }) => {
    await page.goto('/outils/formateur-json/');
    const big = JSON.stringify(Array.from({ length: 30_000 }, (_, i) => ({ id: i, nom: `élément ${i}`, tags: ['a', 'b'] })));
    await input(page).fill(big);
    await expect(page.getByRole('status').filter({ hasText: 'JSON valide' })).toBeVisible({ timeout: 10_000 });
    await expect(output(page)).not.toHaveValue('');
  });

  test('la version anglaise a ses textes', async ({ page }) => {
    await page.goto('/en/tools/json-formatter/');
    await page.getByLabel('JSON to analyze').fill('[1,]');
    await expect(page.locator('#json-input-error')).toContainText('trailing comma');
  });
});

test.describe("convertisseur d'unités", () => {
  test('convertit une taille en distinguant Go et Gio', async ({ page }) => {
    await page.goto('/outils/convertisseur-unites/');
    // valeur par défaut : 500 Go
    await expect(row(page, /^Gio/)).toContainText('465,661287');
    await page.getByLabel('Valeur').fill('1');
    await page.getByLabel('Unité').selectOption('GiB');
    await expect(row(page, /^Mio/)).toHaveText('1 024');
    await expect(row(page, /^Go/)).toContainText('1,073741824');
  });

  test('refuse les valeurs invalides, négatives ou démesurées', async ({ page }) => {
    await page.goto('/outils/convertisseur-unites/');
    const value = page.getByLabel('Valeur');
    for (const [text, message] of [['abc', 'Saisissez un nombre'], ['-3', 'négative'], ['1e30', 'trop grande']]) {
      await value.fill(text);
      await expect(page.locator('#units-data-value-error')).toContainText(message);
      await expect(value).toHaveAttribute('aria-invalid', 'true');
    }
    await value.fill('1 024,5');
    await expect(value).not.toHaveAttribute('aria-invalid', 'true');
    await value.fill('');
    await expect(page.getByText('Saisissez une taille')).toBeVisible();
  });

  test('calcule un temps de transfert et le débit dans toutes les unités', async ({ page }) => {
    await page.goto('/outils/convertisseur-unites/');
    await page.getByRole('tab', { name: 'Débit et durée' }).click();
    // 50 Go à 1 Gbit/s = 400 s
    await expect(page.getByText('6 min 40 s').first()).toBeVisible();
    await page.locator('#units-size').fill('1');
    await page.locator('#units-rate').fill('100');
    await page.locator('#units-rate-unit').selectOption('Mbit/s');
    await expect(page.getByText('1 min 20 s').first()).toBeVisible(); // 1 Go à 100 Mbit/s = 80 s
    await page.locator('#units-eff').fill('80');
    await expect(page.getByText('1 min 40 s').first()).toBeVisible();
    await expect(row(page, /^Mo\/s/)).toHaveText('12,5');

    await page.locator('#units-rate').fill('0');
    await expect(page.locator('#units-rate-error')).toContainText('supérieur à zéro');
    await page.locator('#units-eff').fill('150');
    await expect(page.locator('#units-eff-error')).toContainText('entre 1 et 100');
  });

  test('convertit les bases sans perdre de précision', async ({ page }) => {
    await page.goto('/outils/convertisseur-unites/');
    await page.getByRole('tab', { name: 'Bases numériques' }).click();
    await expect(row(page, /^Hexadécimal/)).toHaveText('FF');
    await page.getByLabel('Nombre entier').fill('18446744073709551615');
    await expect(row(page, /^Hexadécimal/)).toHaveText('FFFFFFFFFFFFFFFF');
    await page.getByLabel('Base de la saisie').selectOption('hex');
    await page.getByLabel('Nombre entier').fill('0xZZ');
    await expect(page.locator('#units-base-value-error')).toContainText('base 16');
    await page.getByLabel('Nombre entier').fill('0b11'); // en hexadécimal, « b » est un chiffre : 0xB11
    await expect(row(page, /^Décimal/)).toHaveText('2833');
  });

  test('les onglets se parcourent au clavier', async ({ page }) => {
    await page.goto('/outils/convertisseur-unites/');
    await page.getByRole('tab', { name: 'Tailles' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Débit et durée' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  test('la version anglaise a ses unités et ses textes', async ({ page }) => {
    await page.goto('/en/tools/unit-converter/');
    await expect(page.locator('dt', { hasText: /^GiB/ })).toBeVisible();
    await page.getByLabel('Value').fill('x');
    await expect(page.locator('#units-data-value-error')).toContainText('Enter a number');
  });
});
