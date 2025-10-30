// src/utils/seedTestData.ts
import { db } from "@/lib/firebaseClient"; // adjust if your firebase client lives elsewhere
import { doc, setDoc } from "firebase/firestore";

export async function seedTestData() {
  try {
    // Seed a dummy profile
    await setDoc(doc(db, "users", "user123"), {
      username: "TestUser",
      email: "test@example.com",
      tier: "Gamer",
      createdAt: new Date(),
    });

    // Seed a dummy tournament
    await setDoc(doc(db, "tournaments", "tournament123"), {
      name: "CQG Test Tournament",
      game: "Madden 25",
      status: "upcoming",
      startDate: new Date(),
      createdBy: "admin123",
    });

    // Seed a dummy league
    await setDoc(doc(db, "leagues", "league123"), {
      name: "CQG Test League",
      season: "Preseason",
      status: "active",
      createdBy: "admin123",
    });

    console.log("✅ Test data seeded successfully.");
  } catch (err) {
    console.error("❌ Error seeding test data:", err);
  }
}
