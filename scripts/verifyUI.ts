import { execSync } from 'child_process';

async function verifyUI() {
  console.log('🔍 Verifying CQG Tournament UI...\n');
  
  try {
    // Check if Next.js server is running
    console.log('📡 Checking Next.js server...');
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ Next.js server is running on port 3000');
    } else {
      console.log('❌ Next.js server not responding');
      return;
    }

    // Check tournaments page
    console.log('\n🏆 Checking tournaments page...');
    const tournamentsResponse = await fetch('http://localhost:3000/tournaments');
    if (tournamentsResponse.ok) {
      const html = await tournamentsResponse.text();
      if (html.includes('Dry Run Test Tournament')) {
        console.log('✅ Tournament card visible on /tournaments page');
      } else {
        console.log('⚠️ Tournament card not found on /tournaments page');
      }
    } else {
      console.log('❌ Could not access /tournaments page');
    }

    // Check tournament detail page
    console.log('\n🎮 Checking tournament detail page...');
    const tournamentResponse = await fetch('http://localhost:3000/tournaments/tourney-test');
    if (tournamentResponse.ok) {
      const html = await tournamentResponse.text();
      if (html.includes('Dry Run Test Tournament')) {
        console.log('✅ Tournament detail page accessible');
      } else {
        console.log('⚠️ Tournament detail page not found');
      }
    } else {
      console.log('❌ Could not access tournament detail page');
    }

    console.log('\n🎉 UI verification completed!');
    console.log('\n📋 Manual Testing Checklist:');
    console.log('   1. Navigate to http://localhost:3000/tournaments');
    console.log('   2. Look for "Dry Run Test Tournament" card');
    console.log('   3. Click the tournament to view bracket');
    console.log('   4. Submit match results using the forms');
    console.log('   5. Watch auto-progression update the bracket');
    console.log('   6. Continue until champion is declared');

  } catch (error) {
    console.error('❌ UI verification failed:', error);
  }
}

verifyUI();


