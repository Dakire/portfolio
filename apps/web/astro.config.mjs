import { defineConfig } from 'astro/config';

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

export default defineConfig({
  site: 'https://grichard.eu',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Aucun CSS ni script en ligne : la CSP de production n'autorise ni 'unsafe-inline' pour les scripts ni, à terme, pour les styles.
    inlineStylesheets: 'never',
  },
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [styleguide],
});
