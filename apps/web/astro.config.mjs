import { unified } from '@astrojs/markdown-remark';
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
    sitemap({ filter: (page) => !EXCLUDED.some((part) => page.includes(part)) }),
    styleguide,
  ],
});
