// Lisibilité : chaque QR code généré est décodé par deux décodeurs indépendants (jsQR et ZXing) et doit redonner exactement son contenu.
// Les résultats ne remplacent pas un essai avec de vrais téléphones (iOS et Android), qui reste à faire.
import { describe, expect, it } from 'vitest';
import { buildMatrix, type ErrorLevel } from '../src/qr/matrix';
import {
  emailPayload,
  eventPayload,
  geoPayload,
  phonePayload,
  smsPayload,
  textPayload,
  urlPayload,
  vcardPayload,
  whatsappPayload,
  wifiPayload,
} from '../src/qr/payloads';
import { PRESETS } from '../src/qr/presets';
import {
  renderSvg,
  type FinderStyle,
  type ModuleStyle,
  type RenderOptions,
} from '../src/qr/render';
import { decodeJsQr, decodeZxing, pngDataUrl, rasterize } from './helpers/qr-decode';

const base: RenderOptions = {
  moduleStyle: 'square',
  finderStyle: 'square',
  foreground: '#000000',
  background: '#ffffff',
  margin: 4,
  pixelSize: 720,
};

async function expectDecodes(
  text: string,
  level: ErrorLevel,
  options: RenderOptions,
  label: string,
) {
  const built = buildMatrix(text, level);
  if (!built.ok) throw new Error(`${label} : contenu trop long`);
  const raster = rasterize(renderSvg(built.matrix, options));
  expect(decodeJsQr(raster), `${label} (jsQR)`).toBe(text);
  expect(await decodeZxing(raster), `${label} (ZXing)`).toBe(text);
}

const ok = (b: { ok: boolean; value?: string }): string => {
  if (!b.ok || b.value === undefined) throw new Error('contenu invalide');
  return b.value;
};

const start = new Date(Date.UTC(2026, 10, 20, 9, 0, 0));
const end = new Date(Date.UTC(2026, 10, 20, 10, 30, 0));
const SAMPLES: [string, string][] = [
  ['URL', ok(urlPayload('https://grichard.eu/outils/generateur-qr-code/'))],
  ['texte (accents, emoji, ligne)', ok(textPayload('Été à Évry 🚗\nSeconde ligne : ça marche'))],
  [
    'Wi-Fi (caractères spéciaux)',
    ok(
      wifiPayload({
        ssid: 'Mon Wi-Fi; "test"',
        password: 'mot:de,passe\\1',
        security: 'WPA',
        hidden: true,
      }),
    ),
  ],
  [
    'e-mail',
    ok(
      emailPayload({ to: 'contact@grichard.eu', subject: 'Bonjour & merci', body: 'Été 🚗\nFin' }),
    ),
  ],
  ['téléphone', ok(phonePayload('+33 6 12 34 56 78'))],
  ['SMS', ok(smsPayload({ phone: '+33612345678', message: 'RDV à 10:30 ✅' }))],
  ['WhatsApp', ok(whatsappPayload({ phone: '+33612345678', message: 'Salut ! 👋' }))],
  ['géolocalisation', ok(geoPayload({ latitude: '48.8566', longitude: '2.3522' }))],
  [
    'vCard',
    ok(
      vcardPayload({
        firstName: 'Guillaume',
        lastName: 'Richard',
        organization: 'Exemple, SARL',
        phone: '+33612345678',
        email: 'contact@grichard.eu',
        url: 'https://grichard.eu',
        street: '1 rue Exemple',
        city: 'Ville',
        region: '',
        postalCode: '75000',
        country: 'France',
      }),
    ),
  ],
  [
    'événement',
    ok(
      eventPayload({
        summary: 'Réunion, étape 1',
        start,
        end,
        location: 'Salle A',
        description: 'Ordre du jour\nPoint 1',
      }),
    ),
  ],
];

describe('un QR code par type de contenu (style par défaut)', () => {
  it.each(SAMPLES)('%s', async (label, text) => {
    await expectDecodes(text, 'M', base, label);
  });
});

describe('préréglages', () => {
  it.each(Object.entries(PRESETS))('%s', async (name, preset) => {
    await expectDecodes('https://grichard.eu/', 'M', { ...base, ...preset }, `préréglage ${name}`);
  });
});

describe('matrice de styles', () => {
  const modules: ModuleStyle[] = ['square', 'rounded', 'dots'];
  const finders: FinderStyle[] = ['square', 'rounded', 'dot'];
  const levels: ErrorLevel[] = ['L', 'M', 'Q', 'H'];
  const text = 'https://grichard.eu/outils/generateur-qr-code/?ref=test';
  const cases = modules.flatMap((m) =>
    finders.flatMap((f) => levels.map((l) => [m, f, l] as const)),
  );

  it.each(cases)('modules %s, repères %s, niveau %s', async (moduleStyle, finderStyle, level) => {
    await expectDecodes(
      text,
      level,
      { ...base, moduleStyle, finderStyle },
      `${moduleStyle}/${finderStyle}/${level}`,
    );
  });

  it.each(modules.flatMap((m) => finders.map((f) => [m, f] as const)))(
    'dégradé, modules %s, repères %s',
    async (moduleStyle, finderStyle) => {
      await expectDecodes(
        text,
        'M',
        {
          ...base,
          moduleStyle,
          finderStyle,
          foreground: '#0b5d3b',
          gradient: { to: '#1d3557', angle: 45 },
        },
        `dégradé ${moduleStyle}/${finderStyle}`,
      );
    },
  );

  it('fond transparent (posé sur du blanc)', async () => {
    await expectDecodes(text, 'M', { ...base, background: null }, 'fond transparent');
  });
});

describe('avec logo (niveau H imposé)', () => {
  const logo = pngDataUrl(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#d62828"/><text x="5" y="7" font-size="6" text-anchor="middle" fill="#fff">G</text></svg>',
  );
  const text = 'https://grichard.eu/outils/generateur-qr-code/?ref=logo';
  const cases = (['square', 'rounded', 'dots'] as const).flatMap((m) =>
    [0.18, 0.28].map((ratio) => [m, ratio] as const),
  );

  it.each(cases)('modules %s, logo à %s du côté', async (moduleStyle, ratio) => {
    await expectDecodes(
      text,
      'H',
      {
        ...base,
        moduleStyle,
        finderStyle: 'rounded',
        logo: { href: logo, ratio, padding: 1, plate: true },
      },
      `logo ${moduleStyle}/${ratio}`,
    );
  });

  it('logo sur dégradé avec points et repères ronds', async () => {
    await expectDecodes(
      text,
      'H',
      {
        ...base,
        moduleStyle: 'dots',
        finderStyle: 'dot',
        foreground: '#0b5d3b',
        gradient: { to: '#1d3557', angle: 90 },
        logo: { href: logo, ratio: 0.22, padding: 1, plate: true },
      },
      'logo + dégradé',
    );
  });
});
