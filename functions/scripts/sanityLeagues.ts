import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

async function sanityCheckLeagues() {
  try {
    console.log("🔍 Starting League Sanity Check...\n");

    const snapshot = await db.collection("leagues").get();
    if (snapshot.empty) {
      console.log("❌ No leagues found");
      return;
    }

    console.log("✅ Leagues in Firestore:\n");
    snapshot.forEach(doc => {
      const data = doc.data();
      const participants = data.participants || [];
      const stats = data.stats || { matchesPlayed: 0 };
      console.log(`📊 ${data.name} | Type: ${data.type} | Season: ${data.season} | Participants: ${participants.length} | Matches: ${stats.matchesPlayed}`);
      console.log(`   Participants: ${participants.join(", ")}`);
      console.log(`   Created: ${data.createdAt}`);
      console.log("");
    });

    console.log(`📊 Total leagues: ${snapshot.size}`);
    console.log("✅ League sanity check completed successfully!");

  } catch (err) {
    console.error("❌ League sanity check failed:", err);
  }
}

sanityCheckLeagues();
