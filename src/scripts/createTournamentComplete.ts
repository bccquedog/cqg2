// Complete script: Tournament + Players + Matches (Ready to Play!)
import { addDoc, collection, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function createCompleteTournament() {
  try {
    console.log("🏆 Creating complete tournament setup...");
    
    // Step 1: Create Tournament
    const tournamentRef = await addDoc(collection(db, "tournaments"), {
      name: "Complete Tournament Kit",
      game: "Call of Duty",
      status: "setup", // Will change to "live" after matches created
      startDate: null,
      round: 1,
      totalRounds: 4,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      
      maxPlayers: 16,
      settings: {
        format: "single_elimination",
        checkInWindow: 30
      },
      players: [],
      checkIns: [],
      progress: 0,
      matchesFinished: 0,
      matchesPending: 8, // Round 1 matches
      champion: null,
      type: "solo",
      description: "Complete tournament with players and bracket ready to play!"
    });
    
    console.log("✅ Tournament created:", tournamentRef.id);
    
    // Step 2: Create 16 Players
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
        bio: `Tournament player #${i}`,
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
      
      // Also create in subcollection
      await addDoc(collection(tournamentRef, "players"), {
        playerId: playerDoc.id,
        name: `Player ${i}`,
        seed: i,
        status: "active",
        joinedAt: serverTimestamp()
      });
    }
    
    console.log("✅ Created 16 players");
    
    // Step 3: Create Complete Bracket (Your approach + enhancements)
    console.log("🎮 Creating tournament bracket...");
    const matchesCol = collection(tournamentRef, "matches");
    
    // Round 1: 8 matches (your original code enhanced)
    console.log("Creating Round 1 matches...");
    for (let i = 1; i <= 16; i += 2) {
      const matchNumber = `R1-M${Math.floor((i - 1) / 2) + 1}`;
      const playerAIndex = i - 1;
      const playerBIndex = i;
      
      await addDoc(matchesCol, {
        // Your original fields
        round: 1,
        matchNumber,
        player1: `Player ${i}`,
        player2: `Player ${i + 1}`,
        winner: null,
        status: "scheduled",
        
        // Enhanced compatibility fields
        playerA: playerIds[playerAIndex],
        playerB: playerIds[playerBIndex],
        roundName: "Round 1",
        scoreA: 0,
        scoreB: 0,
        score: null,
        reports: {},
        locked: false,
        streamUrl: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    // Round 2: Quarterfinals (4 matches - TBD)
    console.log("Creating Quarterfinals placeholders...");
    for (let i = 1; i <= 4; i++) {
      await addDoc(matchesCol, {
        round: 2,
        matchNumber: `R2-M${i}`,
        roundName: "Quarterfinals",
        player1: "TBD",
        player2: "TBD",
        playerA: null,
        playerB: null,
        winner: null,
        status: "waiting",
        scoreA: 0,
        scoreB: 0,
        score: null,
        createdAt: serverTimestamp()
      });
    }
    
    // Round 3: Semifinals (2 matches - TBD)
    console.log("Creating Semifinals placeholders...");
    for (let i = 1; i <= 2; i++) {
      await addDoc(matchesCol, {
        round: 3,
        matchNumber: `R3-M${i}`,
        roundName: "Semifinals",
        player1: "TBD",
        player2: "TBD",
        playerA: null,
        playerB: null,
        winner: null,
        status: "waiting",
        scoreA: 0,
        scoreB: 0,
        score: null,
        createdAt: serverTimestamp()
      });
    }
    
    // Round 4: Finals (1 match - TBD)
    console.log("Creating Finals placeholder...");
    await addDoc(matchesCol, {
      round: 4,
      matchNumber: "R4-M1",
      roundName: "Finals",
      player1: "TBD",
      player2: "TBD",
      playerA: null,
      playerB: null,
      winner: null,
      status: "waiting",
      scoreA: 0,
      scoreB: 0,
      score: null,
      createdAt: serverTimestamp()
    });
    
    console.log("✅ Created complete bracket (15 total matches)");
    
    // Step 4: Update tournament with players and set to "live"
    await updateDoc(tournamentRef, {
      players: playerIds,
      checkIns: playerIds, // All players checked in
      status: "live", // Ready to play!
      updatedAt: serverTimestamp()
    });
    
    console.log("✅ Tournament set to LIVE status");
    
    // Step 5: Success Summary
    console.log("\n🎉 COMPLETE TOURNAMENT CREATED SUCCESSFULLY!");
    console.log("=" .repeat(50));
    console.log(`🏆 Tournament ID: ${tournamentRef.id}`);
    console.log(`👥 Players: 16 (all checked-in)`);
    console.log(`🎮 Matches: 15 total`);
    console.log(`   • Round 1: 8 matches (READY TO PLAY)`);
    console.log(`   • Round 2: 4 matches (TBD)`);
    console.log(`   • Round 3: 2 matches (TBD)`);
    console.log(`   • Round 4: 1 match (TBD)`);
    console.log(`📊 Status: LIVE`);
    console.log(`🌐 View: http://localhost:3000/tournaments/${tournamentRef.id}`);
    console.log(`🚀 Ready for players to submit match results!`);
    console.log("=" .repeat(50));
    
    return {
      tournamentId: tournamentRef.id,
      playerIds: playerIds,
      totalMatches: 15
    };
    
  } catch (error) {
    console.error("❌ Error creating complete tournament:", error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  createCompleteTournament()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { createCompleteTournament };


