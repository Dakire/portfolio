import { defineConfig } from 'vitest/config';

// Tests contre les vrais résolveurs DNS (npm run test:live) : séparés des tests unitaires, qui ne touchent jamais le réseau.
export default defineConfig({
  test: { include: ['tests/live/**/*.test.js'], testTimeout: 30_000 },
});
