"use client";

import { useEffect, useRef } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useToastContext } from "@/contexts/ToastContext";

type MatchDoc = {
  id: string;
  playerAName?: string;
  playerBName?: string;
  playerAId?: string;
  playerBId?: string;
  roundNumber?: number;
  nextRound?: number;
  winnerId?: string;
  winnerName?: string;
  loserName?: string;
  status?: "pending" | "live" | "completed" | string;
};

/**
 * useLiveMatchToasts
 * Subscribes to tournaments/{tournamentId}/matches and raises toasts for key status transitions.
 * - pending -> live: "Match Starting Now"
 * - live -> completed or winnerId set: "Match Complete"
 * Avoids duplicates via an in-memory cache of last seen status + winner snapshot.
 */
export function useLiveMatchToasts(tournamentId: string | undefined, currentUserId?: string) {
  const { success, info } = useToastContext();
  const lastSeen = useRef<Record<string, { status?: string; winnerId?: string }>>({});

  useEffect(() => {
    if (!tournamentId) return;
    const matchesCol = collection(db, "tournaments", tournamentId, "matches");
    const q = query(matchesCol);

    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        const id = change.doc.id;
        const data = { id, ...(change.doc.data() as any) } as MatchDoc;
        const prev = lastSeen.current[id] || {};

        // Determine transitions
        const prevStatus = prev.status;
        const status = data.status;
        const prevWinner = prev.winnerId;
        const winnerId = data.winnerId;

        // Cache current state early to avoid multiple triggers on same snapshot
        lastSeen.current[id] = { status, winnerId };

        // pending -> live
        if (prevStatus && prevStatus !== "live" && status === "live") {
          const a = data.playerAName || "Player A";
          const b = data.playerBName || "Player B";
          const round = data.roundNumber ?? "?";

          const isMine = currentUserId && (data.playerAId === currentUserId || data.playerBId === currentUserId);
          info("🔥 Match Starting Now!", {
            important: false,
            actionLabel: "View Bracket",
            onAction: () => {
              // hook for bracket modal open - can be replaced
              document.dispatchEvent(new CustomEvent("cqg:openBracket", { detail: { tournamentId } }));
            },
          });
          // Secondary line as separate toast for readability
          info(`${a} vs ${b} — Round ${round} has begun!`, { important: isMine });
        }

        // live -> completed OR winner set
        const becameCompleted = prevStatus && prevStatus === "live" && status === "completed";
        const winnerJustSet = !prevWinner && !!winnerId;
        if (becameCompleted || winnerJustSet) {
          const winner = data.winnerName || "Winner";
          // Derive loser: pick the other player name
          let loser = data.loserName;
          if (!loser) {
            const a = data.playerAName || "Player A";
            const b = data.playerBName || "Player B";
            if (winner === a) loser = b; else if (winner === b) loser = a; else loser = "Opponent";
          }
          const next = data.nextRound ?? (data.roundNumber ? (data.roundNumber + 1) : undefined);

          success("✅ Match Complete!", {
            important: false,
            actionLabel: "View Bracket",
            onAction: () => document.dispatchEvent(new CustomEvent("cqg:openBracket", { detail: { tournamentId } })),
          });
          success(`${winner} wins over ${loser}.${next ? ` Advancing to Round ${next}.` : ""}`);
        }
      });
    });

    return () => unsub();
  }, [tournamentId, currentUserId, success, info]);
}




