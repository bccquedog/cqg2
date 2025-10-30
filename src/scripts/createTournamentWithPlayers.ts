// Complete script to create a tournament with 16 players
import { addDoc, collection, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function createTournamentWithPlayers() {
  try {
    console.log("🏆 Creating Tournament Day Kit with 16 players...");
    
    // Step 1: Create the tournament
    const tournamentRef = await addDoc(collection(db, "tournaments"), {
      name: "Tournament Day Kit",
      game: "Call of Duty",
      status: "upcoming",
      startDate: null,
      round: 1,
      totalRounds: 4,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      
      // Tournament structure
      maxPlayers: 16,
      settings: {
        format: "single_elimination",
        checkInWindow: 30
      },
      players: [], // Will be populated below
      checkIns: [],
      progress: 0,
      matchesFinished: 0,
      matchesPending: 0,
      champion: null,
      type: "solo",
      description: "Tournament with 16 test players ready for bracket generation"
    });
    
    console.log("✅ Tournament created with ID:", tournamentRef.id);
    
    // Step 2: Create 16 players in separate collection (main pattern)
    const playerIds = [];
    console.log("👥 Creating 16 players...");
    
    for (let i = 1; i <= 16; i++) {
      const playerDoc = await addDoc(collection(db, "players"), {
        username: `Player${i}`,
        gamerTag: `Player${i}`,
        name: `Player ${i}`,
        status: "online",
        tournamentId: tournamentRef.id,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Player${i}`,
        bio: `Test player for tournament #${i}`,
        stats: {
          matchesPlayed: Math.floor(Math.random() * 20),
          wins: Math.floor(Math.random() * 15),
          losses: Math.floor(Math.random() * 10)
        },
        subscription: i <= 4 ? "premium" : i <= 8 ? "elite" : "gamer",
        streamUrl: i <= 3 ? `https://twitch.tv/player${i}` : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });
      playerIds.push(playerDoc.id);
      
      // Also create in subcollection (your preferred approach)
      const playersSubCol = collection(tournamentRef, "players");
      await addDoc(playersSubCol, {
        playerId: playerDoc.id, // Reference to main player
        name: `Player ${i}`,
        seed: i,
        status: "active",
        joinedAt: serverTimestamp()
      });
    }
    
    console.log("✅ Created 16 players in both main collection and subcollection");
    
    // Step 3: Update tournament with player references and auto check-in
    await updateDoc(tournamentRef, {
      players: playerIds,
      checkIns: playerIds, // Auto check-in all players for testing
      updatedAt: serverTimestamp()
    });
    
    console.log("✅ Players registered and checked-in to tournament");
    
    // Step 4: Success summary
    console.log("\n🎉 Tournament Day Kit created successfully!");
    console.log("📊 Summary:");
    console.log(`   Tournament ID: ${tournamentRef.id}`);
    console.log(`   Players: 16 (all checked-in)`);
    console.log(`   Status: upcoming`);
    console.log(`   View at: http://localhost:3000/tournaments/${tournamentRef.id}`);
    console.log("\n🚀 Ready for bracket generation!");
    
    return {
      tournamentId: tournamentRef.id,
      playerIds: playerIds
    };
    
  } catch (error) {
    console.error("❌ Error creating tournament with players:", error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  createTournamentWithPlayers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { createTournamentWithPlayers };


