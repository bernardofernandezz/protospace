import { defineConfig, devices } from '@playwright/test'

// Testes de fumaça contra o build de produção, servido com os mesmos cabeçalhos (CSP etc.) do vercel.json.
export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || undefined,
      // WebGL por software (SwiftShader) em máquinas sem GPU, como o runner do CI
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    // Safari (motor WebKit) como num iPhone: só no CI, porque o WebKit do Playwright não instala em toda distro Linux
    ...(process.env.CI ? [{ name: 'iphone', use: { ...devices['iPhone 14'], launchOptions: {} } }] : []),
  ],
  webServer: { command: 'node scripts/serve.mjs 4173', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI },
})
