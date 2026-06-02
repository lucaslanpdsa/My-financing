const { defineConfig } = require('@playwright/test');

// Testes de UI pura rodam em localhost
// Testes que precisam de autenticação real rodam no deploy
const BASE_URL = process.env.TEST_URL || 'https://my-financing.vercel.app';
const USE_LOCAL = BASE_URL.includes('localhost');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000,
  retries: 0,
  ...(USE_LOCAL ? {
    webServer: {
      command: 'npx http-server . -p 3333 -c-1 --silent',
      url: 'http://localhost:3333',
      reuseExistingServer: true,
    }
  } : {}),
  use: {
    baseURL: BASE_URL,
    headless: true,
    screenshot: 'only-on-failure',
  },
});
