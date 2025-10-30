import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function seedAdmins() {
  const adminsRef = db.collection("admins");

  const seed = [
    {
      uid: "superAdminUID",
      email: "you@cqg.com",
      role: "super", // can do everything
      createdAt: new Date().toISOString(),
    },
    {
      uid: "modAdminUID",
      email: "mod@cqg.com",
      role: "mod", // can manage clips, disputes, tournaments but not system toggles
      createdAt: new Date().toISOString(),
    },
    {
      uid: "viewerAdminUID",
      email: "viewer@cqg.com",
      role: "viewer", // read-only
      createdAt: new Date().toISOString(),
    },
  ];

  for (const a of seed) {
    await adminsRef.doc(a.uid).set(a);
  }

  console.log("✅ Admin roles seeded");
}

seedAdmins()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error seeding admins:", err);
    process.exit(1);
  });
