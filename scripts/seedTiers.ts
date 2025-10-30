import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app = initializeApp({ projectId: "demo-cqg" });
const db = getFirestore(app);

async function seedTiers() {
  const tiers = [
    { id: "gamer", level: 1, canAccessPremium: false, maxRequests: 30, earlyAccess: false },
    { id: "premium", level: 2, canAccessPremium: true, maxRequests: 60, earlyAccess: true },
    { id: "elite", level: 3, canAccessPremium: true, maxRequests: 120, earlyAccess: true }
  ];

  for (const tier of tiers) {
    await db.collection("tiers").doc(tier.id).set(tier);
    console.log(`✅ Seeded tier: ${tier.id}`);
  }

  console.log("🎉 All tiers seeded.");
}

seedTiers().catch(err => {
  console.error("❌ Error seeding tiers:", err);
  process.exit(1);
});


