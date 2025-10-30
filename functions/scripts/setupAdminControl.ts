import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK for emulator
if (!admin.apps.length) {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8085";
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function setupAdminControl() {
  console.log("🚀 Setting up admin control settings in Firestore emulator...\n");
  
  try {
    // Main admin control document
    console.log("📝 Creating admin control document...");
    await db.collection("admin").doc("control").set({
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      systemStatus: "online", // toggle entire platform ON/OFF
      features: {
        tournaments: true,
        leagues: true,
        clips: true,
        memberships: true,
      },
      settings: {
        allowFreeTrials: true,
        adjustablePricing: true,
        buyInsEnabled: true,
        scoreDisputesEnabled: true,
        allowPlayerRunEvents: false,
        autoPruneDays: 14,
        moderationQueueEnabled: true,
        spotlightEnabled: true,
        allowFreezeAccounts: true,
        allowAdminOverrides: true,
        loggingEnabled: true,
      }
    });
    console.log("✅ Main admin control document created");

    // Membership settings
    console.log("📝 Creating membership settings...");
    await db.collection("admin").doc("control").collection("memberships").doc("settings").set({
      defaultTier: "Gamer",
      allowFreeTrials: true,
      adjustablePricing: true,
      updatedAt: new Date().toISOString(),
      tiers: {
        gamer: {
          name: "Gamer",
          price: 0,
          perks: ["Free leagues", "Basic tournaments"],
          active: true
        },
        mamba: {
          name: "Mamba", 
          price: 9.99,
          perks: ["Premium leagues", "1 free tournament request"],
          active: true
        },
        king: {
          name: "The King",
          price: 19.99, 
          perks: ["2 free tournament requests", "Early access events"],
          active: true
        },
        elite: {
          name: "CQG Elite",
          price: 0,
          perks: ["Invite only"],
          active: true
        }
      }
    });
    console.log("✅ Membership settings created");

    // Competition settings
    console.log("📝 Creating competition settings...");
    await db.collection("admin").doc("control").collection("competitions").doc("settings").set({
      buyInsEnabled: true,
      scoreDisputesEnabled: true,
      allowPlayerRunEvents: false,
      defaultMaxPlayers: 32,
      defaultMaxTeams: 16,
      updatedAt: new Date().toISOString(),
    });
    console.log("✅ Competition settings created");

    // Clip settings
    console.log("📝 Creating clip settings...");
    await db.collection("admin").doc("control").collection("clips").doc("settings").set({
      autoPruneDays: 14,
      moderationQueueEnabled: true,
      spotlightEnabled: true,
      updatedAt: new Date().toISOString(),
    });
    console.log("✅ Clip settings created");

    // Security settings
    console.log("📝 Creating security settings...");
    await db.collection("admin").doc("control").collection("security").doc("settings").set({
      allowFreezeAccounts: true,
      allowAdminOverrides: true,
      loggingEnabled: true,
      updatedAt: new Date().toISOString(),
    });
    console.log("✅ Security settings created");

    console.log("\n🎉 Admin control setup completed!");
    console.log("📊 Admin control structure:");
    console.log("  • /admin/control (main settings)");
    console.log("  • /admin/control/memberships/settings");
    console.log("  • /admin/control/competitions/settings");
    console.log("  • /admin/control/clips/settings");
    console.log("  • /admin/control/security/settings");
    
    return true;

  } catch (error) {
    console.error("❌ Error setting up admin control:", error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await setupAdminControl();
    console.log("\n✅ Script completed successfully!");
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Fatal error:", error);
      process.exit(1);
    });
}

export { setupAdminControl };
