import { execSync } from 'node:child_process';

if (process.env.RUN_E2E !== '1') {
  console.log('Skipping Playwright tests (set RUN_E2E=1 and start the stack to enable).');
  process.exit(0);
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173';
const maxAttempts = Number(process.env.PLAYWRIGHT_WAIT_ATTEMPTS ?? 30);
const delayMs = Number(process.env.PLAYWRIGHT_WAIT_DELAY_MS ?? 1000);
const requestTimeoutMs = Number(process.env.PLAYWRIGHT_WAIT_TIMEOUT ?? 3000);

async function waitForDashboardReady() {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
      const response = await fetch(baseURL, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`Playwright base URL ${baseURL} is ready (attempt ${attempt}).`);
        return;
      }

      console.log(`Dashboard responded with HTTP ${response.status} (attempt ${attempt}/${maxAttempts}).`);
    } catch (error) {
      console.log(`Dashboard not reachable yet (${attempt}/${maxAttempts}): ${error.message}`);
    }

    await sleep(delayMs);
  }

  throw new Error(`Timed out after ${maxAttempts} attempts waiting for ${baseURL}.`);
}

await waitForDashboardReady();
execSync('npx playwright test', { stdio: 'inherit' });
