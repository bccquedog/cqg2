import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

async function sanityCheckMemberships() {
  console.log("✅ Checking Membership Tiers...\n");

  const membershipsSnapshot = await db.collection("memberships").get();
  if (membershipsSnapshot.empty) {
    console.log("❌ No memberships found");
    return;
  }

  membershipsSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(
      `👑 ${data.name} | $${data.priceUSD}/mo | StripeProduct=${data.stripeProductId}, StripePrice=${data.stripePriceId}\n   Features: ${data.features.join(", ")}`
    );
  });

  console.log(`\n📌 Summary: ${membershipsSnapshot.size} membership tiers found`);
  console.log("✅ Sanity check complete\n");
}

sanityCheckMemberships();


