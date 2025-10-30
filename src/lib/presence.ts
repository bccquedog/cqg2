import { ref, onValue, off, DatabaseReference } from "firebase/database";
import { rtdb } from "./firebaseClient";
import { PresenceState } from "./realtimePresence";

export interface PresenceData {
  state: PresenceState;
  lastChanged: number | null;
}

/**
 * Subscribes to a user's presence in Realtime Database
 * @param userId - The user's unique identifier
 * @param callback - Function to call when presence changes
 * @returns Function to unsubscribe from presence updates
 */
export function getPresence(
  userId: string, 
  callback: (presence: PresenceData) => void
): () => void {
  const presenceRef: DatabaseReference = ref(rtdb, `presence/${userId}`);

  const unsubscribe = onValue(presenceRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback({
        state: data.state || "offline",
        lastChanged: data.lastChanged || null,
      });
    } else {
      // No presence data means user is offline
      callback({
        state: "offline",
        lastChanged: null,
      });
    }
  });

  // Return cleanup function
  return () => {
    off(presenceRef, "value", unsubscribe);
  };
}


