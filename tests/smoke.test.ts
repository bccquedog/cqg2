import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('Homepage loads', async ({ page }) => {
    console.log('➡️ Visiting /');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1, main', { timeout: 15000 });
    // Basic sanity: nav links exist
    await expect(page.locator('a[href="/tournaments"]')).toBeVisible();
    await expect(page.locator('a[href="/players"]')).toBeVisible();
  });

  test('Tournaments page loads and shows data or empty state', async ({ page }) => {
    console.log('➡️ Visiting /tournaments');
    await page.goto('/tournaments', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1, main', { timeout: 15000 });
    const header = page.locator('h1');
    await expect(header).toContainText(/Tournaments|CQG Tournaments/i);
    // Either cards exist or empty message
    const anyCard = page.locator('a[href^="/tournaments/"]');
    const emptyMsg = page.getByText(/No tournaments/i);
    await expect(anyCard.or(emptyMsg)).toBeVisible({ timeout: 5000 });
  });

  test('Players page loads and shows data or empty state', async ({ page }) => {
    console.log('➡️ Visiting /players');
    await page.goto('/players', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1, main', { timeout: 15000 });
    const header = page.locator('h1');
    await expect(header).toContainText(/Players/i);
    // Either player links/cards exist or empty message
    const anyPlayer = page.locator('a[href^="/profile/"]');
    const emptyMsg = page.getByText(/No players/i);
    await expect(anyPlayer.or(emptyMsg)).toBeVisible({ timeout: 5000 });
  });
});




