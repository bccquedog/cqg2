"use client";

import { useState, useEffect } from "react";
import { onValue, off } from "firebase/database";
import { getPresenceRef, PresenceState } from "@/lib/realtimePresence";

export interface PresenceInfo {
  state: PresenceState;
  lastChanged: number | null;
}

/**
 * React hook that subscribes to a user's presence in real-time
 * @param userId - The user's unique identifier
 * @returns PresenceInfo object with current state and lastChanged timestamp
 */
export function usePresence(userId: string): PresenceInfo {
  const [presence, setPresence] = useState<PresenceInfo>({
    state: "offline",
    lastChanged: null,
  });

  useEffect(() => {
    if (!userId) {
      setPresence({ state: "offline", lastChanged: null });
      return;
    }

    const presenceRef = getPresenceRef(userId);

    // Subscribe to presence changes
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPresence({
          state: data.state || "offline",
          lastChanged: data.lastChanged || null,
        });
      } else {
        // No presence data means user is offline
        setPresence({ state: "offline", lastChanged: null });
      }
    });

    // Cleanup subscription on unmount or userId change
    return () => {
      off(presenceRef, "value", unsubscribe);
    };
  }, [userId]);

  return presence;
}


