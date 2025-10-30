import { db } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc, getDoc, updateDoc } from "firebase/firestore";
import type { PlayerProfile } from "@/types/player";

export async function setPlayerProfile(userId: string, data: PlayerProfile): Promise<void> {
  const ref = doc(db, "players", userId);

  const payload: any = {
    username: data.username,
    avatarUrl: data.avatarUrl ?? null,
    status: data.status,
    bio: data.bio ?? null,
    streamUrl: data.streamUrl ?? null,
    stats: data.stats ?? { matchesPlayed: 0, wins: 0, losses: 0 },
    subscription: data.subscription ?? "gamer",
    createdAt: data.createdAt ?? serverTimestamp(),
  };

  await setDoc(ref, payload, { merge: true });
}

// Fetch a player profile
export async function getPlayer(playerId: string): Promise<(PlayerProfile & { id: string }) | null> {
  const ref = doc(db, "players", playerId);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as PlayerProfile) }) : null;
}

// Create or update player with updatedAt using server time
export async function savePlayer(playerId: string, data: Partial<PlayerProfile>): Promise<void> {
  const ref = doc(db, "players", playerId);
  await setDoc(
    ref,
    { ...data, updatedAt: serverTimestamp(), lastActive: serverTimestamp() },
    { merge: true }
  );
}

// Update only the player's status
export async function updateStatus(playerId: string, status: PlayerProfile["status"]): Promise<void> {
  const ref = doc(db, "players", playerId);
  await updateDoc(ref, { status, lastActive: serverTimestamp() });
}

// Update only the player's stream URL
export async function updateStreamUrl(playerId: string, url: string): Promise<void> {
  const ref = doc(db, "players", playerId);
  await updateDoc(ref, { streamUrl: url, updatedAt: serverTimestamp() });
}


