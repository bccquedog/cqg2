// Multiple approaches to create players for tournaments

import { addDoc, collection, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ✅ Approach 1: Players as subcollection (your original approach)
async function createPlayersAsSubcollection(tournamentRef) {
  console.log("Creating players as subcollection...");
  
  const playersCol = collection(tournamentRef, "players");
  const playerIds = [];
  
  for (let i = 1; i <= 16; i++) {
    const playerDoc = await addDoc(playersCol, {
      name: `Player ${i}`,
      seed: i,
      status: "active",
      createdAt: serverTimestamp()
    });
    playerIds.push(playerDoc.id);
  }
  
  console.log("✅ Created 16 players as subcollection");
  return playerIds;
}

// ✅ Approach 2: Players in separate collection (current codebase pattern)
async function createPlayersInSeparateCollection(tournamentId) {
  console.log("Creating players in separate collection...");
  
  const playerIds = [];
  
  for (let i = 1; i <= 16; i++) {
    const playerDoc = await addDoc(collection(db, "players"), {
      username: `Player${i}`,
      gamerTag: `Player${i}`,
      name: `Player ${i}`,
      seed: i,
      status: "active",
      tournamentId: tournamentId, // Link back to tournament
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Player${i}`,
      bio: `Tournament player #${i}`,
      stats: {
        matchesPlayed: 0,
        wins: 0,
        losses: 0
      },
      subscription: "gamer",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    playerIds.push(playerDoc.id);
  }
  
  // Update tournament with player IDs array
  const tournamentRef = doc(db, "tournaments", tournamentId);
  await updateDoc(tournamentRef, {
    players: playerIds,
    checkIns: playerIds, // Auto check-in for testing
    updatedAt: serverTimestamp()
  });
  
  console.log("✅ Created 16 players in separate collection and linked to tournament");
  return playerIds;
}

// ✅ Approach 3: Hybrid - Both patterns for maximum compatibility
async function createPlayersHybrid(tournamentId) {
  console.log("Creating players with hybrid approach...");
  
  const tournamentRef = doc(db, "tournaments", tournamentId);
  const playerIds = [];
  
  // Create players in main collection
  for (let i = 1; i <= 16; i++) {
    const playerDoc = await addDoc(collection(db, "players"), {
      username: `Player${i}`,
      gamerTag: `Player${i}`,
      name: `Player ${i}`,
      seed: i,
      status: "active",
      tournamentId: tournamentId,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Player${i}`,
      bio: `Tournament player #${i}`,
      stats: { matchesPlayed: 0, wins: 0, losses: 0 },
      subscription: "gamer",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    playerIds.push(playerDoc.id);
    
    // ALSO create in subcollection for your use case
    const playersSubCol = collection(tournamentRef, "players");
    await addDoc(playersSubCol, {
      playerId: playerDoc.id, // Reference to main player doc
      name: `Player ${i}`,
      seed: i,
      status: "active",
      joinedAt: serverTimestamp()
    });
  }
  
  // Update tournament document
  await updateDoc(tournamentRef, {
    players: playerIds,
    checkIns: playerIds,
    updatedAt: serverTimestamp()
  });
  
  console.log("✅ Created 16 players with hybrid approach (both collection and subcollection)");
  return playerIds;
}

// ✅ Usage examples:
export { 
  createPlayersAsSubcollection, 
  createPlayersInSeparateCollection, 
  createPlayersHybrid 
};


