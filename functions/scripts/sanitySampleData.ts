import * as admin from 'firebase-admin';
import { Player, Tournament, TournamentMatch, Event } from '../src/types/sampleData';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function sanityCheckSampleData() {
  console.log('🔍 Running sanity check on sample data...');

  try {
    let totalIssues = 0;
    const issues: string[] = [];

    // Check players
    console.log('\n👥 Checking players...');
    const playersSnapshot = await db.collection('players').get();
    const players: Player[] = [];
    
    playersSnapshot.forEach(doc => {
      const data = doc.data() as Player;
      players.push({ ...data, id: doc.id } as Player & { id: string });
    });

    console.log(`   Found ${players.length} players`);
    
    // Validate player data
    for (const player of players) {
      if (!player.gamerTag) {
        issues.push(`Player ${player.id}: Missing gamerTag`);
        totalIssues++;
      }
      if (!player.avatarUrl) {
        issues.push(`Player ${player.id}: Missing avatarUrl`);
        totalIssues++;
      }
      if (!player.status) {
        issues.push(`Player ${player.id}: Missing status`);
        totalIssues++;
      }
    }

    // Check tournaments
    console.log('\n🏆 Checking tournaments...');
    const tournamentsSnapshot = await db.collection('tournaments').get();
    const tournaments: Tournament[] = [];
    
    tournamentsSnapshot.forEach(doc => {
      const data = doc.data() as Tournament;
      tournaments.push({ ...data, id: doc.id } as Tournament & { id: string });
    });

    console.log(`   Found ${tournaments.length} tournaments`);
    
    // Validate tournament data
    for (const tournament of tournaments) {
      if (!tournament.name) {
        issues.push(`Tournament ${tournament.id}: Missing name`);
        totalIssues++;
      }
      if (!tournament.game) {
        issues.push(`Tournament ${tournament.id}: Missing game`);
        totalIssues++;
      }
      if (!tournament.status) {
        issues.push(`Tournament ${tournament.id}: Missing status`);
        totalIssues++;
      }
      if (!tournament.settings) {
        issues.push(`Tournament ${tournament.id}: Missing settings`);
        totalIssues++;
      } else {
        if (!tournament.settings.format) {
          issues.push(`Tournament ${tournament.id}: Missing settings.format`);
          totalIssues++;
        }
        if (typeof tournament.settings.checkInWindow !== 'number') {
          issues.push(`Tournament ${tournament.id}: Invalid checkInWindow`);
          totalIssues++;
        }
      }
      if (!Array.isArray(tournament.players)) {
        issues.push(`Tournament ${tournament.id}: Invalid players array`);
        totalIssues++;
      }
    }

    // Check tournament matches
    console.log('\n🎮 Checking tournament matches...');
    let totalMatches = 0;
    
    for (const tournament of tournaments) {
      const matchesSnapshot = await db.collection('tournaments')
        .doc(tournament.id)
        .collection('matches')
        .get();
      
      const matches: TournamentMatch[] = [];
      matchesSnapshot.forEach(doc => {
        const data = doc.data() as TournamentMatch;
        matches.push({ ...data, id: doc.id } as TournamentMatch & { id: string });
      });

      console.log(`   Tournament ${tournament.name}: ${matches.length} matches`);
      totalMatches += matches.length;
      
      // Validate match data
      for (const match of matches) {
        if (!match.playerA) {
          issues.push(`Match ${match.id} in ${tournament.id}: Missing playerA`);
          totalIssues++;
        }
        if (!match.playerB) {
          issues.push(`Match ${match.id} in ${tournament.id}: Missing playerB`);
          totalIssues++;
        }
        if (!match.status) {
          issues.push(`Match ${match.id} in ${tournament.id}: Missing status`);
          totalIssues++;
        }
        
        // Check if players exist
        if (match.playerA && !players.find(p => p.id === match.playerA)) {
          issues.push(`Match ${match.id}: PlayerA ${match.playerA} not found`);
          totalIssues++;
        }
        if (match.playerB && !players.find(p => p.id === match.playerB)) {
          issues.push(`Match ${match.id}: PlayerB ${match.playerB} not found`);
          totalIssues++;
        }
      }
    }

    // Check events
    console.log('\n📺 Checking events...');
    const eventsSnapshot = await db.collection('events').get();
    const events: Event[] = [];
    
    eventsSnapshot.forEach(doc => {
      const data = doc.data() as Event;
      events.push({ ...data, id: doc.id } as Event & { id: string });
    });

    console.log(`   Found ${events.length} events`);
    
    // Validate event data
    for (const event of events) {
      if (!event.title) {
        issues.push(`Event ${event.id}: Missing title`);
        totalIssues++;
      }
      if (!event.type) {
        issues.push(`Event ${event.id}: Missing type`);
        totalIssues++;
      }
      if (!event.status) {
        issues.push(`Event ${event.id}: Missing status`);
        totalIssues++;
      }
      if (!event.startTime) {
        issues.push(`Event ${event.id}: Missing startTime`);
        totalIssues++;
      }
      if (!Array.isArray(event.streams)) {
        issues.push(`Event ${event.id}: Invalid streams array`);
        totalIssues++;
      }
    }

    // Summary
    console.log('\n📊 Sanity Check Summary:');
    console.log(`   Players: ${players.length}`);
    console.log(`   Tournaments: ${tournaments.length}`);
    console.log(`   Matches: ${totalMatches}`);
    console.log(`   Events: ${events.length}`);
    console.log(`   Issues Found: ${totalIssues}`);

    if (totalIssues > 0) {
      console.log('\n❌ Issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('\n✅ All data looks good! No issues found.');
    }

    // Data relationships check
    console.log('\n🔗 Checking data relationships...');
    
    // Check if tournament players exist
    for (const tournament of tournaments) {
      for (const playerId of tournament.players) {
        if (!players.find(p => p.id === playerId)) {
          issues.push(`Tournament ${tournament.id}: Player ${playerId} not found`);
          totalIssues++;
        }
      }
    }

    if (totalIssues === 0) {
      console.log('✅ All relationships are valid!');
    } else {
      console.log(`❌ Found ${totalIssues} relationship issues`);
    }

    return totalIssues === 0;

  } catch (error) {
    console.error('❌ Error during sanity check:', error);
    return false;
  }
}

// Run the sanity check
sanityCheckSampleData().then((success) => {
  if (success) {
    console.log('\n🎉 Sanity check completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Sanity check failed!');
    process.exit(1);
  }
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});


