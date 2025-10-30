import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function sanityAdminPanel() {
  console.log("🔍 Checking Bugatti Admin Panel...\n");

  const adminPanelRef = db.collection("admin").doc("control");

  // Check main admin control
  const controlSnap = await adminPanelRef.get();
  if (!controlSnap.exists) {
    console.log("❌ Main admin control panel not found");
    return;
  }

  const controlData = controlSnap.data();
  console.log("✅ Main admin control panel found");
  console.log(`   System Status: ${controlData?.systemStatus}`);
  console.log(`   Features: ${JSON.stringify(controlData?.features)}`);
  console.log(`   Created: ${controlData?.createdAt}`);
  console.log(`   Updated: ${controlData?.updatedAt}`);

  // Check membership settings
  const membershipSnap = await adminPanelRef.collection("memberships").doc("settings").get();
  if (membershipSnap.exists) {
    const membershipData = membershipSnap.data();
    console.log("\n✅ Membership settings found");
    console.log(`   Default Tier: ${membershipData?.defaultTier}`);
    console.log(`   Free Trials: ${membershipData?.allowFreeTrials}`);
    console.log(`   Adjustable Pricing: ${membershipData?.adjustablePricing}`);
  } else {
    console.log("\n⚠️ Membership settings not found");
  }

  // Check competition settings
  const competitionSnap = await adminPanelRef.collection("competitions").doc("settings").get();
  if (competitionSnap.exists) {
    const competitionData = competitionSnap.data();
    console.log("\n✅ Competition settings found");
    console.log(`   Buy-ins Enabled: ${competitionData?.buyInsEnabled}`);
    console.log(`   Score Disputes: ${competitionData?.scoreDisputesEnabled}`);
    console.log(`   Player-run Events: ${competitionData?.allowPlayerRunEvents}`);
  } else {
    console.log("\n⚠️ Competition settings not found");
  }

  // Check clip settings
  const clipSnap = await adminPanelRef.collection("clips").doc("settings").get();
  if (clipSnap.exists) {
    const clipData = clipSnap.data();
    console.log("\n✅ Clip moderation settings found");
    console.log(`   Auto Prune Days: ${clipData?.autoPruneDays}`);
    console.log(`   Moderation Queue: ${clipData?.moderationQueueEnabled}`);
    console.log(`   Spotlight Enabled: ${clipData?.spotlightEnabled}`);
  } else {
    console.log("\n⚠️ Clip moderation settings not found");
  }

  // Check security settings
  const securitySnap = await adminPanelRef.collection("security").doc("settings").get();
  if (securitySnap.exists) {
    const securityData = securitySnap.data();
    console.log("\n✅ Security settings found");
    console.log(`   Freeze Accounts: ${securityData?.allowFreezeAccounts}`);
    console.log(`   Admin Overrides: ${securityData?.allowAdminOverrides}`);
    console.log(`   Logging Enabled: ${securityData?.loggingEnabled}`);
  } else {
    console.log("\n⚠️ Security settings not found");
  }

  console.log("\n🏁 Admin panel sanity check complete.");
}

if (require.main === module) {
  sanityAdminPanel()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
