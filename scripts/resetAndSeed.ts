/*
  Reset and Seed Script
  - Clears tournaments and subcollections (players, matches)
  - Ensures Firestore emulator is being used (safety guard)
  - Runs scripts/seedDay.ts to reseed Upcoming, Live, Completed tournaments
  - Logs outputs including champion for Completed
  
  Run: npx ts-node scripts/resetAndSeed.ts
*/

import { initializeApp as initializeClientApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy
} from "firebase/firestore";

async function assertEmulator(): Promise<{ host: string; port: number }> {
  const hostPort = process.env.FIRESTORE_EMULATOR_HOST;
  if (!hostPort) {
    console.error("❌ FIRESTORE_EMULATOR_HOST not set. Refusing to run against production. Start the emulator and set the env var.");
    process.exit(1);
  }
  const [host, portStr] = hostPort.split(":");
  const portNum = Number(portStr);
  if (!host || !portNum) {
    console.error(`❌ Invalid FIRESTORE_EMULATOR_HOST value: ${hostPort}`);
    process.exit(1);
  }
  return { host, port: portNum };
}

async function clearTournaments(db: ReturnType<typeof getFirestore>) {
  // Delete tournaments and their subcollections (players, matches)
  const tournamentsSnap = await getDocs(collection(db, "tournaments"));
  for (const tDoc of tournamentsSnap.docs) {
    const tId = tDoc.id;

    // Delete players subcollection
    const playersSnap = await getDocs(collection(db, "tournaments", tId, "players"));
    await Promise.all(playersSnap.docs.map((d) => deleteDoc(doc(db, "tournaments", tId, "players", d.id))));

    // Delete matches subcollection
    const matchesSnap = await getDocs(collection(db, "tournaments", tId, "matches"));
    await Promise.all(matchesSnap.docs.map((d) => deleteDoc(doc(db, "tournaments", tId, "matches", d.id))));

    // Delete the tournament document
    await deleteDoc(doc(db, "tournaments", tId));
  }
}

async function logSeededSummary(db: ReturnType<typeof getFirestore>) {
  const tournamentsQ = query(collection(db, "tournaments"), orderBy("createdAt", "desc"));
  const snap = await getDocs(tournamentsQ);
  console.log("\n📋 Seeded tournaments:");
  for (const d of snap.docs) {
    const data: any = d.data();
    const status = data.status || "unknown";
    const name = data.name || d.id;
    const id = d.id;
    console.log(`- ${name} [${status}] → http://localhost:3000/tournaments/${id}`);

    if (status === "completed") {
      // Try to read champion from doc first
      let champion: string | null = data.champion || data.winner || null;
      if (!champion) {
        // Fallback: compute from final match
        const matchesSnap = await getDocs(collection(db, "tournaments", id, "matches"));
        const matches = matchesSnap.docs.map((m) => ({ id: m.id, ...(m.data() as any) }));
        if (matches.length > 0) {
          const finalMatch = matches
            .filter((m) => !!m.winner)
            .sort((a, b) => (b.roundNumber || b.round || 1) - (a.roundNumber || a.round || 1))[0];
          champion = finalMatch?.winner || null;
        }
      }
      if (champion) console.log(`  🏆 Champion: ${champion}`);
    }
  }
}

async function main() {
  const { host, port } = await assertEmulator();

  // Init client SDK and connect to emulator
  const app = initializeClientApp({ projectId: "demo-cqg" });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, host, port);

  // Quick emulator reachability check: list tournaments (no throw expected)
  try {
    await getDocs(collection(db, "tournaments"));
  } catch (e) {
    console.error("❌ Could not reach Firestore emulator. Is it running?", e);
    process.exit(1);
  }

  console.log("🧹 Clearing old tournaments...");
  await clearTournaments(db);
  console.log("✅ Old tournaments cleared.");

  console.log("🌱 Seeding new tournaments (via scripts/seedDay.ts)...");
  // Dynamically import the existing seeder; it executes on import
  await import("./seedDay");
  console.log("✅ New tournaments seeded.");

  await logSeededSummary(db);
}

main().catch((err) => {
  console.error("❌ resetAndSeed failed:", err);
  process.exit(1);
});




