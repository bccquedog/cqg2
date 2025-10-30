"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

type ToastEventType = 
  | "mvp_lead_change"
  | "mvp_final"
  | "milestone_streak"
  | "milestone_total_wins"
  | "milestone_total_matches"
  | "highlight_surge"
  | "highlight_fan_favorite"
  | "upset_alert";

export async function logToastEvent(
  type: ToastEventType,
  tournamentId: string,
  playerId: string | null,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    await addDoc(collection(db, "analytics", "toasts", "events"), {
      type,
      tournamentId,
      playerId,
      metadata,
      timestamp: serverTimestamp(),
    });
    console.log(`[analytics:toast] ${type}`, { tournamentId, playerId, metadata });
  } catch (error) {
    console.error("[analytics:toast] Failed to log event:", error);
  }
}



