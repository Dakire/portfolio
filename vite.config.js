import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Sans clé de site Turnstile, le widget disparaît et contact.php refuse tous les messages : mieux vaut échouer au build.
  if (command === 'build') {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    if (!env.VITE_TURNSTILE_SITE_KEY) {
      throw new Error('VITE_TURNSTILE_SITE_KEY est manquante : le formulaire de contact serait inutilisable en production (voir .env.example).');
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    // dist/.vite/manifest.json : liste des fichiers produits, lue par scripts/prerender.js (supprimée ensuite).
    build: { manifest: true },
  };
});
