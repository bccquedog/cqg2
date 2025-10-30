import { 
  ref, 
  set, 
  serverTimestamp, 
  onDisconnect,
  DatabaseReference 
} from "firebase/database";
import { rtdb } from "./firebaseClient";

export type PresenceState = "online" | "idle" | "in_match" | "offline";

export interface PresenceData {
  state: PresenceState;
  lastChanged: number | null | object; // ServerValue.TIMESTAMP type
}

/**
 * Sets a user's presence state in Firebase Realtime Database
 * Automatically sets up onDisconnect to mark user as offline
 * @param userId - The user's unique identifier
 * @param state - The presence state to set
 * @returns Promise<void>
 */
export async function setPresence(userId: string, state: PresenceState): Promise<void> {
  try {
    const presenceRef: DatabaseReference = ref(rtdb, `presence/${userId}`);
    
    const presenceData: PresenceData = {
      state,
      lastChanged: serverTimestamp(),
    };

    // Set up automatic offline status on disconnect
    await onDisconnect(presenceRef).set({
      state: "offline",
      lastChanged: serverTimestamp(),
    });

    // Set the current presence state
    await set(presenceRef, presenceData);
  } catch (error) {
    console.error("Error setting presence:", error);
    throw new Error("Failed to set presence");
  }
}

/**
 * Gets a reference to a user's presence in the database
 * @param userId - The user's unique identifier
 * @returns DatabaseReference
 */
export function getPresenceRef(userId: string): DatabaseReference {
  return ref(rtdb, `presence/${userId}`);
}

/**
 * Manually sets a user offline (useful for explicit logouts)
 * @param userId - The user's unique identifier
 * @returns Promise<void>
 */
export async function setOffline(userId: string): Promise<void> {
  try {
    const presenceRef = ref(rtdb, `presence/${userId}`);
    
    // Cancel any pending onDisconnect operations
    await onDisconnect(presenceRef).cancel();
    
    // Set offline state
    await set(presenceRef, {
      state: "offline",
      lastChanged: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error setting offline:", error);
    throw new Error("Failed to set offline");
  }
}
