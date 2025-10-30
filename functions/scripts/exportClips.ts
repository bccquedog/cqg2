import * as admin from "firebase-admin";
import * as fs from "fs";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function exportClips(competitionId: string, format: "json" | "csv" = "json") {
  console.log(`📦 Exporting clips for ${competitionId}...`);

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

  const clips = clipsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  if (format === "json") {
    fs.writeFileSync(`clips_${competitionId}.json`, JSON.stringify(clips, null, 2));
    console.log(`✅ Exported ${clips.length} clips to clips_${competitionId}.json`);
  } else {
    const headers = Object.keys(clips[0]).join(",");
    const rows = clips
      .map((clip) =>
        Object.values(clip)
          .map((val) => `"${String(val).replace(/"/g, '""')}"`) // escape quotes
          .join(",")
      )
      .join("\n");
    const csv = [headers, rows].join("\n");
    fs.writeFileSync(`clips_${competitionId}.csv`, csv);
    console.log(`✅ Exported ${clips.length} clips to clips_${competitionId}.csv`);
  }
}

// Run directly
if (require.main === module) {
  const compId = process.argv[2] || "soloCupS1";
  const format = (process.argv[3] as "json" | "csv") || "json";
  exportClips(compId, format)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}


