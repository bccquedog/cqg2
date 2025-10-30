import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function makeUserAdmin(userEmail: string, userUid: string, role: string = "super") {
  console.log(`🚀 Making ${userEmail} (${userUid}) an admin with role: ${role}`);
  
  try {
    // Step 1: Set Firebase Auth Custom Claims
    console.log("📝 Setting Firebase Auth custom claims...");
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
    console.log("✅ Custom claims set successfully");

    // Step 2: Add to admins collection in Firestore
    console.log("📝 Adding to admins collection...");
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

    // Step 3: Update player profile if it exists
    console.log("📝 Checking for existing player profile...");
    const playerRef = db.collection("players").doc(userUid);
    const playerSnap = await playerRef.get();
    
    if (playerSnap.exists) {
      await playerRef.update({
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
        updatedAt: new Date().toISOString()
      });
      console.log("✅ Player profile updated with admin privileges");
    } else {
      // Create a basic player profile for the admin
      await playerRef.set({
        displayName: "Admin User",
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
        wallet: 10000 // Admin gets extra CQG Coins
      });
      console.log("✅ Admin player profile created");
    }

    // Step 4: Verify the setup
    console.log("\n🔍 Verifying admin setup...");
    const userRecord = await auth.getUser(userUid);
    console.log(`✅ User: ${userRecord.email}`);
    console.log(`✅ UID: ${userRecord.uid}`);
    console.log(`✅ Custom Claims:`, userRecord.customClaims);

    const adminDoc = await db.collection("admins").doc(userUid).get();
    if (adminDoc.exists) {
      console.log(`✅ Admin Record:`, adminDoc.data());
    }

    console.log("\n🎉 Admin setup completed successfully!");
    console.log(`👤 ${userEmail} is now an admin with ${role} privileges`);
    console.log("\n📋 Admin Capabilities:");
    console.log("  • Create and manage tournaments");
    console.log("  • Create and manage leagues");
    console.log("  • Manage user accounts and permissions");
    console.log("  • Access admin dashboard");
    console.log("  • Handle disputes and moderation");
    console.log("  • System configuration access");

    return true;

  } catch (error) {
    console.error("❌ Error making user admin:", error);
    throw error;
  }
}

// Main execution
async function main() {
  const userEmail = "bccquedog@gmail.com";
  const userUid = "3ueIlbSWtRYeCXoXrhhVAsE9X6I2";
  const role = "super"; // super, mod, or viewer

  try {
    await makeUserAdmin(userEmail, userUid, role);
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

export { makeUserAdmin };
