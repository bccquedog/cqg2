import { test, expect } from '@playwright/test';
import { reseedFirestore } from './helpers/seed';

// Lightweight validation-only UI tests. Profile-linking and write tests require
// authenticated participant context; keep them lean and fast.

test.describe('Match Submission Flow', () => {
  test.beforeEach(async () => {
    await reseedFirestore();
  });

  test('should reject invalid submissions', async ({ page }) => {
    await page.goto('/tournaments/tourney-e2e');
    const submitBtn = page.locator('button', { hasText: 'Submit' }).first();
    await submitBtn.click();
    await expect(page.locator('text=Please enter a score for both players')).toBeVisible();

    const scoreInputs = page.locator('input[type=number]');
    await scoreInputs.nth(0).fill('7');
    await scoreInputs.nth(1).fill('3');
    await submitBtn.click();
    await expect(page.locator('text=Please select a winner')).toBeVisible();

    const winnerRadio = page.locator('input[type=radio]').first();
    await winnerRadio.check();
    await submitBtn.click();
    await expect(page.locator('text=Please provide a stream/recording link')).toBeVisible();

    await page.locator('input[type=url]').fill('not-a-link');
    await submitBtn.click();
    await expect(page.locator('text=Stream link must start with http(s)://')).toBeVisible();
  });

  test.skip('should allow player to submit match score', async ({ page }) => {
    await page.goto('/tournaments/tourney-e2e');
    // Requires participant auth context and seeded match; implement when auth wiring is ready.
  });

  test.skip('winning player profile updated with win', async () => {
    // Requires participant auth context; verify players/{winner}/matchHistory contains new entry
  });

  test.skip('losing player profile updated with loss', async () => {
    // Requires participant auth context; verify players/{loser}/matchHistory contains new entry
  });
});


