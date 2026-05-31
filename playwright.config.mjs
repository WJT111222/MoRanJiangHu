import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.mjs',
  testIgnore: ['**/fixtures/**', '**/e2e-current.spec.mjs'],
  fullyParallel: false,
  reporter: 'line',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
});
