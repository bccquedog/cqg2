import * as admin from "firebase-admin";
import * as fs from "fs";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const CLIP_RETENTION_DAYS = 14;

async function exportClips(competitionId: string, clips: any[], label: string, format: "json" | "csv" = "json") {
  if (clips.length === 0) return;

  if (format === "json") {
    fs.writeFileSync(
      `clips_${competitionId}_${label}_${Date.now()}.json`,
      JSON.stringify(clips, null, 2)
    );
    console.log(`💾 Exported ${clips.length} clips to JSON (${label})`);
  } else {
    const headers = Object.keys(clips[0]).join(",");
    const rows = clips
      .map((clip) =>
        Object.values(clip)
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const csv = [headers, rows].join("\n");
    fs.writeFileSync(`clips_${competitionId}_${label}_${Date.now()}.csv`, csv);
    console.log(`💾 Exported ${clips.length} clips to CSV (${label})`);
  }
}

export async function sanityClips(competitionId: string, tournamentEnded = false) {
  console.log(`🎥 Checking clips for ${competitionId}...`);

  const now = new Date();
  const cutoff = new Date(now.getTime() - CLIP_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const clipsSnap = await db
    .collection("tournaments")
    .doc(competitionId)
    .collection("clips")
    .orderBy("createdAt", "desc")
    .get();

  if (clipsSnap.empty) {
    console.log("⚠️ No clips found.");
    return;
  }

  const clips = clipsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // 🔹 Auto-export ALL clips if tournament has ended
  if (tournamentEnded) {
    console.log("\n🏆 Tournament ended — exporting full hype pack...");
    await exportClips(competitionId, clips, "FULL", "json");
  }

  // 🔹 Auto-prune expired clips
  const batch = db.batch();
  const expired: any[] = [];
  clips.forEach((clip) => {
    const createdAt = new Date(clip.createdAt);
    if (createdAt < cutoff) {
      expired.push(clip);
      batch.delete(db.collection("tournaments").doc(competitionId).collection("clips").doc(clip.id));
    }
  });

  if (expired.length > 0) {
    console.log(`\n🗂 Found ${expired.length} expired clips. Exporting before prune...`);
    await exportClips(competitionId, expired, "EXPIRED", "json");
    await batch.commit();
    console.log(`🗑️ Pruned ${expired.length} expired clips (older than ${CLIP_RETENTION_DAYS} days).`);
  } else {
    console.log(`\n✅ No expired clips to prune.`);
  }
}

// Run directly
if (require.main === module) {
  const compId = process.argv[2] || "soloCupS1";
  const ended = process.argv.includes("--ended"); // pass flag to export full hype pack
  sanityClips(compId, ended)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
