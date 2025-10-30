// seed.js
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, collection } = require("firebase/firestore");
const { connectFirestoreEmulator } = require("firebase/firestore");

const firebaseConfig = {
  projectId: "demo-cqg", // must match your emulator project ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
connectFirestoreEmulator(db, "localhost", 8080);

async function seed() {
  console.log("🌱 Seeding Firestore with 16-player tournament & bracket...");

  // Tournament doc
  const tournamentRef = doc(collection(db, "tournaments"));
  await setDoc(tournamentRef, {
    name: "Test 16-Player Tournament",
    game: "CQG-Test",
    type: "single-elim",
    status: "setup",
    createdAt: new Date().toISOString(),
  });

  // Players
  const players = Array.from({ length: 16 }, (_, i) => ({
    id: `player${i + 1}`,
    name: `Player ${i + 1}`,
    seed: i + 1,
  }));

  for (const player of players) {
    await setDoc(doc(collection(tournamentRef, "players"), player.id), player);
  }

  const matchesRef = collection(tournamentRef, "matches");

  // Round 1
  for (let i = 0; i < 16; i += 2) {
    const matchId = `R1M${i / 2 + 1}`;
    await setDoc(doc(matchesRef, matchId), {
      round: 1,
      matchId,
      playerA: players[i],
      playerB: players[i + 1],
      scoreA: 0,
      scoreB: 0,
      winner: null,
      completedAt: null,
      locked: false, // NEW
      nextMatchId: `R2M${Math.floor(i / 4) + 1}`,
    });
  }

  // Round 2
  for (let i = 0; i < 8; i += 2) {
    const matchId = `R2M${i / 2 + 1}`;
    await setDoc(doc(matchesRef, matchId), {
      round: 2,
      matchId,
      playerA: null,
      playerB: null,
      scoreA: 0,
      scoreB: 0,
      winner: null,
      completedAt: null,
      locked: false, // NEW
      nextMatchId: `R3M${Math.floor(i / 4) + 1}`,
    });
  }

  // Round 3
  for (let i = 0; i < 4; i += 2) {
    const matchId = `R3M${i / 2 + 1}`;
    await setDoc(doc(matchesRef, matchId), {
      round: 3,
      matchId,
      playerA: null,
      playerB: null,
      scoreA: 0,
      scoreB: 0,
      winner: null,
      completedAt: null,
      locked: false, // NEW
      nextMatchId: "Final",
    });
  }

  // Final
  await setDoc(doc(matchesRef, "Final"), {
    round: 4,
    matchId: "Final",
    playerA: null,
    playerB: null,
    scoreA: 0,
    scoreB: 0,
    winner: null,
    completedAt: null,
    locked: false, // NEW
    nextMatchId: null,
  });

  console.log("✅ Tournament, players, and bracket seeded!");
}

seed().then(() => process.exit());