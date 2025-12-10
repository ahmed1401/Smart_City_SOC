import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { createHmac } from 'node:crypto';

const shouldRun = process.env.RUN_E2E === '1';
const defaultApiKey = process.env.PLAYWRIGHT_API_KEY ?? 'citizen-api-key';
const defaultJwt = process.env.PLAYWRIGHT_JWT ?? generateCitizenJwt();

test.describe('Smart City dashboard smoke', () => {
  test.skip(!shouldRun, 'Set RUN_E2E=1 and start docker compose to run e2e tests');

  test.beforeEach(async ({ page }) => {
    page.on('console', (message) => console.log(`[browser] ${message.type()}: ${message.text()}`));
    page.on('pageerror', (error) => console.error('[pageerror]', error));
    await page.addInitScript(({ apiKey, jwt }) => {
      window.localStorage.setItem('smartcity_api_key', apiKey);
      window.localStorage.setItem('smartcity_jwt', jwt);
    }, { apiKey: defaultApiKey, jwt: defaultJwt });
  });

  test('dashboard renders summary cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Tableau de bord AQI' })).toBeVisible();
    await expect(page.getByText('Alertes récentes')).toBeVisible({ timeout: 15000 });
  });

  test('navigation switches to planner', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Planificateur' }).click();
    await expect(page.getByRole('heading', { name: 'Planificateur multimodal SmartFlow' })).toBeVisible();
  });
});

function generateCitizenJwt() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ iss: 'citizen-app', exp: Math.floor(Date.now() / 1000) + 3600 })
  ).toString('base64url');
  const token = `${header}.${payload}`;
  const signature = createHmac('sha256', 'supersecretcitizen').update(token).digest('base64url');
  return `${token}.${signature}`;
}
