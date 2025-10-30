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

async function verifyAdmin(userUid: string) {
  console.log(`🔍 Verifying admin status for UID: ${userUid}\n`);
  
  try {
    // Check Firebase Auth custom claims
    console.log("📝 Checking Firebase Auth custom claims...");
    const userRecord = await auth.getUser(userUid);
    console.log(`✅ User: ${userRecord.email}`);
    console.log(`✅ UID: ${userRecord.uid}`);
    console.log(`✅ Custom Claims:`, userRecord.customClaims);
    
    // Check admin collection
    console.log("\n📝 Checking admins collection...");
    const adminDoc = await db.collection("admins").doc(userUid).get();
    if (adminDoc.exists) {
      console.log(`✅ Admin Record Found:`);
      console.log(`   Role: ${adminDoc.data()?.role}`);
      console.log(`   Email: ${adminDoc.data()?.email}`);
      console.log(`   Status: ${adminDoc.data()?.status}`);
      console.log(`   Permissions:`, adminDoc.data()?.permissions);
    } else {
      console.log("❌ No admin record found in Firestore");
    }
    
    // Check player profile
    console.log("\n📝 Checking player profile...");
    const playerDoc = await db.collection("players").doc(userUid).get();
    if (playerDoc.exists) {
      console.log(`✅ Player Profile Found:`);
      console.log(`   Display Name: ${playerDoc.data()?.displayName}`);
      console.log(`   Role: ${playerDoc.data()?.role}`);
      console.log(`   Tier: ${playerDoc.data()?.tier}`);
      console.log(`   Status: ${playerDoc.data()?.status}`);
    } else {
      console.log("❌ No player profile found in Firestore");
    }
    
    console.log("\n🎉 Admin verification completed!");
    return true;
    
  } catch (error) {
    console.error("❌ Error verifying admin:", error);
    return false;
  }
}

// Main execution
async function main() {
  const userUid = "3ueIlbSWtRYeCXoXrhhVAsE9X6I2"; // Your UID
  
  try {
    await verifyAdmin(userUid);
  } catch (error) {
    console.error("❌ Verification failed:", error);
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

export { verifyAdmin };
