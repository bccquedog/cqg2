import type { NextApiRequest, NextApiResponse } from "next";
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const app = initializeApp({ projectId: "demo-cqg" });
const db = getFirestore(app);
if (process.env.FIRESTORE_EMULATOR_HOST) {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
  connectFirestoreEmulator(db, host, Number(port));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  if (!id) return res.status(400).json({ error: "missing id" });

  try {
    if (req.method === "GET") {
      const ref = doc(db, "players", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return res.status(404).json({ error: "not found" });
      return res.status(200).json({ id: snap.id, ...snap.data() });
    }
    if (req.method === "PATCH") {
      const uid = (req.headers["x-user-id"] as string) || "dev-user"; // dev shim
      if (uid !== id) return res.status(403).json({ error: "forbidden" });
      const { username, avatarUrl, tier } = req.body || {};
      const ref = doc(db, "players", id);
      await updateDoc(ref, {
        ...(username ? { username } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(tier ? { tier } : {}),
        updatedAt: serverTimestamp(),
      });
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "API error" });
  }
}




