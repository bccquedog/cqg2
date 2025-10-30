// Script to create a "Tournament Day Kit" tournament for testing
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function createTournamentDayKit() {
  try {
    console.log("Creating Tournament Day Kit...");
    
    const tournamentRef = await addDoc(collection(db, "tournaments"), {
      name: "Tournament Day Kit",
      game: "Call of Duty",
      status: "upcoming",
      startDate: null,
      round: 1,
      totalRounds: 4,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      
      // Additional tournament fields
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
      champion: null,
      type: "solo",
      description: "A complete tournament setup for testing all tournament features",
      prizePools: {
        first: "$500",
        second: "$200",
        third: "$100"
      }
    });
    
    console.log("✅ Tournament Day Kit created successfully!");
    console.log("Tournament ID:", tournamentRef.id);
    console.log("You can view it at: http://localhost:3000/tournaments/" + tournamentRef.id);
    
    return tournamentRef.id;
  } catch (error) {
    console.error("❌ Error creating Tournament Day Kit:", error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  createTournamentDayKit()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { createTournamentDayKit };


