import { defineConfig } from 'vitest/config';

// Tests unitaires du pré-rendu et du contenu. Les tests de bout en bout (tests/e2e) sont lancés par Playwright.
export default defineConfig({
  test: { include: ['tests/unit/**/*.test.js'] },
});
