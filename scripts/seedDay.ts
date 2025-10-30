import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const app = initializeApp({ projectId: "demo-cqg" });
const db = getFirestore(app);

// Pool of gamer tags for random assignment
const gamerTags = [
  "ShadowStrike", "PixelPhantom", "NovaSniper", "TurboLlama",
  "GhostWolf", "CrimsonClutch", "ByteBreaker", "ApexViper",
  "IronFang", "NeonPulse", "VortexHawk", "FrostByte",
  "SavageNova", "PhantomCore", "ChaosReign", "BlazeHunter",
  "RoguePixel", "LunarStorm", "VenomEdge", "TitanFury"
];

// Helper function to get n random unique gamer tags
function getRandomPlayers(n: number): string[] {
  const shuffled = [...gamerTags].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

async function clearCollections() {
  const collections = ["tournaments"];
  for (const col of collections) {
    const snap = await db.collection(col).get();
    const batch = db.batch();
    snap.forEach(doc => batch.delete(doc.ref));
    if (!snap.empty) {
      await batch.commit();
      console.log(`🗑️ Cleared ${col}`);
    }
  }
}

async function createUpcomingTournament() {
  console.log("🔵 Creating Upcoming Tournament...");
  
  const tournamentRef = db.collection("tournaments").doc();
  const playerNames = getRandomPlayers(16);
  
  // Create tournament document
  await tournamentRef.set({
    name: "Tournament Day Kit (Upcoming)",
    game: "Call of Duty",
    status: "upcoming",
    seedingMode: "random",
    seedOrder: null,
    round: 1,
    totalRounds: 4,
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
    maxPlayers: 16,
    currentPlayers: 16,
    progress: 0,
    settings: {
      streamRequired: false,
      disputesAllowed: true,
      maxPlayers: 16,
      autoProgress: true,
      simulationMode: false
    },
    lobbyEnabled: true,
    lobbySettings: {
      showMusic: true,
      showPoll: true,
      showClips: true,
      showCountdown: true,
      pollQuestion: "How many total matches will be played?",
      pollOptions: ["Under 15", "15-20", "Over 20"],
      featuredClips: ["Highlight Reel #1", "Highlight Reel #2", "Highlight Reel #3"]
    }
  });
  
  // Add 16 players with random gamer tags
  for (let i = 0; i < 16; i++) {
    await tournamentRef.collection("players").add({
      name: playerNames[i],
      seed: i + 1,
      status: "active",
      createdAt: new Date()
    });
  }
  
  console.log(`✅ Upcoming Tournament: ${tournamentRef.id}`);
  console.log(`   👥 Players: 16 (${playerNames.slice(0, 3).join(", ")}, ...)`);
  console.log(`   🎮 Matches: 0 (not generated yet)`);
  
  return tournamentRef.id;
}

async function createLiveTournament() {
  console.log("🔴 Creating Live Tournament...");
  
  const tournamentRef = db.collection("tournaments").doc();
  const playerNames = getRandomPlayers(16);
  
  // Create tournament document
  await tournamentRef.set({
    name: "Tournament Day Kit (Live)",
    game: "Call of Duty",
    status: "live",
    seedingMode: "random",
    seedOrder: null,
    round: 1,
    totalRounds: 4,
    startDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: {
      streamRequired: false,
      disputesAllowed: true,
      maxPlayers: 16,
      autoProgress: true,
      simulationMode: false
    },
    lobbyEnabled: true,
    lobbySettings: {
      showMusic: true,
      showPoll: true,
      showClips: true,
      showCountdown: true,
      pollQuestion: "How many total matches will be played?",
      pollOptions: ["Under 15", "15-20", "Over 20"],
      featuredClips: ["Highlight Reel #1", "Highlight Reel #2", "Highlight Reel #3"]
    },
    maxPlayers: 16,
    currentPlayers: 16,
    progress: 12.5 // 1 of 8 Round 1 matches in progress
  });
  
  // Add 16 players with random gamer tags
  for (let i = 0; i < 16; i++) {
    await tournamentRef.collection("players").add({
      name: playerNames[i],
      seed: i + 1,
      status: "active",
      createdAt: new Date()
    });
  }
  
  // Create 8 Round 1 matches (new schema)
  for (let i = 1; i <= 8; i++) {
    const playerA = playerNames[i * 2 - 2]; // Use gamer tag instead of "Player N"
    const playerB = playerNames[i * 2 - 1];
    
    // Pending by default; two can be live by status only (scores 0)
    const isLive = i <= 2;
    await tournamentRef.collection("matches").add({
      playerA,
      playerB,
      scoreA: 0,
      scoreB: 0,
      winner: null,
      status: isLive ? "live" : "pending",
      submittedAt: null,
      reportedBy: null,
      round: 1
    });
  }
  
  console.log(`✅ Live Tournament: ${tournamentRef.id}`);
  console.log(`   👥 Players: 16 (${playerNames.slice(0, 3).join(", ")}, ...)`);
  console.log(`   🎮 Matches: 8 (2 live, 6 scheduled)`);
  console.log(`   🔴 Live Matches: ${playerNames[0]} vs ${playerNames[1]}, ${playerNames[2]} vs ${playerNames[3]}`);
  
  return tournamentRef.id;
}

async function createCompletedTournament() {
  console.log("🏆 Creating Completed Tournament...");
  
  const tournamentRef = db.collection("tournaments").doc();
  const playerNames = getRandomPlayers(16);
  
  // Create tournament document (will update champion later)
  await tournamentRef.set({
    name: "Tournament Day Kit (Completed)",
    game: "Call of Duty",
    status: "completed",
    seedingMode: "random",
    seedOrder: null,
    champion: "", // Will be set after bracket generation
    round: 4,
    totalRounds: 4,
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    createdAt: new Date(),
    updatedAt: new Date(),
    maxPlayers: 16,
    currentPlayers: 16,
    progress: 100
  });
  
  // Add 16 players with random gamer tags
  for (let i = 0; i < 16; i++) {
    await tournamentRef.collection("players").add({
      name: playerNames[i],
      seed: i + 1,
      status: i > 8 ? "eliminated" : "active", // Half eliminated
      createdAt: new Date()
    });
  }
  
  // Create complete bracket with winners using gamer tags
  let currentPlayers = [...playerNames]; // Start with all 16 gamer tags
  let totalMatches = 0;
  
  // Round 1: 16 → 8 players (new schema)
  const round1Winners = [];
  for (let i = 1; i <= 8; i++) {
    const playerA = currentPlayers[i * 2 - 2];
    const playerB = currentPlayers[i * 2 - 1];
    const scoreA = Math.floor(Math.random() * 11) + 5; // 5-15 range
    const scoreB = Math.floor(Math.random() * 11) + 5;
    const winner = scoreA > scoreB ? playerA : playerB;
    
    await tournamentRef.collection("matches").add({
      playerA,
      playerB,
      scoreA,
      scoreB,
      winner,
      status: "completed",
      submittedAt: new Date(),
      reportedBy: "seeder",
      round: 1
    });
    
    round1Winners.push(winner);
    totalMatches++;
  }
  
  // Round 2: 8 → 4 players (Quarterfinals, new schema)
  const round2Winners = [];
  for (let i = 1; i <= 4; i++) {
    const playerA = round1Winners[i * 2 - 2];
    const playerB = round1Winners[i * 2 - 1];
    const scoreA = Math.floor(Math.random() * 11) + 5; // 5-15 range
    const scoreB = Math.floor(Math.random() * 11) + 5;
    const winner = scoreA > scoreB ? playerA : playerB;
    
    await tournamentRef.collection("matches").add({
      playerA,
      playerB,
      scoreA,
      scoreB,
      winner,
      status: "completed",
      submittedAt: new Date(),
      reportedBy: "seeder",
      round: 2
    });
    
    round2Winners.push(winner);
    totalMatches++;
  }
  
  // Round 3: 4 → 2 players (Semifinals, new schema)
  const round3Winners = [];
  for (let i = 1; i <= 2; i++) {
    const playerA = round2Winners[i * 2 - 2];
    const playerB = round2Winners[i * 2 - 1];
    const scoreA = Math.floor(Math.random() * 11) + 5; // 5-15 range
    const scoreB = Math.floor(Math.random() * 11) + 5;
    const winner = scoreA > scoreB ? playerA : playerB;
    
    await tournamentRef.collection("matches").add({
      playerA,
      playerB,
      scoreA,
      scoreB,
      winner,
      status: "completed",
      submittedAt: new Date(),
      reportedBy: "seeder",
      round: 3
    });
    
    round3Winners.push(winner);
    totalMatches++;
  }
  
  // Round 4: 2 → 1 player (Final)
  const playerA = round3Winners[0];
  const playerB = round3Winners[1];
  const scoreA = Math.floor(Math.random() * 11) + 5; // 5-15 range
  const scoreB = Math.floor(Math.random() * 11) + 5;
  const champion = scoreA > scoreB ? playerA : playerB;
  
  await tournamentRef.collection("matches").add({
    playerA,
    playerB,
    scoreA,
    scoreB,
    winner: champion,
    status: "completed",
    submittedAt: new Date(),
    reportedBy: "seeder",
    round: 4
  });
  
  totalMatches++;
  
  // Update tournament with champion
  await tournamentRef.update({
    champion: champion
  });
  
  console.log(`✅ Completed Tournament: ${tournamentRef.id}`);
  console.log(`   👥 Players: 16 (${playerNames.slice(0, 3).join(", ")}, ...)`);
  console.log(`   🎮 Matches: ${totalMatches} (all completed)`);
  console.log(`   🏆 Champion: ${champion}`);
  console.log(`   🏆 Finals: ${playerA} vs ${playerB} → ${champion} wins!`);
  
  return tournamentRef.id;
}

async function seed() {
  console.log("🌱 Starting Tournament Day seeding with Gamer Tags...");
  await clearCollections();

  const upcomingId = await createUpcomingTournament();
  const liveId = await createLiveTournament();
  const completedId = await createCompletedTournament();

  // Create additional fee-configured tournaments
  const freeRef = db.collection("tournaments").doc("tournament_free");
  await freeRef.set({
    name: "Free Test Tournament",
    game: "Madden 25",
    entryFee: 0,
    currency: "usd",
    status: "upcoming",
    seedingMode: "random",
    seedOrder: null,
    createdAt: FieldValue.serverTimestamp(),
    settings: {
      streamRequired: false,
      disputesAllowed: true,
      maxPlayers: 16,
      autoProgress: false,
      simulationMode: true
    },
    lobbyEnabled: false,
    lobbySettings: {
      showMusic: false,
      showPoll: false,
      showClips: false,
      showCountdown: false
    }
  });

  const paidRef = db.collection("tournaments").doc("tournament_paid");
  await paidRef.set({
    name: "Paid Test Tournament",
    game: "NBA 2K25",
    entryFee: 500,
    currency: "usd",
    status: "upcoming",
    seedingMode: "random",
    seedOrder: null,
    createdAt: FieldValue.serverTimestamp(),
    settings: {
      streamRequired: false,
      disputesAllowed: true,
      maxPlayers: 16,
      autoProgress: true,
      simulationMode: false
    },
    lobbyEnabled: true,
    lobbySettings: {
      showMusic: true,
      showPoll: true,
      showClips: true,
      showCountdown: true,
      pollQuestion: "How many total matches will be played?",
      pollOptions: ["Under 15", "15-20", "Over 20"],
      featuredClips: ["Highlight Reel #1", "Highlight Reel #2", "Highlight Reel #3"]
    }
  });

  console.log("\n🎉 All tournaments seeded successfully!");
  console.log("📊 Tournament Summary:");
  console.log(`   1. Upcoming Tournament (${upcomingId})`);
  console.log(`      Status: upcoming`);
  console.log(`      URL: http://localhost:3000/tournaments/${upcomingId}`);
  console.log(`   2. Live Tournament (${liveId})`);
  console.log(`      Status: live`);
  console.log(`      URL: http://localhost:3000/tournaments/${liveId}`);
  console.log(`   3. Completed Tournament (${completedId})`);
  console.log(`      Status: completed`);
  console.log(`      URL: http://localhost:3000/tournaments/${completedId}`);
  console.log("\n✅ Seeded tournaments:");
  console.log("   - Free Test Tournament (entryFee: 0)");
  console.log("   - Paid Test Tournament (entryFee: $5)");
  console.log("\n🌐 Main Access:");
  console.log(`   Tournament List: http://localhost:3000/tournaments`);
}

seed().catch(err => {
  console.error("❌ Error seeding:", err);
  process.exit(1);
});