import * as admin from 'firebase-admin';
import * as readline from 'readline';
import { Profile } from '../src/types/profile';
import { Tournament, TournamentPlayer, League, LeagueTeam } from '../src/types/events';

console.log(
  process.env.npm_lifecycle_event === "seed:cjs"
    ? "📦 Running seed in CommonJS mode"
    : "🚀 Running seed in ESM mode"
);

// Initialize Firebase Admin SDK
// This will use GOOGLE_APPLICATION_CREDENTIALS environment variable
// or default credentials if running on Google Cloud
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
  });
}

const db = admin.firestore();

// Toggle for seeding Golden Ticket invites
const SEED_GOLDEN_TICKET = true; // toggle to enable/disable
const GOLDEN_TICKET_BATCH: { code: string; type: string }[] = [
  { code: "CQG-GOLD-TEST", type: "golden" },
  { code: "CQG-GOLD-ALT", type: "golden" }
];

// Dummy data definitions
const dummyUser: Profile = {
  id: "testUser1",
  username: "CQG Tester",
  email: "tester@cqg.gg",
  avatarUrl: undefined,
  tier: "Gamer",
  wins: 5,
  losses: 3,
  tournamentsWon: 1,
  leaguesWon: 0,
  createdAt: Date.now() as any, // Using any to avoid timestamp type issues in root seeder
  updatedAt: Date.now() as any, // Using any to avoid timestamp type issues in root seeder
};

const dummyTournament: any = {
  id: "testTournament1",
  name: "CQG Test Tournament",
  game: "Call of Duty",
  type: "solo",
  status: "setup",
  startTime: Date.now(),
  endTime: undefined,
  settings: {
    maxTeams: 16,
    checkInRequired: true,
    streamRequired: false,
  },
  players: [
    {
      userId: "testUser1",
      joinedAt: Date.now(),
    } as TournamentPlayer,
  ],
  rounds: [],
  champion: undefined,
  matches: [
    {
      id: "match1",
      tournamentId: "testTournament1",
      round: 1,
      players: ["testUser1", "testUser2"],
      scores: { testUser1: 100, testUser2: 85 },
      winner: "testUser1",
      streamUrl: "https://twitch.tv/teststream",
      submittedAt: Date.now(),
      verified: true,
      disputed: false,
      resolved: false,
    },
    {
      id: "match2",
      tournamentId: "testTournament1",
      round: 1,
      players: ["testUser2", "testUser3"],
      scores: { testUser2: 95, testUser3: 90 },
      winner: "testUser2",
      streamUrl: undefined,
      submittedAt: Date.now(),
      verified: false,
      disputed: true,
      disputeReason: "Score discrepancy reported by player",
      resolved: false,
    }
  ],
  createdAt: Date.now() as any, // Using any to avoid timestamp type issues in root seeder
};

const dummyLeague: League = {
  id: "testLeague1",
  name: "CQG Test League",
  season: "Season 1",
  type: "solo",
  participants: ["testUser1", "testUser2"],
  stats: { matchesPlayed: 10, wins: 5, losses: 5 },
  createdAt: Date.now() as any, // Using any to avoid timestamp type issues in root seeder
};

// Additional test users for more comprehensive testing
const additionalUsers: Profile[] = [
  {
    id: "testUser2",
    username: "Tournament Master",
    email: "master@cqg.gg",
    avatarUrl: undefined,
    tier: "King",
    wins: 25,
    losses: 8,
    tournamentsWon: 5,
    leaguesWon: 2,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "testUser3",
    username: "League Champion",
    email: "champion@cqg.gg",
    avatarUrl: undefined,
    tier: "Elite",
    wins: 42,
    losses: 12,
    tournamentsWon: 8,
    leaguesWon: 4,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Additional test tournaments
const additionalTournaments: any[] = [
  {
    id: "testTournament2",
    name: "CQG Championship Series",
    game: "FIFA 24",
    type: "clan",
    status: "live",
    startTime: Date.now() - 86400000, // 1 day ago
    endTime: undefined,
    settings: {
      maxTeams: 32,
      checkInRequired: true,
      streamRequired: true,
    },
    players: [
      { userId: "testUser1", joinedAt: Date.now() - 86400000 } as TournamentPlayer,
      { userId: "testUser2", joinedAt: Date.now() - 86400000 } as TournamentPlayer,
      { userId: "testUser3", joinedAt: Date.now() - 86400000 } as TournamentPlayer,
    ],
    rounds: [],
    champion: undefined,
      matches: [
    {
      id: "match-001",
      tournamentId: "testTournament2",
      round: 1,
      players: ["testUser1", "testUser2"],
      scores: { testUser1: 100, testUser2: 85 },
      winner: "testUser1",
      streamUrl: "https://twitch.tv/cqg-championship",
      submittedAt: Date.now() - 3600000, // 1 hour ago
      verified: true,
      disputed: false,
      resolved: false,
    },
    {
      id: "match-002",
      tournamentId: "testTournament2",
      round: 1,
      players: ["testUser2", "testUser3"],
      scores: { testUser2: 95, testUser3: 90 },
      winner: "testUser2",
      streamUrl: undefined,
      submittedAt: Date.now() - 1800000, // 30 minutes ago
      verified: false,
      disputed: true,
      disputeReason: "Score discrepancy reported by player",
      resolved: false,
    },
    {
      id: "match-003",
      tournamentId: "testTournament2",
      round: 2,
      players: ["testUser1", "testUser2"],
      scores: { testUser1: 110, testUser2: 105 },
      winner: "testUser1",
      streamUrl: "https://twitch.tv/cqg-finals",
      submittedAt: Date.now() - 900000, // 15 minutes ago
      verified: true,
      disputed: true,
      disputeReason: "Connection issues during match",
      resolved: true,
      resolvedBy: "admin1",
      resolutionNotes: "Match replayed due to technical issues",
    },
    {
      id: "match-004",
      tournamentId: "testTournament2",
      round: 1,
      players: ["testUser3", "testUser1"],
      scores: { testUser3: 120, testUser1: 95 },
      winner: "testUser3",
      streamUrl: undefined,
      submittedAt: Date.now() - 1800000, // 30 minutes ago
      verified: false,
      disputed: false,
      resolved: false,
    }
    ],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 1800000,
  },
];

// Additional test leagues
const additionalLeagues: League[] = [
  {
    id: "testLeague2",
    name: "CQG Pro Circuit",
    season: "Winter 2024",
    type: "clan",
    participants: ["clan1", "clan2"],
    stats: { matchesPlayed: 8, wins: 4, losses: 4 },
    createdAt: Date.now() - 172800000 as any, // 2 days ago
  },
];

async function seedUsers() {
  console.log('🌱 Seeding users...');
  
  const usersToSeed = [dummyUser, ...additionalUsers];
  
  for (const user of usersToSeed) {
    try {
      await db.collection('users').doc(user.id).set(user);
      console.log(`  ✅ Created user: ${user.username} (${user.id})`);
    } catch (error) {
      console.error(`  ❌ Failed to create user ${user.id}:`, error);
    }
  }
}

async function seedTournaments() {
  console.log('🏆 Seeding tournaments...');
  
  const tournamentsToSeed = [dummyTournament, ...additionalTournaments];
  
  for (const tournament of tournamentsToSeed) {
    try {
      await db.collection('tournaments').doc(tournament.id).set(tournament);
      console.log(`  ✅ Created tournament: ${tournament.name} (${tournament.id})`);
      if (tournament.matches && tournament.matches.length > 0) {
        console.log(`    📊 Includes ${tournament.matches.length} matches`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to create tournament ${tournament.id}:`, error);
    }
  }
}

async function seedLeagues() {
  console.log('🏅 Seeding leagues...');
  
  const leaguesToSeed = [dummyLeague, ...additionalLeagues];
  
  for (const league of leaguesToSeed) {
    try {
      if (!league.id) {
        console.error(`  ❌ League missing ID: ${league.name}`);
        continue;
      }
      await db.collection('leagues').doc(league.id).set(league);
      console.log(`  ✅ Created league: ${league.name} (${league.id})`);
      if (league.stats && league.stats.matchesPlayed > 0) {
        console.log(`    📊 Stats: ${league.stats.matchesPlayed} matches played`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to create league ${league.id}:`, error);
    }
  }
}

async function seedGoldenTicketInvitesBatch(batch: { code: string; type: string }[]) {
  if (!SEED_GOLDEN_TICKET) {
    console.log('⚠️ Golden Ticket seeding skipped.');
    return;
  }
  if (!batch || batch.length === 0) {
    console.log('⚠️ Golden Ticket batch is empty. Skipping.');
    return;
  }
  const codes: string[] = [];
  for (const item of batch) {
    const ref = db.collection('invites').doc(item.code);
    await ref.set({
      code: item.code,
      type: item.type,
      status: 'unused',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      usedBy: null,
    }, { merge: false });
    codes.push(item.code);
  }
  console.log(`✅ Golden Ticket invites seeded: ${codes.join(', ')}`);
}

async function main() {
  console.log('🚀 Starting CQG Firestore seeding...\n');
  
  try {
    const db = admin.firestore();
    const force = process.argv.includes('--force');
    // Reset ALL flag
    if (process.argv.includes('--resetAll')) {
      console.log('🧹 Resetting ALL tournaments and players...');
      if (!force) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const question = (q: string) => new Promise<string>(res => rl.question(q, res));
        const ans = (await question('⚠️ Are you sure you want to delete ALL tournaments and players? (y/N) ')).trim().toLowerCase();
        rl.close();
        if (ans !== 'y' && ans !== 'yes') {
          console.log('❎ Cancelled.');
          process.exit(0);
        }
      }
      // Delete tournaments with subcollections
      const tourSnap = await db.collection('tournaments').get();
      for (const t of tourSnap.docs) {
        const tourRef = t.ref;
        const subcols = ['matches', 'players', 'timeline', 'highlights'];
        for (const c of subcols) {
          const snap = await tourRef.collection(c).get();
          const batch = db.batch();
          snap.forEach((d) => batch.delete(d.ref));
          if (!snap.empty) await batch.commit();
        }
        await tourRef.delete().catch(() => {});
      }
      // Delete players collection
      const playersSnap = await db.collection('players').get();
      if (!playersSnap.empty) {
        const batch = db.batch();
        playersSnap.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      console.log('✅ All tournaments and players removed');
      process.exit(0);
    }
    // Reset polish tournament flag
    if (process.argv.includes('--resetPolish')) {
      console.log('🧹 Resetting polish tournament...');
      const tid = 'tourney-polish';
      const tourRef = db.collection('tournaments').doc(tid);
      // Delete subcollections
      const subcols = ['matches', 'players', 'timeline', 'highlights'];
      for (const c of subcols) {
        const snap = await tourRef.collection(c).get();
        const batch = db.batch();
        snap.forEach((d) => batch.delete(d.ref));
        if (!snap.empty) await batch.commit();
      }
      await tourRef.delete().catch(() => {});
      console.log('✅ tourney-polish removed');
      process.exit(0);
    }

    // Seed all collections
    await seedUsers();
    console.log('');
    await seedTournaments();
    console.log('');
    await seedLeagues();
    console.log('');
    await seedGoldenTicketInvitesBatch(GOLDEN_TICKET_BATCH);
    console.log('');
    
    console.log('🎉 ✅ Seeding complete!');
    console.log('\n📋 Test Data Summary:');
    console.log(`  👥 Users: ${[dummyUser, ...additionalUsers].length} created`);
    console.log(`  🏆 Tournaments: ${[dummyTournament, ...additionalTournaments].length} created`);
    console.log(`  🏅 Leagues: ${[dummyLeague, ...additionalLeagues].length} created`);
    console.log('\n🔑 Test IDs for Readiness Test:');
    console.log(`  User ID: testUser1, testUser2, testUser3`);
    console.log(`  Tournament ID: testTournament1, testTournament2`);
    console.log(`  League ID: testLeague1, testLeague2`);
    console.log('\n🌐 Visit: http://localhost:3001/readiness-test');
    
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  main().catch(console.error);
}
