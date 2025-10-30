import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function seedAdminPanel() {
  console.log("🚀 Seeding Bugatti Admin Panel...");

  const adminPanelRef = db.collection("admin").doc("control");

  await adminPanelRef.set({
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    systemStatus: "online", // toggle entire platform ON/OFF
    features: {
      tournaments: true,
      leagues: true,
      clips: true,
      memberships: true,
    },
  });

  console.log("✅ Main admin control panel created");

  // Membership settings
  await adminPanelRef.collection("memberships").doc("settings").set({
    defaultTier: "Gamer",
    allowFreeTrials: false,
    adjustablePricing: true,
    updatedAt: new Date().toISOString(),
  });

  console.log("✅ Membership settings configured");

  // Competition settings
  await adminPanelRef.collection("competitions").doc("settings").set({
    buyInsEnabled: true,
    scoreDisputesEnabled: true,
    allowPlayerRunEvents: false,
    updatedAt: new Date().toISOString(),
  });

  console.log("✅ Competition settings configured");

  // Clip settings
  await adminPanelRef.collection("clips").doc("settings").set({
    autoPruneDays: 14,
    moderationQueueEnabled: true,
    spotlightEnabled: true,
    updatedAt: new Date().toISOString(),
  });

  console.log("✅ Clip moderation settings configured");

  // Security settings
  await adminPanelRef.collection("security").doc("settings").set({
    allowFreezeAccounts: true,
    allowAdminOverrides: true,
    loggingEnabled: true,
    updatedAt: new Date().toISOString(),
  });

  console.log("✅ Security settings configured");

  console.log("\n🎉 Bugatti Admin Panel seeded successfully!");
  console.log("📊 Admin panel structure:");
  console.log("   /admin/control - Main system control");
  console.log("   /admin/control/memberships/settings - Membership configuration");
  console.log("   /admin/control/competitions/settings - Competition rules");
  console.log("   /admin/control/clips/settings - Clip moderation");
  console.log("   /admin/control/security/settings - Security policies");
}

if (require.main === module) {
  seedAdminPanel()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Error seeding Bugatti Admin Panel:", err);
      process.exit(1);
    });
}
