import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [angular({ tsconfig: 'tsconfig.spec.json' })],
  test: {
    globals: true,
    environment: 'jsdom',
    // The Angular plugin defaults to vmThreads, where jsdom's location can't be stubbed.
    pool: 'forks',
    // Vitest stubs CSS by default; specs assert computed styles from component styleUrls.
    css: true,
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
  },
});
