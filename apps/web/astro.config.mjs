import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { unified } from '@astrojs/markdown-remark';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import rehypeBase from './src/lib/rehype-base.mjs';
import rehypeTableScroll from './src/lib/rehype-table-scroll.mjs';

// Préproduction : le site est servi depuis un sous-dossier (SITE_BASE=/preprod/). Production : racine.
const base = process.env.SITE_BASE ?? '/';

// Page de style (design system) : uniquement en développement, ou avec STYLEGUIDE=1 (préproduction). Jamais en production.
const styleguide = {
  name: 'styleguide',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'dev' || process.env.STYLEGUIDE === '1') {
        injectRoute({ pattern: '/design', entrypoint: './src/dev/design.astro' });
      }
    },
  },
};

// Sans clé de SITE Turnstile (publique), le widget disparaît et contact.php refuserait tous les messages : mieux vaut échouer au build.
const requireTurnstileKey = {
  name: 'require-turnstile-key',
  hooks: {
    'astro:config:setup': ({ command }) => {
      if (command !== 'build') return;
      const fromFiles = ['.env', '.env.local']
        .filter(existsSync)
        .map((f) => parseEnv(readFileSync(f, 'utf-8')));
      const key =
        process.env.PUBLIC_TURNSTILE_SITE_KEY ||
        Object.assign({}, ...fromFiles).PUBLIC_TURNSTILE_SITE_KEY;
      if (!key)
        throw new Error(
          'PUBLIC_TURNSTILE_SITE_KEY est manquante : le formulaire de contact serait inutilisable en production (voir .env.example).',
        );
    },
  },
};

// <lastmod> du sitemap : seulement des dates réelles (publication ou mise à jour des articles, lues dans leur en-tête).
// Les autres pages n'en ont pas : une date de build, qui change à chaque livraison, serait ignorée par Google.
function articleDates() {
  const dates = new Map();
  for (const [dir, prefix] of [
    ['src/content/blog', '/blog/'],
    ['src/content/blog/en', '/en/blog/'],
  ]) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const head = readFileSync(`${dir}/${file}`, 'utf-8').split('---')[1] ?? '';
      const date = /^updated:\s*(\S+)/m.exec(head)?.[1] ?? /^date:\s*(\S+)/m.exec(head)?.[1];
      if (date) dates.set(`${prefix}${file.replace(/\.md$/, '')}/`, date);
    }
  }
  // l'index du blog change avec son article le plus récent
  for (const prefix of ['/blog/', '/en/blog/']) {
    const latest = [...dates]
      .filter(([path]) => path.startsWith(prefix) && path !== prefix)
      .map(([, d]) => d)
      .sort()
      .at(-1);
    if (latest) dates.set(prefix, latest);
  }
  return dates;
}
const LASTMOD = articleDates();

// Pages absentes du sitemap : interne, erreur, et pages de filtre du blog (noindex).
const EXCLUDED = [
  '/design/',
  '/404',
  '/blog/categorie/',
  '/blog/tag/',
  '/en/blog/category/',
  '/en/blog/tag/',
];

export default defineConfig({
  site: 'https://grichard.eu',
  base,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Aucun CSS ni script en ligne : la CSP de production n'autorise ni 'unsafe-inline' pour les scripts ni pour les feuilles de style.
    inlineStylesheets: 'never',
  },
  vite: { build: { assetsInlineLimit: 0 } },
  markdown: {
    // Coloration au build (aucun JavaScript côté visiteur) ; couleurs par variables CSS, une par thème (voir styles/site.css).
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false },
    processor: unified({ rehypePlugins: [rehypeTableScroll, [rehypeBase, { base }]] }),
  },
  integrations: [
    requireTurnstileKey,
    preact(),
    sitemap({
      filter: (page) => !EXCLUDED.some((part) => page.includes(part)),
      serialize(item) {
        const date = LASTMOD.get(
          new URL(item.url).pathname.replace(base.replace(/\/$/, ''), '') || '/',
        );
        return date ? { ...item, lastmod: new Date(`${date}T00:00:00Z`).toISOString() } : item;
      },
    }),
    styleguide,
  ],
});
