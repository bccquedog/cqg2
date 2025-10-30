import { test, expect } from '@playwright/test';

const runSeeder = async () => {
  console.log('🧹 Seeding Golden Ticket test data...');
  const { execa } = await import('execa');
  await execa('npx', ['ts-node', 'scripts/seedGoldenTicketTest.ts'], { stdio: 'inherit' });
};

// Firestore REST helpers
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8085';
const PROJECT = 'demo-cqg';
async function rest(page: any, method: string, path: string, body?: any) {
  const url = `http://${EMULATOR_HOST}/v1/projects/${PROJECT}/databases/(default)/documents${path}`;
  const res = await page.request.fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    data: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

// Utility to set a test user in the app (best effort)
async function mockUser(page: any, uid: string, displayName = '') {
  await page.addInitScript((uid, displayName) => {
    (window as any).__TEST_USER__ = { uid, displayName };
  }, uid, displayName);
}

test.describe('Golden Ticket Flow', () => {
  test.beforeEach(async () => {
    await runSeeder();
  });

  test.afterAll(async () => {
    console.log('✅ Golden Ticket tests completed');
  });

  test('Successful Redemption (player1 -> GOLD-PLAYER1)', async ({ page }) => {
    await mockUser(page, 'player1', 'Player One');
    await page.goto('/redeem', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[placeholder*="Invite"], input[type="text"]', { timeout: 15000 });
    await page.getByRole('textbox').fill('GOLD-PLAYER1');
    await page.getByRole('button', { name: /redeem/i }).click();
    await expect(page.getByText('Invite redeemed successfully! Golden Ticket access unlocked 🎉')).toBeVisible({ timeout: 5000 });

    // Verify Firestore player doc
    const res = await rest(page, 'GET', `/players/player1`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    const fields = json.fields || {};
    expect(fields.hasGoldenTicket?.booleanValue).toBe(true);
    expect(fields.goldenTicketCode?.stringValue).toBe('GOLD-PLAYER1');
  });

  test('Duplicate Redemption (player1 again)', async ({ page }) => {
    await mockUser(page, 'player1', 'Player One');
    await page.goto('/redeem', { waitUntil: 'domcontentloaded' });
    await page.getByRole('textbox').fill('GOLD-PLAYER1');
    await page.getByRole('button', { name: /redeem/i }).click();
    await expect(page.getByText('This invite has already been used.')).toBeVisible({ timeout: 5000 });
  });

  test('Wrong User Redeeming (player2 tries GOLD-PLAYER1)', async ({ page }) => {
    await mockUser(page, 'player2', 'Player Two');
    await page.goto('/redeem', { waitUntil: 'domcontentloaded' });
    await page.getByRole('textbox').fill('GOLD-PLAYER1');
    await page.getByRole('button', { name: /redeem/i }).click();
    await expect(page.getByText('This invite has already been used.')).toBeVisible({ timeout: 5000 });

    const res = await rest(page, 'GET', `/players/player2`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    const fields = json.fields || {};
    expect(fields.hasGoldenTicket?.booleanValue || false).toBe(false);
  });

  test('Valid Code for Correct Player (player2 -> GOLD-PLAYER2)', async ({ page }) => {
    await mockUser(page, 'player2', 'Player Two');
    await page.goto('/redeem', { waitUntil: 'domcontentloaded' });
    await page.getByRole('textbox').fill('GOLD-PLAYER2');
    await page.getByRole('button', { name: /redeem/i }).click();
    await expect(page.getByText('Invite redeemed successfully! Golden Ticket access unlocked 🎉')).toBeVisible({ timeout: 5000 });

    const res = await rest(page, 'GET', `/players/player2`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    const fields = json.fields || {};
    expect(fields.hasGoldenTicket?.booleanValue).toBe(true);
    expect(fields.goldenTicketCode?.stringValue).toBe('GOLD-PLAYER2');
  });
});


