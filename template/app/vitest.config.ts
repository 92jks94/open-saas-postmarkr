import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: [
      'node_modules',
      '.wasp/**/*',
      'e2e-tests/**/*'
    ],
  },
});
