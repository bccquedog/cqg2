import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

export async function sanityTickets() {
  console.log("🎟 Running Ticket Sanity Check...");

  const snapshot = await db.collection("tickets").get();
  if (snapshot.empty) {
    console.log("⚠️ No tickets found");
    return;
  }

  let active = 0;
  let expired = 0;
  let invalid = 0;
  let warnings = 0;

  const now = new Date().toISOString();

  for (const doc of snapshot.docs) {
    const data = doc.data();

    console.log(`\n🎟 Ticket ID: ${doc.id}`);
    console.log(`   Code: ${data.code}`);
    console.log(`   User: ${data.userId}`);
    console.log(`   Competition: ${data.competitionId}`);
    console.log(`   Round: ${data.roundId}`);
    console.log(`   Issued At: ${data.issuedAt}`);
    console.log(`   Expires At: ${data.expiresAt}`);
    console.log(`   Valid: ${data.valid}`);

    // Expiration check
    if (data.expiresAt < now) {
      console.log("   ⚠️ Ticket is expired");
      expired++;
      warnings++;
    } else if (!data.valid) {
      console.log("   ❌ Ticket is revoked/invalid");
      invalid++;
      warnings++;
    } else {
      console.log("   ✅ Ticket is active");
      active++;
    }
  }

  // Summary
  console.log("\n📌 Ticket Summary");
  console.log(`   Active: ${active}`);
  console.log(`   Expired: ${expired}`);
  console.log(`   Invalid: ${invalid}`);
  console.log(`   Warnings: ${warnings}`);
  console.log("✅ Sanity check complete");
}

// Run script if executed directly
if (require.main === module) {
  sanityTickets()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
