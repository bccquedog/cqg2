import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function exportCollection(docRef: FirebaseFirestore.DocumentReference, sub: string) {
  const snap = await docRef.collection(sub).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function tournamentWrapUp(competitionId: string) {
  console.log(`📦 Archiving tournament ${competitionId}...`);

  const tournamentRef = db.collection("tournaments").doc(competitionId);
  const outDir = path.join(process.cwd(), `archive_${competitionId}_${Date.now()}`);
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Leaderboard
  const leaderboard = await exportCollection(tournamentRef, "leaderboard");
  fs.writeFileSync(path.join(outDir, "leaderboard.json"), JSON.stringify(leaderboard, null, 2));

  // 2. Spotlight
  const spotlightSnap = await tournamentRef.collection("spotlights").doc("current").get();
  if (spotlightSnap.exists) {
    fs.writeFileSync(path.join(outDir, "spotlight.json"), JSON.stringify(spotlightSnap.data(), null, 2));
  }

  // 3. Polls
  const polls = await exportCollection(tournamentRef, "polls");
  fs.writeFileSync(path.join(outDir, "polls.json"), JSON.stringify(polls, null, 2));

  // 4. Clips
  const clips = await exportCollection(tournamentRef, "clips");
  fs.writeFileSync(path.join(outDir, "clips.json"), JSON.stringify(clips, null, 2));

  console.log(`✅ Tournament archive saved to ${outDir}`);
}

// Run directly
if (require.main === module) {
  const compId = process.argv[2] || "soloCupS1";
  tournamentWrapUp(compId)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
