import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function pruneArchived() {
  const now = new Date().toISOString();

  const collections = ["tournaments", "leagues"];
  for (const col of collections) {
    const snap = await db.collection(col).where("archived", "==", true).get();

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (data.pruneAt && data.pruneAt <= now) {
        console.log(`Pruning expired ${col} → ${docSnap.id}`);
        await docSnap.ref.delete();
      }
    }
  }

  console.log("✅ Archived competitions pruned");
}

pruneArchived()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error pruning competitions:", err);
    process.exit(1);
  });


