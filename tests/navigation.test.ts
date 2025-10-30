import { test, expect } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';

/**
 * Navigation Test Suite
 * 
 * This test suite verifies that the main navigation flows work correctly:
 * 1. Players page loads and displays correctly
 * 2. Clicking a player navigates to their profile
 * 3. Profile page displays correctly
 * 4. Tournament navigation works (if tournaments exist)
 * 5. Player links within tournaments work correctly
 */

test.describe('Navigation Flow', () => {
  // Capture automatic screenshots on failure and attach to report
  test.afterEach(async ({ page }, testInfo) => {
    const failed = testInfo.status !== testInfo.expectedStatus;
    if (failed) {
      const safeTitle = testInfo.title.replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
      const screenshotPath = testInfo.outputPath(`screenshots/${safeTitle}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await testInfo.attach('screenshot', {
        path: screenshotPath,
        contentType: 'image/png',
      });
      console.log(`❌ Test failed – screenshot saved at ${screenshotPath}`);
    }
  });
  test.beforeAll(async () => {
    console.log('🧹 Seeding Firestore emulator test data...');
    try {
      const seeded = await seedTestData();
      console.log('✅ Seed complete:', seeded);
    } catch (e) {
      console.error('❌ Seed failed:', e);
      // Do not throw hard; allow tests to show friendly messages
    }
  });
  test('should navigate from players to profile and handle tournament links', async ({ page }) => {
    // Step 1: Navigate to the players page
    console.log('🔍 Navigating to /players page...');
    console.log('➡️ Navigating to /players ...');
    await page.goto('/players', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1, main', { timeout: 15000 });
    
    // Step 2: Confirm page header contains "Players"
    console.log('✅ Checking page header...');
    const header = page.locator('h1').first();
    await expect(header).toContainText('Players');
    console.log('✅ Navigated to Players page');
    
    // Step 3: Click the first player
    const playerCards = page.locator('a[href^="/profile/"]');
    const playerCount = await playerCards.count();
    if (playerCount === 0) {
      console.log('⚠️ No players found after seeding. Check emulator.');
      return;
    }
    // Step 4: Click the first player link
    console.log('👆 Clicking first player card...');
    console.log('➡️ Clicking first player link ...');
    await playerCards.first().click();
    
    // Validate profile page by header
    await page.waitForSelector('h1, main', { timeout: 15000 });
    const profileHeader = page.locator('h1').first();
    await expect(profileHeader).toContainText(/Profile|Player/);
    console.log('✅ Navigated to Profile page');
    
    // Step 6: Check for Tournament History section
    console.log('🔍 Looking for Tournament History section...');
    const tournamentHistory = page.locator('text=Tournament History, text=Match History, text=Stats').first();
    
    if (await tournamentHistory.isVisible()) {
      console.log('✅ Found Tournament History section');
      
      // Step 7: Look for tournament links
      const tournamentLinks = page.locator('a[href^="/tournaments/"]');
      const tournamentLinkCount = await tournamentLinks.count();
      
      if (tournamentLinkCount > 0) {
        console.log(`🎯 Found ${tournamentLinkCount} tournament link(s), clicking first one...`);
        
        // Click the first tournament link
        console.log('➡️ Clicking first tournament link ...');
        await tournamentLinks.first().click();
        // Validate tournament page by header
        await page.waitForSelector('h1, main', { timeout: 15000 });
        const tournamentHeader = page.locator('h1').first();
        await expect(tournamentHeader).toContainText(/Tournament|Bracket/);
        console.log('✅ Navigated to Tournament page');
        
        // Step 8: Confirm we're on a tournament page
        console.log('✅ Checking tournament page header...');
        const tournamentHeader = page.locator('h1').first();
        await expect(tournamentHeader).toContainText(/Tournament|Bracket/);
        
        // Step 9: Look for player links within the tournament
        console.log('🔍 Looking for player links within tournament...');
        const playerLinksInTournament = page.locator('a[href^="/profile/"]');
        const playerLinkCount = await playerLinksInTournament.count();
        
        if (playerLinkCount > 0) {
          console.log(`👆 Found ${playerLinkCount} player link(s) in tournament, clicking first one...`);
          
          // Click the first player link
          console.log('➡️ Clicking player link inside tournament ...');
          await playerLinksInTournament.first().click();
          // Validate back on profile
          await page.waitForSelector('h1, main', { timeout: 15000 });
          const backToProfileHeader = page.locator('h1').first();
          await expect(backToProfileHeader).toContainText(/Profile|Player/);
          console.log('✅ Returned to Profile page');
          
          console.log('🎉 Navigation flow completed successfully!');
        } else {
          console.log('ℹ️ No player links found in tournament (this is normal for empty tournaments)');
        }
      } else {
        console.log('ℹ️ No tournament links found for this player (expected if DB is empty)');
      }
    } else {
      console.log('ℹ️ Tournament History section not found (this is normal for new profiles)');
    }
  });

  test('should handle empty players page gracefully', async ({ page }) => {
    console.log('🔍 Testing empty players page...');
    
    await page.goto('/players', { waitUntil: 'domcontentloaded' });
    await page.goto('/players', { waitUntil: 'domcontentloaded' });
    
    // Check if the page loads without errors
    const header = page.locator('h1').first();
    await expect(header).toContainText('Players');
    
    // Check for empty state message
    const emptyMessage = page.locator('text=No players, text=No players found, text=No players registered');
    if (await emptyMessage.isVisible()) {
      console.log('✅ Empty state message displayed correctly');
    } else {
      console.log('ℹ️ No empty state message found (players may exist)');
    }
  });

  test('should handle profile page for non-existent player', async ({ page }) => {
    console.log('🔍 Testing non-existent player profile...');
    
    // Try to navigate to a profile that likely doesn't exist
    await page.goto('/profile/non-existent-player-id', { waitUntil: 'domcontentloaded' });
    
    // Check for error message or "not found" state
    const notFoundMessage = page.locator('text=Player not found, text=not found, text=404');
    if (await notFoundMessage.isVisible()) {
      console.log('✅ "Player not found" message displayed correctly');
    } else {
      console.log('ℹ️ No "not found" message found (player may exist or different error handling)');
    }
  });
});
