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
  FINDER_INNER_STYLES,
  FINDER_OUTER_STYLES,
  LOGO_SHAPES,
  MODULE_STYLES,
  renderSvg,
  type RenderOptions,
} from '../src/qr/render';
import { decodeJsQr, decodeZxing, pngDataUrl, rasterize } from './helpers/qr-decode';

const base: RenderOptions = {
  moduleStyle: 'square',
  finderOuter: 'square',
  finderInner: 'square',
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

describe('formes du corps, tous niveaux de correction', () => {
  const text = 'https://grichard.eu/outils/generateur-qr-code/?ref=test';
  const levels: ErrorLevel[] = ['L', 'M', 'Q', 'H'];
  const cases = MODULE_STYLES.flatMap((m) => levels.map((l) => [m, l] as const));

  it.each(cases)('modules %s, niveau %s', async (moduleStyle, level) => {
    await expectDecodes(text, level, { ...base, moduleStyle }, `${moduleStyle}/${level}`);
  });
});

describe('contour et centre des repères', () => {
  const text = 'https://grichard.eu/outils/generateur-qr-code/?ref=test';
  const cases = FINDER_OUTER_STYLES.flatMap((o) => FINDER_INNER_STYLES.map((i) => [o, i] as const));

  it.each(cases)('contour %s, centre %s', async (finderOuter, finderInner) => {
    await expectDecodes(
      text,
      'M',
      { ...base, finderOuter, finderInner },
      `${finderOuter}/${finderInner}`,
    );
  });
});

describe('dégradé et fond', () => {
  const text = 'https://grichard.eu/outils/generateur-qr-code/?ref=test';

  it.each(MODULE_STYLES)('dégradé, modules %s', async (moduleStyle) => {
    await expectDecodes(
      text,
      'M',
      {
        ...base,
        moduleStyle,
        finderOuter: 'rounded',
        finderInner: 'circle',
        foreground: '#0b5d3b',
        gradient: { to: '#1d3557', angle: 45 },
      },
      `dégradé ${moduleStyle}`,
    );
  });

  it('fond transparent (posé sur du blanc)', async () => {
    await expectDecodes(text, 'M', { ...base, background: null }, 'fond transparent');
  });
});

describe('avec logo (niveau H imposé)', () => {
  const logo = pngDataUrl(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#d62828"/><text x="5" y="7" font-size="6" text-anchor="middle" fill="#fff">G</text></svg>',
  );
  const text = 'https://grichard.eu/outils/generateur-qr-code/?ref=logo';
  const cases = MODULE_STYLES.flatMap((m) => LOGO_SHAPES.map((s) => [m, s] as const));

  it.each(cases)('modules %s, logo %s à 22 % du côté', async (moduleStyle, shape) => {
    await expectDecodes(
      text,
      'H',
      {
        ...base,
        moduleStyle,
        finderOuter: 'rounded',
        finderInner: 'rounded',
        logo: { href: logo, ratio: 0.22, padding: 1, plate: true, shape },
      },
      `logo ${moduleStyle}/${shape}`,
    );
  });

  it('logo à 28 % sur dégradé, points et repères ronds', async () => {
    await expectDecodes(
      text,
      'H',
      {
        ...base,
        moduleStyle: 'dots',
        finderOuter: 'circle',
        finderInner: 'circle',
        foreground: '#0b5d3b',
        gradient: { to: '#1d3557', angle: 90 },
        logo: { href: logo, ratio: 0.28, padding: 1, plate: true, shape: 'rounded' },
      },
      'logo + dégradé',
    );
  });
});
