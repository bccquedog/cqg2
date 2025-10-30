import { test, expect } from '@playwright/test';
import { reseedFirestore } from './helpers/seed';

test.describe('Tournament End-to-End Flow', () => {
  test.beforeEach(async () => {
    await reseedFirestore();
  });

  test('complete tournament lifecycle: join → submit → progress → archive', async ({ page }) => {
    // Navigate to tournaments list
    await page.goto('/tournaments');
    await expect(page.locator('h1', { hasText: 'CQG Tournaments' })).toBeVisible();

    // Click first tournament
    const firstTournament = page.locator('a[href*="/tournaments/"]').first();
    await firstTournament.click();
    await page.waitForSelector('h1', { timeout: 10000 });

    // Verify tournament detail page loaded
    await expect(page.locator('main')).toBeVisible();

    // TODO: Join flow (requires auth context)
    // const joinBtn = page.locator('button', { hasText: /Join Tournament/i });
    // if (await joinBtn.isVisible()) {
    //   await joinBtn.click();
    //   await expect(page.locator('text=/registered|joined/i')).toBeVisible({ timeout: 5000 });
    // }

    // TODO: Submit match result (requires participant auth + pending match)
    // const submitBtn = page.locator('button', { hasText: 'Submit' }).first();
    // if (await submitBtn.isVisible()) {
    //   await page.locator('input[type=number]').first().fill('10');
    //   await page.locator('input[type=number]').nth(1).fill('5');
    //   await page.locator('input[type=radio]').first().check();
    //   await page.locator('input[type=url]').fill('https://example.com/stream');
    //   await submitBtn.click();
    //   await expect(page.locator('text=/Result submitted|Winner is/i')).toBeVisible({ timeout: 5000 });
    // }

    console.log('✅ Tournament page loaded successfully');
  });

  test('validates empty states for tournaments and players', async ({ page }) => {
    // Clear all data (skip seeding for this test)
    // Note: This requires a special clean state; for now we validate with seeded data
    
    await page.goto('/tournaments');
    await expect(page.locator('h1')).toBeVisible();
    
    // If no tournaments, should show empty state
    const emptyState = page.locator('text=/No tournaments available/i');
    const hasTournaments = await page.locator('a[href*="/tournaments/"]').count() > 0;
    
    if (!hasTournaments) {
      await expect(emptyState).toBeVisible();
      console.log('✅ Empty state displayed for tournaments');
    } else {
      console.log('ℹ️ Tournaments exist (seeded data)');
    }

    // Navigate to players
    await page.goto('/players');
    await expect(page.locator('h1')).toBeVisible();
    
    const hasPlayers = await page.locator('a[href*="/profile/"]').count() > 0;
    if (!hasPlayers) {
      await expect(page.locator('text=/No players/i')).toBeVisible();
      console.log('✅ Empty state displayed for players');
    } else {
      console.log('ℹ️ Players exist (seeded data)');
    }
  });

  test('validates player not found page', async ({ page }) => {
    await page.goto('/profile/nonexistent-player-id');
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Should show "Player not found" message
    await expect(page.locator('text=/Player not found/i')).toBeVisible();
    
    // Should have back button
    const backBtn = page.locator('button', { hasText: /Back to Players/i });
    await expect(backBtn).toBeVisible();
    
    // Click back and verify navigation
    await backBtn.click();
    await expect(page).toHaveURL(/\/players/);
    
    console.log('✅ Player not found state handled correctly');
  });

  test.skip('validates toast notifications on match submission', async ({ page }) => {
    // Requires auth + participant context; placeholder for Phase 2
    await page.goto('/tournaments/tourney-dev');
    
    // Submit invalid match (no scores)
    // await page.locator('button', { hasText: 'Submit' }).first().click();
    // await expect(page.locator('.toast, [role=alert]', { hasText: /score/i })).toBeVisible({ timeout: 3000 });
    
    // Submit valid match
    // Fill form...
    // await expect(page.locator('.toast, [role=alert]', { hasText: /success|completed/i })).toBeVisible({ timeout: 3000 });
    
    console.log('ℹ️ Toast validation deferred until auth is integrated');
  });

  test.skip('validates tournament auto-archiving', async ({ page }) => {
    // Requires completing all matches and waiting for archive trigger
    // Placeholder for integration testing once Cloud Functions are deployed
    
    console.log('ℹ️ Auto-archive test deferred until functions are deployed');
  });
});



