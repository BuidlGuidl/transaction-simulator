import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/__tests__/setup.ts'],
    environment: 'node',
    testTimeout: 30000, // Anvil might take a while to start up
  },
}); 