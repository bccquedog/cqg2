import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

async function sanityCheckAdminMemberships() {
  console.log("✅ Checking Memberships (Admin Sanity)...\n");

  const snapshot = await db.collection("memberships").get();
  if (snapshot.empty) {
    console.log("❌ No memberships found");
    return;
  }

  let warnings = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`👑 ${data.name} | $${data.priceUSD}/mo`);
    console.log(`   Features: ${Array.isArray(data.features) ? data.features.join(", ") : "❌ None"}`);
    console.log(`   StripeProductId: ${data.stripeProductId} | StripePriceId: ${data.stripePriceId}`);
    console.log(`   Last Updated: ${data.updatedAt || "❌ Missing"} by ${data.updatedBy || "❌ Missing"}`);
    
    // Show buy-in overrides
    if (data.buyInOverride?.exempt) {
      console.log("   💎 Buy-In Override: Exempt from buy-ins");
    } else if (data.buyInOverride?.discountPercent > 0) {
      console.log(`   💰 Buy-In Override: ${data.buyInOverride.discountPercent}% discount`);
    } else {
      console.log("   💰 Buy-In Override: None");
    }

    // Warnings
    if (data.priceUSD < 0) {
      console.log("   ⚠️ Warning: Price is negative");
      warnings++;
    }
    if (!data.features || data.features.length === 0) {
      console.log("   ⚠️ Warning: Features missing");
      warnings++;
    }
    if (!data.updatedAt) {
      console.log("   ⚠️ Warning: updatedAt missing");
      warnings++;
    }
    if (!data.updatedBy) {
      console.log("   ⚠️ Warning: updatedBy missing");
      warnings++;
    }
    console.log(""); // spacing
  });

  // Fetch recent membership updates from audit history
  const historySnapshot = await db
    .collection("adminControls")
    .doc("history")
    .collection("membershipUpdates")
    .orderBy("updatedAt", "desc")
    .limit(3)
    .get();

  console.log("\n📝 Recent Membership Updates (last 3):");
  if (historySnapshot.empty) {
    console.log("   No membership updates found in history.");
  } else {
    historySnapshot.forEach(doc => {
      const h = doc.data();
      console.log(`   • ${h.tierId} updated by ${h.updatedBy || "unknown"} at ${h.updatedAt?.toDate() || "❌ Missing"}`);
      if (h.changes?.buyInOverride) {
        if (h.changes.buyInOverride.exempt) {
          console.log("     💎 Exempt from buy-ins");
        } else if (h.changes.buyInOverride.discountPercent > 0) {
          console.log(`     💰 Discount: ${h.changes.buyInOverride.discountPercent}%`);
        }
      }
      if (h.changes?.priceUSD !== undefined) {
        console.log(`     Price: $${h.changes.priceUSD}`);
      }
      if (h.changes?.features) {
        console.log(`     Features: ${h.changes.features.join(", ")}`);
      }
    });
  }

  console.log("\n📌 Summary");
  console.log(`   Total Tiers: ${snapshot.size}`);
  console.log(`   Warnings Detected: ${warnings}`);
  console.log("✅ Membership sanity check complete\n");
}

sanityCheckAdminMemberships();
