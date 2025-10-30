// Multiple approaches to create matches for tournaments

import { addDoc, collection, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ✅ Approach 1: Your Original (Subcollection with player names)
async function createMatchesOriginal(tournamentRef) {
  console.log("Creating matches with your original approach...");
  
  const matchesCol = collection(tournamentRef, "matches");
  const matchIds = [];
  
  for (let i = 1; i <= 16; i += 2) {
    const matchNumber = `R1-M${Math.floor(i / 2) + 1}`;
    const matchDoc = await addDoc(matchesCol, {
      round: 1,
      matchNumber,
      player1: `Player ${i}`,
      player2: `Player ${i + 1}`,
      winner: null,
      status: "scheduled",
      createdAt: serverTimestamp()
    });
    matchIds.push(matchDoc.id);
  }
  
  console.log("✅ Created 8 Round 1 matches");
  return matchIds;
}

// ✅ Approach 2: Enhanced with codebase compatibility
async function createMatchesEnhanced(tournamentRef, playerIds) {
  console.log("Creating matches with enhanced approach...");
  
  const matchesCol = collection(tournamentRef, "matches");
  const matchIds = [];
  
  for (let i = 0; i < 16; i += 2) {
    const matchNumber = Math.floor(i / 2) + 1;
    const playerA = playerIds[i];
    const playerB = playerIds[i + 1];
    
    const matchDoc = await addDoc(matchesCol, {
      // Your fields
      round: 1,
      matchNumber: `R1-M${matchNumber}`,
      player1: `Player ${i + 1}`,
      player2: `Player ${i + 2}`,
      
      // Codebase compatibility fields
      playerA: playerA,
      playerB: playerB,
      status: "pending", // "pending" | "completed" | "scheduled"
      score: null,
      winner: null,
      
      // Additional useful fields
      roundName: "Round 1",
      scoreA: 0,
      scoreB: 0,
      reports: {}, // For player score submissions
      locked: false,
      streamUrl: null,
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    matchIds.push(matchDoc.id);
  }
  
  console.log("✅ Created 8 Round 1 matches with full compatibility");
  return matchIds;
}

// ✅ Approach 3: Complete bracket generation (all 4 rounds)
async function createFullBracket(tournamentRef, playerIds) {
  console.log("Creating complete tournament bracket...");
  
  const matchesCol = collection(tournamentRef, "matches");
  const allMatches = [];
  
  // Round 1: 16 players → 8 matches
  console.log("Creating Round 1 matches...");
  for (let i = 0; i < 16; i += 2) {
    const matchNumber = Math.floor(i / 2) + 1;
    const matchDoc = await addDoc(matchesCol, {
      round: 1,
      roundName: "Round 1",
      matchNumber: `R1-M${matchNumber}`,
      playerA: playerIds[i],
      playerB: playerIds[i + 1],
      player1: `Player ${i + 1}`,
      player2: `Player ${i + 2}`,
      status: "pending",
      score: null,
      winner: null,
      scoreA: 0,
      scoreB: 0,
      createdAt: serverTimestamp()
    });
    allMatches.push({ id: matchDoc.id, round: 1 });
  }
  
  // Round 2: Quarterfinals (TBD placeholders)
  console.log("Creating Quarterfinals placeholders...");
  for (let i = 0; i < 4; i++) {
    const matchDoc = await addDoc(matchesCol, {
      round: 2,
      roundName: "Quarterfinals",
      matchNumber: `R2-M${i + 1}`,
      playerA: null, // TBD - will be filled by winners
      playerB: null,
      player1: "TBD",
      player2: "TBD",
      status: "waiting",
      score: null,
      winner: null,
      scoreA: 0,
      scoreB: 0,
      createdAt: serverTimestamp()
    });
    allMatches.push({ id: matchDoc.id, round: 2 });
  }
  
  // Round 3: Semifinals
  console.log("Creating Semifinals placeholders...");
  for (let i = 0; i < 2; i++) {
    const matchDoc = await addDoc(matchesCol, {
      round: 3,
      roundName: "Semifinals",
      matchNumber: `R3-M${i + 1}`,
      playerA: null,
      playerB: null,
      player1: "TBD",
      player2: "TBD",
      status: "waiting",
      score: null,
      winner: null,
      scoreA: 0,
      scoreB: 0,
      createdAt: serverTimestamp()
    });
    allMatches.push({ id: matchDoc.id, round: 3 });
  }
  
  // Round 4: Finals
  console.log("Creating Finals placeholder...");
  const finalMatchDoc = await addDoc(matchesCol, {
    round: 4,
    roundName: "Finals",
    matchNumber: "R4-M1",
    playerA: null,
    playerB: null,
    player1: "TBD",
    player2: "TBD",
    status: "waiting",
    score: null,
    winner: null,
    scoreA: 0,
    scoreB: 0,
    createdAt: serverTimestamp()
  });
  allMatches.push({ id: finalMatchDoc.id, round: 4 });
  
  console.log("✅ Created complete tournament bracket:");
  console.log("   Round 1: 8 matches");
  console.log("   Round 2: 4 matches"); 
  console.log("   Round 3: 2 matches");
  console.log("   Round 4: 1 match");
  console.log("   Total: 15 matches");
  
  return allMatches;
}

// ✅ Usage examples:
export { 
  createMatchesOriginal,
  createMatchesEnhanced, 
  createFullBracket 
};


