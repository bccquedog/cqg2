import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK for emulator
if (!admin.apps.length) {
  // Use emulator settings
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8085";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
  
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function setupEmulatorAdmin() {
  console.log("🚀 Setting up admin account in Firebase Emulator...");
  console.log("📡 Using Firestore Emulator: 127.0.0.1:8085");
  console.log("🔐 Using Auth Emulator: 127.0.0.1:9099\n");
  
  const userEmail = "bccquedog@gmail.com";
  const userUid = "3ueIlbSWtRYeCXoXrhhVAsE9X6I2";
  const role = "super";
  
  try {
    // Step 1: Create admin record in Firestore
    console.log("📝 Creating admin record in Firestore...");
    const adminData = {
      uid: userUid,
      email: userEmail,
      role: role,
      permissions: {
        tournaments: true,
        leagues: true,
        users: true,
        system: true,
        clips: true,
        disputes: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active"
    };

    await db.collection("admins").doc(userUid).set(adminData);
    console.log("✅ Admin record created in Firestore");

    // Step 2: Create player profile
    console.log("📝 Creating player profile...");
    await db.collection("players").doc(userUid).set({
      displayName: "Admin User",
      gamerTag: "AdminUser",
      email: userEmail,
      role: "admin",
      tier: "admin",
      adminPermissions: {
        tournaments: true,
        leagues: true,
        users: true,
        system: true,
        clips: true,
        disputes: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
      stats: {},
      wallet: 10000
    });
    console.log("✅ Player profile created");

    // Step 3: Set custom claims (this might not work in emulator, but worth trying)
    console.log("📝 Setting custom claims...");
    try {
      await auth.setCustomUserClaims(userUid, {
        admin: true,
        role: role,
        tier: "admin",
        permissions: {
          tournaments: true,
          leagues: true,
          users: true,
          system: true,
          clips: true,
          disputes: true
        }
      });
      console.log("✅ Custom claims set");
    } catch (error) {
      console.log("⚠️ Custom claims not set (expected in emulator):", (error as Error).message);
    }

    console.log("\n🎉 Emulator admin setup completed!");
    console.log(`👤 ${userEmail} is now an admin in the emulator`);
    console.log("\n📋 Next Steps:");
    console.log("1. Go to http://localhost:3000");
    console.log("2. Sign in with your Google account");
    console.log("3. Access admin dashboard at http://localhost:3000/admin");
    console.log("\n💡 Note: You may need to create the user account first in the emulator");
    console.log("   if it doesn't exist yet. The admin privileges will be applied automatically.");

    return true;

  } catch (error) {
    console.error("❌ Error setting up emulator admin:", error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await setupEmulatorAdmin();
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

export { setupEmulatorAdmin };
