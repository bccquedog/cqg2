// Example: How to create a tournament using the existing service

import { createTournament } from "@/lib/tournamentService";
import { serverTimestamp } from "firebase/firestore";

// ✅ Using the existing createTournament function
async function createTournamentDayKit() {
  try {
    const tournament = await createTournament({
      name: "Tournament Day Kit",
      game: "Call of Duty",
      status: "upcoming",
      startDate: null,
      round: 1,
      totalRounds: 4,
      // createdAt and updatedAt are automatically added by the service
      
      // Additional fields you might want to include:
      maxPlayers: 16,
      settings: {
        format: "single_elimination",
        checkInWindow: 30
      },
      players: [],
      checkIns: [],
      progress: 0,
      matchesFinished: 0,
      matchesPending: 0
    });
    
    console.log("Tournament created:", tournament);
    return tournament;
  } catch (error) {
    console.error("Error creating tournament:", error);
    throw error;
  }
}

// ✅ Alternative: Direct Firestore approach (your original code with improvements)
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function createTournamentDirect() {
  try {
    const tournamentRef = await addDoc(collection(db, "tournaments"), {
      name: "Tournament Day Kit",
      game: "Call of Duty",
      status: "upcoming",
      startDate: null,
      round: 1,
      totalRounds: 4,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      
      // Recommended additional fields:
      maxPlayers: 16,
      settings: {
        format: "single_elimination",
        checkInWindow: 30
      },
      players: [],
      checkIns: [],
      progress: 0,
      matchesFinished: 0,
      matchesPending: 0,
      champion: null
    });
    
    console.log("Tournament created with ID:", tournamentRef.id);
    return { id: tournamentRef.id };
  } catch (error) {
    console.error("Error creating tournament:", error);
    throw error;
  }
}

// ✅ Usage examples:
// createTournamentDayKit();
// createTournamentDirect();

export { createTournamentDayKit, createTournamentDirect };


