import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

async function sanityAccessCheck() {
  console.log("✅ Checking User Access Based on Memberships...\n");

  // Fetch memberships
  const membershipsSnapshot = await db.collection("memberships").get();
  const memberships: Record<string, any> = {};
  membershipsSnapshot.forEach(doc => memberships[doc.id] = doc.data());

  // Fetch users (limit to 10 for sanity)
  const usersSnapshot = await db.collection("users").limit(10).get();
  if (usersSnapshot.empty) {
    console.log("❌ No users found in Firestore");
    return;
  }

  let invalidCount = 0;

  usersSnapshot.forEach(doc => {
    const user = doc.data();
    const activeMembership = user.membership?.tierId || "none";
    const tier = memberships[activeMembership];

    if (!tier) {
      console.log(`👤 User: ${user.username || doc.id}`);
      console.log(`   Tier: ❌ Invalid (${activeMembership})`);
      console.log("   ⚠️ Warning: User assigned to non-existent membership tier\n");
      invalidCount++;
      return;
    }

    console.log(`👤 User: ${user.username || doc.id}`);
    console.log(`   Tier: ${tier?.name || "❌ None"}`);

    if (tier?.features?.includes("allFeatures")) {
      console.log("   ✅ Has access to ALL features");
    } else if (tier?.features?.length > 0) {
      console.log(`   ✅ Features: ${tier.features.join(", ")}`);
    } else {
      console.log("   ❌ No features assigned");
    }

    // Check sample features
    const sampleChecks = ["premiumLeagues", "creatorTools"];
    sampleChecks.forEach(f => {
      const allowed = tier?.features?.includes("allFeatures") || tier?.features?.includes(f);
      console.log(`   - ${f}: ${allowed ? "✅ Allowed" : "❌ Not Allowed"}`);
    });

    console.log(""); // spacing
  });

  console.log("📌 Sanity Access Check Complete");
  console.log(`   Total Users Checked: ${usersSnapshot.size}`);
  console.log(`   Invalid Memberships Found: ${invalidCount}\n`);
}

sanityAccessCheck();
