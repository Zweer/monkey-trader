import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary'],
      include: ['lib/**/*.ts', 'app/**/*.ts'],
      exclude: ['**/index.ts', '**/types.ts', '**/*.test.ts'],
    },
  },
  resolve: {
    alias: { '@': '.' },
  },
});
