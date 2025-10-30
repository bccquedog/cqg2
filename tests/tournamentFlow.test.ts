import { test, expect } from '@playwright/test';
import { connectEmulator, seedTournament, progressRound, findChampion } from '../scripts/tournamentUtils';
import { getFirestore } from 'firebase/firestore';

test.describe('Tournament Flow', () => {
  test.beforeAll(async () => {
    const { db } = await connectEmulator();
    await seedTournament(db, 'tourney-auto', 16);
  });

  test('auto-progresses and updates bracket until champion', async ({ page }) => {
    await page.goto('/tournaments/tourney-auto', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toBeVisible();

    // Progress rounds one by one and validate UI updates
    const { db } = await connectEmulator();

    for (let round = 1; round <= 4; round++) {
      // Progress round in DB
      await progressRound(db, 'tourney-auto', round);

      // Wait for UI to reflect
      await page.waitForTimeout(1500);
      await expect(page.locator('text=' + (round === 4 ? 'Final' : `Round ${round}`))).toBeVisible();
    }

    // Verify champion renders (either in header/badge or bracket summary)
    const champText = page.locator('text=/Champion|🏆/i');
    await expect(champText).toBeVisible();
  });
});




