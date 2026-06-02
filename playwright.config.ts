import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env['TEST_URL'] ?? 'http://localhost:4200';
const IS_LOCAL = BASE_URL.includes('localhost');

export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  retries: 0,
  ...(IS_LOCAL ? {
    webServer: {
      command: 'npx ng serve --port 4200',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 120000,
    },
  } : {}),
  use: {
    baseURL: BASE_URL,
    headless: true,
    screenshot: 'only-on-failure',
  },
});
