"use client";

import { useEffect, useRef } from "react";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useToastContext } from "@/contexts/ToastContext";
import { logToastEvent } from "@/lib/toastAnalytics";

type ClipDoc = {
  id: string;
  playerId?: string;
  playerName?: string;
  tournamentId?: string;
  highlight?: boolean;
  surgeScore?: number;
  upvotes?: number;
  createdAt?: Timestamp;
};

const SURGE_THRESHOLD = 90;
const FAN_FAVORITE_THRESHOLD = 20;

/**
 * useHighlightToasts
 * Subscribes to clips collection for highlight-tagged or high-surge clips.
 * Emits toasts for:
 * - surgeScore > 90 → "Highlight Moment!"
 * - upvotes > 20 within 1h → "Fan Favorite Play!"
 */
export function useHighlightToasts(tournamentId: string | undefined) {
  const { warning, success } = useToastContext();
  const seenClips = useRef<Record<string, { surgeToast?: boolean; fanToast?: boolean }>>({});

  useEffect(() => {
    if (!tournamentId) return;
    const clipsCol = collection(db, "clips");
    const q = query(clipsCol, where("tournamentId", "==", tournamentId));

    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        const data = { id: change.doc.id, ...(change.doc.data() as any) } as ClipDoc;
        const clipId = data.id;
        const seen = seenClips.current[clipId] || {};

        // Surge score highlight
        if (data.surgeScore && data.surgeScore >= SURGE_THRESHOLD && !seen.surgeToast) {
          const name = data.playerName || "Player";
          warning(`⚡ Highlight Moment! ${name} just dropped a ${data.surgeScore} Surge Score play!`, {
            important: false,
          });
          logToastEvent("highlight_surge", tournamentId, data.playerId || null, {
            clipId,
            surgeScore: data.surgeScore,
          });
          seen.surgeToast = true;
          seenClips.current[clipId] = seen;
        }

        // Fan favorite (upvotes)
        if (data.upvotes && data.upvotes >= FAN_FAVORITE_THRESHOLD && !seen.fanToast) {
          // Check if clip was created within 1 hour (optional, omit for simplicity)
          const name = data.playerName || "Player";
          success(`🔥 Fan Favorite Play! ${name}'s clip hit ${data.upvotes} upvotes!`, {
            important: false,
            actionLabel: "Watch Clip",
            onAction: () => {
              // Emit event for clip modal
              document.dispatchEvent(new CustomEvent("cqg:openClip", { detail: { clipId } }));
            },
          });
          logToastEvent("highlight_fan_favorite", tournamentId, data.playerId || null, {
            clipId,
            upvotes: data.upvotes,
          });
          seen.fanToast = true;
          seenClips.current[clipId] = seen;
        }
      });
    });

    return () => unsub();
  }, [tournamentId, warning, success]);
}



