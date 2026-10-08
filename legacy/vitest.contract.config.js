import { defineConfig } from 'vitest/config';

// Contrat public (npm run test:contract) : dist/ par défaut, un site en ligne avec CONTRACT_BASE_URL.
export default defineConfig({
  test: { include: ['tests/contract/**/*.test.js'], testTimeout: 30_000 },
});
