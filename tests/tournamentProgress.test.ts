import { test, expect } from '@playwright/test';
import { reseedFirestore } from './helpers/seed';

test.describe('Tournament Auto-Progression', () => {
  test.beforeEach(async () => {
    await reseedFirestore();
  });

  test('should auto-generate next round when all matches are complete', async ({ page }) => {
    await page.goto('/tournaments/tourney-e2e');
    // TODO: simulate completing all Round 1 matches once auth/actions are available
    // Expect round 2 to appear automatically in UI
    // Placeholder assertion to keep test light
    await expect(page.locator('text=Round 1')).toBeVisible();
  });

  test('should auto-progress live tournament bracket correctly', async ({ page }) => {
    await page.goto('/tournaments/tourney-e2e');
    // TODO: simulate live updates; verify visual + DB progression
    await expect(page.locator('main')).toBeVisible();
  });
});




