import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function sanityAdmins() {
  console.log("🔍 Checking Admin Roles...\n");

  try {
    const adminsSnap = await db.collection("admins").get();
    
    if (adminsSnap.empty) {
      console.log("❌ No admin roles found.");
      return;
    }

    console.log(`✅ Found ${adminsSnap.docs.length} admin roles:`);
    
    adminsSnap.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n${index + 1}. ${data.email}`);
      console.log(`   UID: ${data.uid}`);
      console.log(`   Role: ${data.role}`);
      console.log(`   Created: ${data.createdAt}`);
    });

    // Check for required roles
    const roles = adminsSnap.docs.map(doc => doc.data().role);
    const requiredRoles = ["super", "mod", "viewer"];
    
    console.log("\n🔍 Role Coverage Check:");
    requiredRoles.forEach(role => {
      if (roles.includes(role)) {
        console.log(`✅ ${role} role found`);
      } else {
        console.log(`❌ ${role} role missing`);
      }
    });

  } catch (err) {
    console.error("❌ Error checking admin roles:", err);
  }
}

if (require.main === module) {
  sanityAdmins()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
