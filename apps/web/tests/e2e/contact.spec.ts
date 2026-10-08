import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Route } from '@playwright/test';

// Turnstile est remplacé par un double : le jeton arrive aussitôt, aucun test ne dépend du réseau.
const TURNSTILE_STUB = `window.turnstile = { render(el, o) { setTimeout(() => o.callback('jeton-test'), 0); return 'w1'; }, reset() {}, remove() {} };`;

async function openForm(page: Page, path = '/contact/') {
  await page.addInitScript(() =>
    localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })),
  );
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: TURNSTILE_STUB }),
  );
  await page.goto(path);
  await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
  await page.locator('#name').scrollIntoViewIfNeeded(); // le formulaire est hydraté à l'approche de l'écran
}

const fill = async (page: Page) => {
  await page.getByLabel('Votre nom complet').fill('Jean Dupont');
  await page.getByLabel('Votre adresse email').fill('jean@example.org');
  await page.getByLabel('Votre message').fill('Bonjour, ceci est un test.');
  await page.getByLabel(/J'accepte que mes données/).check();
};
const reply = (status: number, success: boolean) => (route: Route) =>
  route.fulfill({ status, contentType: 'application/json', json: { success, message: 'x' } });

test('affiche chaque erreur et place le focus sur le premier champ à corriger', async ({
  page,
}) => {
  await openForm(page);
  await page.getByRole('button', { name: 'Envoyer le message' }).click();
  await expect(page.getByText('Indiquez votre nom.')).toBeVisible();
  await expect(page.getByText('Indiquez une adresse e-mail valide')).toBeVisible();
  await expect(page.getByText('Écrivez votre message.')).toBeVisible();
  await expect(page.getByText('Veuillez accepter')).toBeVisible();
  await expect(page.getByLabel('Votre nom complet')).toBeFocused();
});

test('envoie le message avec le jeton anti-robot et déplace le focus sur la confirmation', async ({
  page,
}) => {
  let body: Record<string, string> = {};
  await page.route('**/contact.php', async (route) => {
    body = route.request().postDataJSON() as Record<string, string>;
    await reply(200, true)(route);
  });
  await openForm(page);
  await fill(page);
  await page.getByRole('button', { name: 'Envoyer le message' }).click();
  await expect(page.getByText('Message envoyé avec succès !')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Message envoyé' })).toBeFocused();
  expect(body).toMatchObject({
    name: 'Jean Dupont',
    email: 'jean@example.org',
    message: 'Bonjour, ceci est un test.',
    website: '',
    turnstileToken: 'jeton-test',
  });

  await page.getByRole('button', { name: 'Envoyer un autre message' }).click(); // un second message reste possible
  await expect(page.getByLabel('Votre nom complet')).toHaveValue('');
});

for (const [status, expected] of [
  [429, 'Trop de messages'],
  [403, 'vérification anti-robot'],
  [500, 'Erreur technique'],
] as const) {
  test(`explique une réponse ${status} du serveur`, async ({ page }) => {
    await page.route('**/contact.php', reply(status, false));
    await openForm(page);
    await fill(page);
    await page.getByRole('button', { name: 'Envoyer le message' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: new RegExp(expected, 'i') }),
    ).toBeVisible();
  });
}

test('explique une coupure réseau', async ({ page }) => {
  await page.route('**/contact.php', (route) => route.abort());
  await openForm(page);
  await fill(page);
  await page.getByRole('button', { name: 'Envoyer le message' }).click();
  await expect(page.getByText('Connexion impossible')).toBeVisible();
});

test('propose un nouvel essai quand Turnstile est injoignable', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('consent', JSON.stringify({ analytics: false, ts: Date.now() })),
  );
  await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
  await page.goto('/contact/');
  await expect(page.getByRole('button', { name: 'Recharger la vérification' })).toBeVisible();
});

test('le formulaire est accessible (WCAG 2.2 AA), erreurs affichées, dans les deux thèmes', async ({
  page,
}) => {
  await openForm(page);
  await page.getByRole('button', { name: 'Envoyer le message' }).click();
  for (const scheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
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

test('la version anglaise a ses textes', async ({ page }) => {
  await openForm(page, '/en/contact/');
  await expect(page.getByLabel('Full Name')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send Message' })).toBeVisible();
});
