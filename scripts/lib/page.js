// Gabarit HTML commun à toutes les pages produites au build.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { esc } from './markdown.js';
import { root } from './paths.js';

export const SITE = 'https://grichard.eu';
export const OG_IMAGE = { url: `${SITE}/og-image.png`, width: 1200, height: 630, alt: 'Guillaume Richard, Technicien Informatique & Systèmes Numériques' };
const LOCALES = { fr: 'fr_FR', en: 'en_US' };

// Ajoute ?v=<empreinte> aux scripts de public/js : un script modifié n'est jamais servi depuis un ancien cache navigateur.
export const versioned = (src) => {
  try {
    const hash = createHash('sha1').update(readFileSync(root(`public${src}`))).digest('hex').slice(0, 8);
    return `${src}?v=${hash}`;
  } catch {
    return src;
  }
};

// JSON embarqué dans une balise <script> : « < » échappé pour qu'aucune donnée ne puisse la refermer.
export const json = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

/**
 * - assets : balises <link>/<script> issues du build Vite (CSS, bundle JS de l'accueil)
 * - scripts : scripts autonomes de public/js/ en plus de ceux de toutes les pages (nav.js, fx.js, palette.js, consent.js ; theme.js est chargé dans le <head>, sans defer, pour éviter tout flash de thème)
 * - alternates : [{ lang, path }] pour les balises hreflang
 * - feeds : [{ title, path }] flux RSS à déclarer dans le <head> (découverte automatique par les lecteurs)
 * - image : image de partage { url, width, height, alt } ; par défaut l'image générique du site
 */
export function page({ lang = 'fr', assets, scripts = [], title, description, path, type = 'website', body, extraMeta = '', ld, noindex = false, alternates = [], feeds = [], image = OG_IMAGE }) {
  const url = `${SITE}${path}`;
  const alt = alternates
    .map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${SITE}${a.path}" />`)
    .join('\n    ');
  const others = alternates.filter((a) => a.lang !== lang && a.lang !== 'x-default').map((a) => `<meta property="og:locale:alternate" content="${LOCALES[a.lang]}" />`);
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#020617" />
    <meta name="color-scheme" content="dark light" />
    <script src="${esc(versioned('/js/theme.js'))}"></script>
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="canonical" href="${url}" />
    ${alt}
    ${feeds.map((f) => `<link rel="alternate" type="application/rss+xml" title="${esc(f.title)}" href="${SITE}${f.path}" />`).join('\n    ')}
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="author" content="Guillaume Richard" />
    <meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="Guillaume Richard" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:locale" content="${LOCALES[lang]}" />
    ${others.join('\n    ')}
    <meta property="og:image" content="${image.url}" />
    <meta property="og:image:width" content="${image.width}" />
    <meta property="og:image:height" content="${image.height}" />
    <meta property="og:image:alt" content="${esc(image.alt)}" />
    ${extraMeta}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${image.url}" />
    <meta name="twitter:image:alt" content="${esc(image.alt)}" />
    ${assets}
    ${ld ? `<script type="application/ld+json">${json(ld)}</script>` : ''}
  </head>
  <body>${body}
    ${[...scripts, '/js/nav.js', '/js/fx.js', '/js/palette.js', '/js/consent.js'].map((s) => `<script defer src="${esc(versioned(s))}"></script>`).join('\n    ')}
  </body>
</html>
`;
}
