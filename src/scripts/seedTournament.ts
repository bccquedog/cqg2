import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function seedTournament() {
  try {
    await addDoc(collection(db, "tournaments"), {
      name: "CQG Test Tournament",
      game: "Call of Duty",
      type: "single-elimination",
      status: "upcoming",
      createdAt: serverTimestamp(),
    });
    console.log("✅ Tournament seeded!");
  } catch (err) {
    console.error("❌ Error seeding tournament:", err);
  }
}


