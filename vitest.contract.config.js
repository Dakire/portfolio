import { defineConfig } from 'vitest/config';

// Contrat public : pnpm test:contract. Sans variable, vérifie le dossier construit ; CONTRACT_BASE_URL vise un site en ligne.
export default defineConfig({
  test: { include: ['tests/contract/**/*.test.js'], testTimeout: 30_000 },
});
