import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Omit the Svelte Vite plugin during tests to avoid hot-update configureServer errors
  plugins: [],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,js}'],
    exclude: ['tests/e2e/**', 'node_modules/**']
  }
});