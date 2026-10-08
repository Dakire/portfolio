import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { unified } from '@astrojs/markdown-remark';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import rehypeTableScroll from './src/lib/rehype-table-scroll.mjs';

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
    processor: unified({ rehypePlugins: [rehypeTableScroll] }),
  },
  integrations: [
    requireTurnstileKey,
    preact(),
    sitemap({ filter: (page) => !EXCLUDED.some((part) => page.includes(part)) }),
    styleguide,
  ],
});
