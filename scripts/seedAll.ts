import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app = initializeApp({ projectId: "demo-cqg" });
const db = getFirestore(app);

async function clearCollections() {
  const collections = ["tournaments", "players", "matches", "tiers"];
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

async function seedTiers() {
  console.log("🎯 Seeding tiers...");
  const tiers = [
    { id: "gamer", level: 1, canAccessPremium: false, maxRequests: 30, earlyAccess: false },
    { id: "premium", level: 2, canAccessPremium: true, maxRequests: 60, earlyAccess: true },
    { id: "elite", level: 3, canAccessPremium: true, maxRequests: 120, earlyAccess: true }
  ];

  for (const tier of tiers) {
    await db.collection("tiers").doc(tier.id).set(tier);
    console.log(`✅ Seeded tier: ${tier.id}`);
  }

  console.log("✅ All tiers seeded.");
}

async function seedTournaments() {
  console.log("🏆 Seeding tournaments...");
  
  const tournamentConfigs = [
    {
      name: "Tournament Day Kit (Upcoming)",
      status: "upcoming",
      daysOffset: 3,
      game: "Call of Duty"
    },
    {
      name: "Tournament Day Kit (Live)", 
      status: "live",
      daysOffset: 0,
      game: "NBA 2K"
    },
    {
      name: "Tournament Day Kit (Completed)",
      status: "completed", 
      daysOffset: -5,
      game: "Fortnite"
    }
  ];

  for (let i = 0; i < tournamentConfigs.length; i++) {
    const config = tournamentConfigs[i];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + config.daysOffset);
    
    // Create tournament
    const tournamentRef = db.collection("tournaments").doc();
    
    let progress = 0;
    let champion = null;
    let matchesFinished = 0;
    let matchesPending = 0;

    // Create 16 players
    const players: { id: string; name: string }[] = [];
    for (let j = 1; j <= 16; j++) {
      const playerRef = db.collection("players").doc();
      await playerRef.set({
        name: `Player ${j}`,
        tournamentId: tournamentRef.id,
        createdAt: new Date(),
      });
      players.push({ id: playerRef.id, name: `Player ${j}` });
    }

    // Generate matches based on tournament status
    if (config.status === "upcoming") {
      progress = 0;
      // Round 1 only, all pending
      for (let j = 0; j < 8; j++) {
        const matchRef = db.collection("matches").doc();
        await matchRef.set({
          tournamentId: tournamentRef.id,
          round: 1,
          roundName: "Round 1",
          matchNumber: j + 1,
          playerA: players[j * 2].id,
          playerB: players[j * 2 + 1].id,
          playerAName: players[j * 2].name,
          playerBName: players[j * 2 + 1].name,
          scoreA: 0,
          scoreB: 0,
          winner: null,
          status: "pending",
          createdAt: new Date(),
        });
        matchesPending++;
      }
    } else if (config.status === "live") {
      progress = 25;
      // Round 1 finished, Round 2 pending
      const round1Winners: { id: string; name: string }[] = [];
      
      // Round 1 - finished
      for (let j = 0; j < 8; j++) {
        const playerA = players[j * 2];
        const playerB = players[j * 2 + 1];
        const scoreA = Math.floor(Math.random() * 51) + 50;
        const scoreB = Math.floor(Math.random() * 51) + 50;
        const winner = scoreA > scoreB ? playerA : playerB;
        
        const matchRef = db.collection("matches").doc();
        await matchRef.set({
          tournamentId: tournamentRef.id,
          round: 1,
          roundName: "Round 1",
          matchNumber: j + 1,
          playerA: playerA.id,
          playerB: playerB.id,
          playerAName: playerA.name,
          playerBName: playerB.name,
          scoreA,
          scoreB,
          winner: winner.id,
          winnerName: winner.name,
          status: "finished",
          createdAt: new Date(),
        });
        
        round1Winners.push(winner);
        matchesFinished++;
      }
      
      // Round 2 - pending
      for (let j = 0; j < 4; j++) {
        const playerA = round1Winners[j * 2];
        const playerB = round1Winners[j * 2 + 1];
        
        const matchRef = db.collection("matches").doc();
        await matchRef.set({
          tournamentId: tournamentRef.id,
          round: 2,
          roundName: "Quarterfinals",
          matchNumber: j + 1,
          playerA: playerA.id,
          playerB: playerB.id,
          playerAName: playerA.name,
          playerBName: playerB.name,
          scoreA: 0,
          scoreB: 0,
          winner: null,
          status: "pending",
          createdAt: new Date(),
        });
        matchesPending++;
      }
    } else if (config.status === "completed") {
      progress = 100;
      // Full bracket
      let currentRoundPlayers = [...players];
      
      for (let round = 1; round <= 4; round++) {
        const roundName = round === 1 ? "Round 1" : 
                         round === 2 ? "Quarterfinals" :
                         round === 3 ? "Semifinals" : "Finals";
        
        const nextRoundPlayers: { id: string; name: string }[] = [];
        const matchesInRound = currentRoundPlayers.length / 2;
        
        for (let j = 0; j < matchesInRound; j++) {
          const playerA = currentRoundPlayers[j * 2];
          const playerB = currentRoundPlayers[j * 2 + 1];
          const scoreA = Math.floor(Math.random() * 51) + 50;
          const scoreB = Math.floor(Math.random() * 51) + 50;
          const winner = scoreA > scoreB ? playerA : playerB;
          
          const matchRef = db.collection("matches").doc();
          await matchRef.set({
            tournamentId: tournamentRef.id,
            round,
            roundName,
            matchNumber: j + 1,
            playerA: playerA.id,
            playerB: playerB.id,
            playerAName: playerA.name,
            playerBName: playerB.name,
            scoreA,
            scoreB,
            winner: winner.id,
            winnerName: winner.name,
            status: "finished",
            createdAt: new Date(),
          });
          
          nextRoundPlayers.push(winner);
          matchesFinished++;
          
          if (round === 4) {
            champion = winner.name;
          }
        }
        
        currentRoundPlayers = nextRoundPlayers;
      }
    }

    // Create tournament document
    const tournamentData: any = {
      name: config.name,
      game: config.game,
      status: config.status,
      startDate: startDate,
      progress,
      createdAt: new Date(),
      maxPlayers: 16,
      currentPlayers: 16
    };
    
    if (champion) {
      tournamentData.champion = champion;
    }
    
    if (config.status === "live") {
      tournamentData.matchesFinished = matchesFinished;
      tournamentData.matchesPending = matchesPending;
    }
    
    await tournamentRef.set(tournamentData);
    console.log(`✅ Tournament created: ${config.name} (${config.status})`);
    if (champion) {
      console.log(`   🏆 Champion: ${champion}`);
    }
  }

  console.log("✅ All tournaments seeded.");
}

async function seedAll() {
  console.log("🌱 Starting full CQG seed...");

  // 1. Clear existing collections
  await clearCollections();

  // 2. Seed tiers
  await seedTiers();

  // 3. Seed tournaments (players + matches auto-included)
  await seedTournaments();

  console.log("🎉 Full CQG seed complete!");
}

seedAll().catch(err => {
  console.error("❌ Error seeding all:", err);
  process.exit(1);
});


