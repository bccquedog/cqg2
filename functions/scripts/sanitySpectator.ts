import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const MAX_ALERTS = 50; // keep only the last 50 alerts

export async function sanitySpectatorOverlay(competitionId: string) {
  try {
    console.log(`🎥 Checking spectator overlay for ${competitionId}...`);

    // Fetch alerts ordered newest → oldest
    const alertsSnap = await db
      .collection("tournaments")
      .doc(competitionId)
      .collection("alerts")
      .orderBy("timestamp", "desc")
      .get();

    const alerts = alertsSnap.docs;
    console.log(`\n📢 Alerts found: ${alerts.length}`);

    // Show last 5 for reference
    alerts.slice(0, 5).forEach((doc) => console.log(`   - ${doc.data().message}`));

    // Auto-prune if too many
    if (alerts.length > MAX_ALERTS) {
      const excess = alerts.slice(MAX_ALERTS);
      console.log(`⚠️ Too many alerts. Pruning ${excess.length} old alerts...`);

      const batch = db.batch();
      excess.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      console.log(`✅ Pruned ${excess.length} alerts. Now at ${MAX_ALERTS}.`);
    }

    // Spotlight check
    const spotlightSnap = await db
      .collection("tournaments")
      .doc(competitionId)
      .collection("spotlights")
      .doc("current")
      .get();

    if (spotlightSnap.exists) {
      const data = spotlightSnap.data();
      console.log(`\n🌟 Spotlight: ${data?.playerId} — ${data?.title}`);
      console.log(`   ${data?.description}`);
    } else {
      console.log("\n⚠️ No spotlight set");
    }

    // Summary
    console.log(`\n✅ Spectator overlay sanity check completed for ${competitionId}`);
    console.log(`   • ${alerts.length} alerts (max ${MAX_ALERTS})`);
    console.log(`   • ${spotlightSnap.exists ? '1' : '0'} spotlight`);

  } catch (error) {
    console.error(`❌ Error checking spectator overlay for ${competitionId}:`, error);
    throw error;
  }
}

// Run directly
if (require.main === module) {
  const compId = process.argv[2] || "soloCupS1";
  
  console.log(`🎥 Starting spectator overlay sanity check for: ${compId}`);
  
  sanitySpectatorOverlay(compId)
    .then(() => {
      console.log("🎥 Spectator overlay sanity check completed successfully!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Spectator overlay sanity check failed:", err);
      process.exit(1);
    });
}
