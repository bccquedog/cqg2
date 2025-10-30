import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface PlayerData {
  gamerTag: string;
  avatarUrl: string;
  status: string;
}

interface TournamentData {
  name: string;
  game: string;
  status: string;
  settings: {
    format: string;
    checkInWindow: number;
  };
  players: string[];
}

interface MatchData {
  playerA: string;
  playerB: string;
  status: string;
  score: any;
  winner: any;
}

interface EventData {
  title: string;
  type: string;
  status: string;
  streams: any[];
  startTime: string;
}

const sampleData = {
  players: {
    player1: {
      gamerTag: "PlayerOne",
      avatarUrl: "https://example.com/avatar1.png",
      status: "online"
    },
    player2: {
      gamerTag: "PlayerTwo",
      avatarUrl: "https://example.com/avatar2.png",
      status: "idle"
    },
    player3: {
      gamerTag: "PlayerThree",
      avatarUrl: "https://example.com/avatar3.png",
      status: "in_match"
    }
  },
  tournaments: {
    tourney1: {
      name: "CQG Beta Cup",
      game: "Call of Duty",
      status: "setup",
      settings: {
        format: "single_elimination",
        checkInWindow: 30
      },
      players: ["player1", "player2", "player3"]
    }
  },
  "tournaments/tourney1/matches": {
    match1: {
      playerA: "player1",
      playerB: "player2",
      status: "pending",
      score: null,
      winner: null
    }
  },
  events: {
    event1: {
      title: "CQG Pregame Test",
      type: "pregame",
      status: "upcoming",
      streams: [],
      startTime: "2025-09-15T19:00:00Z"
    }
  }
};

async function seedSampleData() {
  console.log('🌱 Seeding sample data...');

  try {
    // Seed players
    console.log('👥 Seeding players...');
    for (const [playerId, playerData] of Object.entries(sampleData.players)) {
      await db.collection('players').doc(playerId).set({
        ...playerData,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      });
      console.log(`   ✅ Created player: ${playerData.gamerTag} (${playerId})`);
    }

    // Seed tournaments
    console.log('🏆 Seeding tournaments...');
    for (const [tournamentId, tournamentData] of Object.entries(sampleData.tournaments)) {
      await db.collection('tournaments').doc(tournamentId).set({
        ...tournamentData,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      });
      console.log(`   ✅ Created tournament: ${tournamentData.name} (${tournamentId})`);
    }

    // Seed tournament matches
    console.log('🎮 Seeding tournament matches...');
    for (const [path, matches] of Object.entries(sampleData)) {
      if (path.startsWith('tournaments/') && path.includes('/matches')) {
        const [tournamentId] = path.split('/').slice(1, 2);
        for (const [matchId, matchData] of Object.entries(matches as Record<string, MatchData>)) {
          await db.collection('tournaments').doc(tournamentId)
            .collection('matches').doc(matchId).set({
              ...matchData,
              createdAt: admin.firestore.Timestamp.now(),
              updatedAt: admin.firestore.Timestamp.now()
            });
          console.log(`   ✅ Created match: ${matchData.playerA} vs ${matchData.playerB} (${matchId})`);
        }
      }
    }

    // Seed events
    console.log('📺 Seeding events...');
    for (const [eventId, eventData] of Object.entries(sampleData.events)) {
      await db.collection('events').doc(eventId).set({
        ...eventData,
        startTime: admin.firestore.Timestamp.fromDate(new Date(eventData.startTime)),
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      });
      console.log(`   ✅ Created event: ${eventData.title} (${eventId})`);
    }

    console.log('✅ Sample data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Players: ${Object.keys(sampleData.players).length}`);
    console.log(`   - Tournaments: ${Object.keys(sampleData.tournaments).length}`);
    console.log(`   - Matches: ${Object.keys(sampleData["tournaments/tourney1/matches"]).length}`);
    console.log(`   - Events: ${Object.keys(sampleData.events).length}`);

  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
    process.exit(1);
  }
}

// Run the seeding
seedSampleData().then(() => {
  console.log('🎉 Sample data seeding finished!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});


