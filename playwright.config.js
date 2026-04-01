const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  projects: [{ name: 'chromium', use: { channel: 'chromium' } }],
});
