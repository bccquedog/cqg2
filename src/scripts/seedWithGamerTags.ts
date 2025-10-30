// Client-side seeder with random gamer tags
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Pool of gamer tags for random assignment
const gamerTags = [
  "ShadowStrike", "PixelPhantom", "NovaSniper", "TurboLlama",
  "GhostWolf", "CrimsonClutch", "ByteBreaker", "ApexViper", 
  "IronFang", "NeonPulse", "VortexHawk", "FrostByte",
  "SavageNova", "PhantomCore", "ChaosReign", "BlazeHunter",
  "RoguePixel", "LunarStorm", "VenomEdge", "TitanFury"
];

// Helper to get 16 random unique gamer tags
function getRandomGamerTags(): string[] {
  const shuffled = [...gamerTags].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 16);
}

async function createUpcomingTournament() {
  console.log("🔵 Creating Upcoming Tournament...");
  
  const playerNames = getRandomGamerTags();
  
  // Create tournament document
  const tournamentRef = await addDoc(collection(db, "tournaments"), {
    name: "Tournament Day Kit (Upcoming)",
    game: "Call of Duty",
    status: "upcoming",
    round: 1,
    totalRounds: 4,
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
    maxPlayers: 16,
    currentPlayers: 16,
    progress: 0
  });
  
  // Add 16 players with random gamer tags
  for (let i = 0; i < 16; i++) {
    await addDoc(collection(tournamentRef, "players"), {
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
  
  const playerNames = getRandomGamerTags();
  
  // Create tournament document
  const tournamentRef = await addDoc(collection(db, "tournaments"), {
    name: "Tournament Day Kit (Live)",
    game: "Call of Duty",
    status: "live",
    round: 1,
    totalRounds: 4,
    startDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    maxPlayers: 16,
    currentPlayers: 16,
    progress: 12.5 // 1 of 8 Round 1 matches in progress
  });
  
  // Add 16 players with random gamer tags
  for (let i = 0; i < 16; i++) {
    await addDoc(collection(tournamentRef, "players"), {
      name: playerNames[i],
      seed: i + 1,
      status: "active",
      createdAt: new Date()
    });
  }
  
  // Create 8 Round 1 matches
  for (let i = 1; i <= 8; i++) {
    const playerA = playerNames[i * 2 - 2];
    const playerB = playerNames[i * 2 - 1];
    
    // Matches 1 & 2 are live, rest are scheduled
    const isLive = i <= 2;
    
    await addDoc(collection(tournamentRef, "matches"), {
      roundNumber: 1,
      matchNumber: i,
      playerA: playerA,
      playerB: playerB,
      scoreA: isLive ? Math.floor(Math.random() * 20) + 10 : null,
      scoreB: isLive ? Math.floor(Math.random() * 20) + 10 : null,
      winner: null,
      status: isLive ? "Live" : "Scheduled",
      createdAt: new Date()
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
  
  const playerNames = getRandomGamerTags();
  
  // Create tournament document
  const tournamentRef = await addDoc(collection(db, "tournaments"), {
    name: "Tournament Day Kit (Completed)",
    game: "Call of Duty",
    status: "completed",
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
    await addDoc(collection(tournamentRef, "players"), {
      name: playerNames[i],
      seed: i + 1,
      status: i > 8 ? "eliminated" : "active",
      createdAt: new Date()
    });
  }
  
  // Create complete bracket with winners using gamer tags
  let currentPlayers = [...playerNames];
  let totalMatches = 0;
  
  // Round 1: 16 → 8 players
  const round1Winners = [];
  for (let i = 1; i <= 8; i++) {
    const playerA = currentPlayers[i * 2 - 2];
    const playerB = currentPlayers[i * 2 - 1];
    const scoreA = Math.floor(Math.random() * 30) + 20;
    const scoreB = Math.floor(Math.random() * 30) + 15;
    const winner = scoreA > scoreB ? playerA : playerB;
    
    await addDoc(collection(tournamentRef, "matches"), {
      roundNumber: 1,
      matchNumber: i,
      playerA: playerA,
      playerB: playerB,
      scoreA: scoreA,
      scoreB: scoreB,
      winner: winner,
      status: "Completed",
      createdAt: new Date()
    });
    
    round1Winners.push(winner);
    totalMatches++;
  }
  
  // Round 2: 8 → 4 players (Quarterfinals)
  const round2Winners = [];
  for (let i = 1; i <= 4; i++) {
    const playerA = round1Winners[i * 2 - 2];
    const playerB = round1Winners[i * 2 - 1];
    const scoreA = Math.floor(Math.random() * 35) + 25;
    const scoreB = Math.floor(Math.random() * 35) + 20;
    const winner = scoreA > scoreB ? playerA : playerB;
    
    await addDoc(collection(tournamentRef, "matches"), {
      roundNumber: 2,
      matchNumber: i,
      playerA: playerA,
      playerB: playerB,
      scoreA: scoreA,
      scoreB: scoreB,
      winner: winner,
      status: "Completed",
      createdAt: new Date()
    });
    
    round2Winners.push(winner);
    totalMatches++;
  }
  
  // Round 3: 4 → 2 players (Semifinals)
  const round3Winners = [];
  for (let i = 1; i <= 2; i++) {
    const playerA = round2Winners[i * 2 - 2];
    const playerB = round2Winners[i * 2 - 1];
    const scoreA = Math.floor(Math.random() * 40) + 30;
    const scoreB = Math.floor(Math.random() * 40) + 25;
    const winner = scoreA > scoreB ? playerA : playerB;
    
    await addDoc(collection(tournamentRef, "matches"), {
      roundNumber: 3,
      matchNumber: i,
      playerA: playerA,
      playerB: playerB,
      scoreA: scoreA,
      scoreB: scoreB,
      winner: winner,
      status: "Completed",
      createdAt: new Date()
    });
    
    round3Winners.push(winner);
    totalMatches++;
  }
  
  // Round 4: 2 → 1 player (Final)
  const playerA = round3Winners[0];
  const playerB = round3Winners[1];
  const scoreA = Math.floor(Math.random() * 50) + 40;
  const scoreB = Math.floor(Math.random() * 50) + 35;
  const champion = scoreA > scoreB ? playerA : playerB;
  
  await addDoc(collection(tournamentRef, "matches"), {
    roundNumber: 4,
    matchNumber: 1,
    playerA: playerA,
    playerB: playerB,
    scoreA: scoreA,
    scoreB: scoreB,
    winner: champion,
    status: "Completed",
    createdAt: new Date()
  });
  
  totalMatches++;
  
  // Update tournament with champion
  await setDoc(tournamentRef, { champion: champion }, { merge: true });
  
  console.log(`✅ Completed Tournament: ${tournamentRef.id}`);
  console.log(`   👥 Players: 16 (${playerNames.slice(0, 3).join(", ")}, ...)`);
  console.log(`   🎮 Matches: ${totalMatches} (all completed)`);
  console.log(`   🏆 Champion: ${champion}`);
  console.log(`   🏆 Finals: ${playerA} vs ${playerB} → ${champion} wins!`);
  
  return tournamentRef.id;
}

async function seed() {
  console.log("🌱 Starting Tournament Day seeding with Gamer Tags...");
  
  try {
    const upcomingId = await createUpcomingTournament();
    const liveId = await createLiveTournament();
    const completedId = await createCompletedTournament();

    console.log("\n🎉 Seeding complete!");
    console.log("🌐 Access your tournaments:");
    console.log(`   Upcoming Tournament: http://localhost:3000/tournaments/${upcomingId}`);
    console.log(`   Live Tournament: http://localhost:3000/tournaments/${liveId}`);
    console.log(`   Completed Tournament: http://localhost:3000/tournaments/${completedId}`);
    console.log(`   Tournament List: http://localhost:3000/tournaments`);
  } catch (error) {
    console.error("❌ Error seeding:", error);
    throw error;
  }
}

// Run the seeder
seed().catch(err => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

export { seed };


