import type { NextApiRequest, NextApiResponse } from "next";
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, doc, setDoc, serverTimestamp } from "firebase/firestore";

const app = initializeApp({ projectId: "demo-cqg" });
const db = getFirestore(app);
if (process.env.FIRESTORE_EMULATOR_HOST) {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
  connectFirestoreEmulator(db, host, Number(port));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const uid = (req.headers["x-user-id"] as string) || "dev-user"; // dev shim if auth not wired
  const { username, avatarUrl, tier } = req.body || {};
  if (!username || typeof username !== "string") return res.status(400).json({ error: "username required" });
  try {
    const playerRef = doc(db, "players", uid);
    await setDoc(playerRef, {
      username,
      avatarUrl: avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + encodeURIComponent(uid),
      tier: tier || "unranked",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return res.status(200).json({ success: true, id: uid });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to create profile" });
  }
}




