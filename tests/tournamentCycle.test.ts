import { test, expect } from '@playwright/test';
import { reseedFirestore } from './helpers/seed';

test.describe('Tournament Lifecycle', () => {
  test.beforeEach(async () => {
    await reseedFirestore();
  });

  test.skip('should progress automatically until a champion is declared', async ({ page }) => {
    await page.goto('/tournaments/tourney-e2e');

    // Round 1: simulate match results (placeholder interactions)
    console.log('✅ Reporting Round 1 results...');
    await page.getByTestId('report-result-player1').click();
    await page.getByTestId('report-result-player2').click();

    // Round 2 auto-generated
    await expect(page.getByText('Round 2')).toBeVisible();

    // Report Round 2 results
    console.log('✅ Reporting Round 2 results...');
    await page.getByTestId('report-result-player1').click();

    // Champion auto-detected
    await expect(page.getByText(/Champion/i)).toBeVisible();
  });

  test.skip('should close bracket after champion is declared', async ({ page }) => {
    await page.goto('/tournaments/tourney-e2e');

    // Fast-forward results until champion
    console.log('✅ Completing all matches...');
    const resultButtons = page.getByTestId(/report-result-/);
    const count = await resultButtons.count();
    for (let i = 0; i < count; i++) {
      await resultButtons.nth(i).click();
    }

    // Bracket should auto-close
    await expect(page.getByText(/Tournament Complete/i)).toBeVisible();
  });
});




