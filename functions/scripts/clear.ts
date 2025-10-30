import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();

async function clearCollection(name: string) {
  try {
    const snapshot = await db.collection(name).get();
    if (snapshot.empty) {
      console.log(`⚠️ Collection '${name}' is already empty.`);
      return;
    }
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`🗑️ Cleared collection '${name}'`);
  } catch (err) {
    console.error(`❌ Failed to clear '${name}':`, err);
  }
}

clearCollection("readinessTests");
clearCollection("clans");
clearCollection("matches");
clearCollection("tickets");
