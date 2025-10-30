import type { NextApiRequest, NextApiResponse } from "next";
import { initializeApp as initializeClientApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

type Data = {
  success: boolean;
  tournaments?: string[];
  champion?: string | null;
  error?: string;
};

async function clearAll(db: ReturnType<typeof getFirestore>) {
  const tournamentsSnap = await getDocs(collection(db, "tournaments"));
  for (const t of tournamentsSnap.docs) {
    const tId = t.id;
    const playersSnap = await getDocs(collection(db, "tournaments", tId, "players"));
    await Promise.all(playersSnap.docs.map((d) => deleteDoc(doc(db, "tournaments", tId, "players", d.id))));
    const matchesSnap = await getDocs(collection(db, "tournaments", tId, "matches"));
    await Promise.all(matchesSnap.docs.map((d) => deleteDoc(doc(db, "tournaments", tId, "matches", d.id))));
    await deleteDoc(doc(db, "tournaments", tId));
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ success: false, error: "Forbidden in production" });
  }

  const hostPort = process.env.FIRESTORE_EMULATOR_HOST;
  if (!hostPort) {
    return res.status(400).json({ success: false, error: "FIRESTORE_EMULATOR_HOST not set" });
  }
  const [host, portStr] = hostPort.split(":");
  const port = Number(portStr);
  if (!host || !port) {
    return res.status(400).json({ success: false, error: "Invalid FIRESTORE_EMULATOR_HOST" });
  }

  try {
    const app = initializeClientApp({ projectId: "demo-cqg" });
    const db = getFirestore(app);
    connectFirestoreEmulator(db, host, port);

    // Clear
    await clearAll(db);

    // Seed by dynamically importing existing seeder
    await import("../../scripts/seedDay");

    // Collect basic response info
    const seededSnap = await getDocs(collection(db, "tournaments"));
    const ids: string[] = seededSnap.docs.map((d) => d.id);

    // Find champion from any completed tournament
    let champion: string | null = null;
    for (const d of seededSnap.docs) {
      const data: any = d.data();
      if (data.status === "completed") {
        champion = data.champion || data.winner || null;
        if (!champion) {
          const matchesSnap = await getDocs(collection(db, "tournaments", d.id, "matches"));
          const matches = matchesSnap.docs.map((m) => ({ id: m.id, ...(m.data() as any) }));
          if (matches.length > 0) {
            const finalMatch = matches
              .filter((m) => !!m.winner)
              .sort((a, b) => (b.roundNumber || b.round || 1) - (a.roundNumber || a.round || 1))[0];
            champion = finalMatch?.winner || null;
          }
        }
        break;
      }
    }

    return res.status(200).json({ success: true, tournaments: ids, champion });
  } catch (e: any) {
    console.error("/api/resetAndSeed error", e);
    return res.status(500).json({ success: false, error: e?.message || "Unknown error" });
  }
}




