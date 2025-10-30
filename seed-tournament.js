const admin = require('firebase-admin');

// Initialize Firebase Admin with emulator
const serviceAccount = require('./functions/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "demo-cqg"
});

// Connect to Firestore emulator
const db = admin.firestore();
db.settings({
  host: 'localhost:8080',
  ssl: false
});

// Generate 16 players with seeds
function generatePlayers() {
  const players = [];
  const names = [
    "AlphaWolf", "BetaStrike", "GammaForce", "DeltaRage",
    "EpsilonX", "ZetaBlast", "EtaStorm", "ThetaFire",
    "IotaShock", "KappaWave", "LambdaCore", "MuViper",
    "NuPhantom", "XiShadow", "OmicronBolt", "PiTitan"
  ];
  
  for (let i = 0; i < 16; i++) {
    players.push({
      id: `player_${i + 1}`,
      name: names[i],
      seed: i + 1,
      stats: {
        wins: Math.floor(Math.random() * 20),
        losses: Math.floor(Math.random() * 10),
        matchesPlayed: Math.floor(Math.random() * 30) + 10
      }
    });
  }
  
  return players;
}

// Create bracket pairings based on standard seeding
function createBracketPairings(players) {
  // Standard 16-player seeding: 1v16, 8v9, 4v13, 5v12, 2v15, 7v10, 3v14, 6v11
  const pairings = [
    [1, 16], [8, 9], [4, 13], [5, 12],
    [2, 15], [7, 10], [3, 14], [6, 11]
  ];
  
  return pairings.map(([seedA, seedB]) => ({
    playerA: players.find(p => p.seed === seedA),
    playerB: players.find(p => p.seed === seedB)
  }));
}

// Generate all rounds of matches
async function generateMatches(tournamentId, players) {
  const rounds = [];
  
  // Round 1: 8 matches (16 players -> 8 winners)
  const round1Pairings = createBracketPairings(players);
  const round1Matches = [];
  
  for (let i = 0; i < round1Pairings.length; i++) {
    const pairing = round1Pairings[i];
    const matchRef = db.collection('tournaments').doc(tournamentId).collection('matches').doc();
    
    await matchRef.set({
      round: 1,
      roundName: "Round 1",
      playerA: pairing.playerA.id,
      playerB: pairing.playerB.id,
      playerAData: pairing.playerA,
      playerBData: pairing.playerB,
      status: "pending",
      score: null,
      winner: null,
      matchIndex: i,
      createdAt: new Date()
    });
    
    round1Matches.push(matchRef.id);
  }
  
  rounds.push({
    roundNumber: 1,
    roundName: "Round 1",
    matches: round1Matches
  });
  
  // Round 2: 4 matches (8 winners -> 4 winners)
  const round2Matches = [];
  for (let i = 0; i < 4; i++) {
    const matchRef = db.collection('tournaments').doc(tournamentId).collection('matches').doc();
    
    await matchRef.set({
      round: 2,
      roundName: "Quarterfinals",
      playerA: null, // Will be determined by Round 1 results
      playerB: null,
      playerAData: null,
      playerBData: null,
      status: "pending",
      score: null,
      winner: null,
      matchIndex: i,
      createdAt: new Date(),
      dependsOn: [round1Matches[i * 2], round1Matches[i * 2 + 1]] // Which R1 matches feed into this
    });
    
    round2Matches.push(matchRef.id);
  }
  
  rounds.push({
    roundNumber: 2,
    roundName: "Quarterfinals",
    matches: round2Matches
  });
  
  // Round 3: 2 matches (4 winners -> 2 winners)
  const round3Matches = [];
  for (let i = 0; i < 2; i++) {
    const matchRef = db.collection('tournaments').doc(tournamentId).collection('matches').doc();
    
    await matchRef.set({
      round: 3,
      roundName: "Semifinals",
      playerA: null,
      playerB: null,
      playerAData: null,
      playerBData: null,
      status: "pending",
      score: null,
      winner: null,
      matchIndex: i,
      createdAt: new Date(),
      dependsOn: [round2Matches[i * 2], round2Matches[i * 2 + 1]]
    });
    
    round3Matches.push(matchRef.id);
  }
  
  rounds.push({
    roundNumber: 3,
    roundName: "Semifinals",
    matches: round3Matches
  });
  
  // Round 4: 1 match (2 winners -> 1 champion)
  const finalMatchRef = db.collection('tournaments').doc(tournamentId).collection('matches').doc();
  
  await finalMatchRef.set({
    round: 4,
    roundName: "Finals",
    playerA: null,
    playerB: null,
    playerAData: null,
    playerBData: null,
    status: "pending",
    score: null,
    winner: null,
    matchIndex: 0,
    createdAt: new Date(),
    dependsOn: round3Matches
  });
  
  rounds.push({
    roundNumber: 4,
    roundName: "Finals",
    matches: [finalMatchRef.id]
  });
  
  return rounds;
}

// Seed players into the players collection
async function seedPlayers(players) {
  console.log('🔥 Seeding players...');
  
  for (const player of players) {
    await db.collection('players').doc(player.id).set({
      username: player.name,
      gamerTag: player.name,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`,
      status: "online",
      bio: `Seed #${player.seed} player`,
      stats: player.stats,
      subscription: "gamer",
      streamUrl: Math.random() > 0.7 ? `https://twitch.tv/${player.name.toLowerCase()}` : null,
      createdAt: new Date(),
      lastActive: new Date()
    });
  }
  
  console.log(`✅ Seeded ${players.length} players`);
}

// Main seeding function
async function seedTournament() {
  try {
    console.log('🏆 Starting tournament seeding...');
    
    // Generate players
    const players = generatePlayers();
    
    // Seed players first
    await seedPlayers(players);
    
    // Create tournament document
    const tournamentRef = db.collection('tournaments').doc('test-tournament-16');
    
    console.log('🔥 Generating matches and rounds...');
    const rounds = await generateMatches('test-tournament-16', players);
    
    // Create the tournament document
    await tournamentRef.set({
      name: "CQG 16-Player Test Tournament",
      game: "Call of Duty",
      type: "single_elim",
      status: "upcoming",
      maxPlayers: 16,
      currentPlayers: 16,
      createdAt: new Date(),
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      rounds: rounds,
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        seed: p.seed
      })),
      settings: {
        format: "single_elimination",
        checkInWindow: 30,
        autoAdvance: false
      },
      themeConfig: {
        theme: "default",
        effectsEnabled: true,
        brandingEnabled: false,
        locked: false,
        playerClickMode: "modal"
      }
    });
    
    console.log('✅ Tournament seeded successfully!');
    console.log(`📊 Tournament ID: test-tournament-16`);
    console.log(`👥 Players: ${players.length}`);
    console.log(`🎯 Total Matches: ${rounds.reduce((sum, round) => sum + round.matches.length, 0)}`);
    console.log('🏁 Rounds:');
    rounds.forEach(round => {
      console.log(`   ${round.roundNumber}. ${round.roundName}: ${round.matches.length} matches`);
    });
    
    console.log('\n🌐 View at: http://localhost:3000/tournaments/test-tournament-16');
    
  } catch (error) {
    console.error('❌ Error seeding tournament:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seeding
seedTournament();


