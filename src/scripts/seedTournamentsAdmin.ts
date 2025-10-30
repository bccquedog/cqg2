import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../../functions/serviceAccountKey.json";

initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore();

async function seed() {
  console.log("🌱 Seeding tournaments...");

  // --- 1. Upcoming Tournament ---
  const upcomingRef = await db.collection("tournaments").add({
    name: "Tournament Day Kit (Upcoming)",
    game: "Call of Duty",
    status: "upcoming",
    startDate: null,
    round: 1,
    totalRounds: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    maxPlayers: 16,
    currentPlayers: 16,
    progress: 0
  });

  // Add players to upcoming tournament
  for (let i = 1; i <= 16; i++) {
    await db.collection("tournaments").doc(upcomingRef.id).collection("players").add({
      name: `Player ${i}`,
      seed: i,
      status: "active"
    });
  }

  // Add scheduled matches for upcoming tournament
  for (let i = 1; i <= 8; i++) {
    await db.collection("tournaments").doc(upcomingRef.id).collection("matches").add({
      roundNumber: 1,
      matchNumber: i,
      playerA: `Player ${i * 2 - 1}`,
      playerB: `Player ${i * 2}`,
      scoreA: null,
      scoreB: null,
      winner: null,
      status: "Scheduled"
    });
  }

  console.log(`✅ Upcoming tournament: ${upcomingRef.id}`);

  // --- 2. Live Tournament ---
  const liveRef = await db.collection("tournaments").add({
    name: "Tournament Day Kit (Live)",
    game: "Call of Duty",
    status: "live",
    startDate: new Date(),
    round: 1,
    totalRounds: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    maxPlayers: 16,
    currentPlayers: 16,
    progress: 25
  });

  // Add players to live tournament
  for (let i = 1; i <= 16; i++) {
    await db.collection("tournaments").doc(liveRef.id).collection("players").add({
      name: `Pro Player ${i}`,
      seed: i,
      status: "active"
    });
  }

  // Add live matches with different hype levels
  const liveMatches = [
    // High Hype: Close scores (20-18)
    { 
      roundNumber: 1, 
      matchNumber: 1, 
      playerA: "Pro Player 1", 
      playerB: "Pro Player 2", 
      scoreA: 20, 
      scoreB: 18, 
      winner: null,
      status: "Live" 
    },
    // Maximum Hype: Tied scores (15-15)
    { 
      roundNumber: 1, 
      matchNumber: 2, 
      playerA: "Pro Player 3", 
      playerB: "Pro Player 4", 
      scoreA: 15, 
      scoreB: 15, 
      winner: null,
      status: "Live" 
    },
    // Low Hype: Big difference (25-8)
    { 
      roundNumber: 1, 
      matchNumber: 3, 
      playerA: "Pro Player 5", 
      playerB: "Pro Player 6", 
      scoreA: 25, 
      scoreB: 8, 
      winner: null,
      status: "Live" 
    },
    // Scheduled match
    { 
      roundNumber: 1, 
      matchNumber: 4, 
      playerA: "Pro Player 7", 
      playerB: "Pro Player 8", 
      scoreA: null, 
      scoreB: null, 
      winner: null,
      status: "Scheduled" 
    },
  ];
  
  for (const match of liveMatches) {
    await db.collection("tournaments").doc(liveRef.id).collection("matches").add(match);
  }

  console.log(`✅ Live tournament: ${liveRef.id} (3 live matches with different hype levels)`);

  // --- 3. Completed Tournament ---
  const completedRef = await db.collection("tournaments").add({
    name: "Tournament Day Kit (Completed)",
    game: "Call of Duty",
    status: "completed",
    champion: "Champion Player",
    startDate: new Date(Date.now() - 86400000), // yesterday
    round: 4,
    totalRounds: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    maxPlayers: 16,
    currentPlayers: 16,
    progress: 100
  });

  // Add players to completed tournament
  for (let i = 1; i <= 16; i++) {
    await db.collection("tournaments").doc(completedRef.id).collection("players").add({
      name: `Champion Player ${i}`,
      seed: i,
      status: i <= 8 ? "eliminated" : "active"
    });
  }

  // Add completed matches with full bracket
  const completedMatches = [
    // Round 1 - All completed
    { roundNumber: 1, matchNumber: 1, playerA: "Champion Player 1", playerB: "Champion Player 2", scoreA: 25, scoreB: 18, winner: "Champion Player 1", status: "Completed" },
    { roundNumber: 1, matchNumber: 2, playerA: "Champion Player 3", playerB: "Champion Player 4", scoreA: 22, scoreB: 20, winner: "Champion Player 3", status: "Completed" },
    { roundNumber: 1, matchNumber: 3, playerA: "Champion Player 5", playerB: "Champion Player 6", scoreA: 30, scoreB: 15, winner: "Champion Player 5", status: "Completed" },
    { roundNumber: 1, matchNumber: 4, playerA: "Champion Player 7", playerB: "Champion Player 8", scoreA: 28, scoreB: 25, winner: "Champion Player 7", status: "Completed" },
    
    // Round 2 - Quarterfinals completed
    { roundNumber: 2, matchNumber: 1, playerA: "Champion Player 1", playerB: "Champion Player 3", scoreA: 30, scoreB: 25, winner: "Champion Player 1", status: "Completed" },
    { roundNumber: 2, matchNumber: 2, playerA: "Champion Player 5", playerB: "Champion Player 7", scoreA: 35, scoreB: 28, winner: "Champion Player 5", status: "Completed" },
    
    // Round 3 - Semifinals completed
    { roundNumber: 3, matchNumber: 1, playerA: "Champion Player 1", playerB: "Champion Player 5", scoreA: 40, scoreB: 35, winner: "Champion Player 1", status: "Completed" },
    
    // Round 4 - Finals completed
    { roundNumber: 4, matchNumber: 1, playerA: "Champion Player 1", playerB: "Champion Player", scoreA: 50, scoreB: 45, winner: "Champion Player", status: "Completed" },
  ];
  
  for (const match of completedMatches) {
    await db.collection("tournaments").doc(completedRef.id).collection("matches").add(match);
  }

  console.log(`✅ Completed tournament: ${completedRef.id} (Full bracket with champion)`);

  console.log("\n🎉 All tournaments seeded successfully!");
  console.log("📊 Summary:");
  console.log(`   • Upcoming: ${upcomingRef.id} (16 players, 8 scheduled matches)`);
  console.log(`   • Live: ${liveRef.id} (3 live matches with hype meters)`);
  console.log(`   • Completed: ${completedRef.id} (Full bracket, champion determined)`);
  console.log("\n🌐 Access:");
  console.log(`   Tournament List: http://localhost:3000/tournaments`);
  console.log(`   Live Tournament: http://localhost:3000/tournaments/${liveRef.id}`);
  console.log(`   Completed Tournament: http://localhost:3000/tournaments/${completedRef.id}`);
}

seed().catch((err) => {
  console.error("❌ Seeding error:", err);
  process.exit(1);
});
