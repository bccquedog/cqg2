"use client";

import { useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useToastContext } from "@/contexts/ToastContext";
import { logToastEvent } from "@/lib/toastAnalytics";

type PlayerMVPStats = {
  playerId: string;
  displayName?: string;
  wins?: number;
  avgSurgeScore?: number;
  clipUpvotes?: number;
  mvpScore?: number;
};

type TournamentDoc = {
  id: string;
  status?: string;
  mvpLeaderId?: string;
  players?: Record<string, PlayerMVPStats>;
};

/**
 * useMVPWatcher
 * Watches tournament document for MVP score changes and emits toasts:
 * - When a new player becomes #1 by mvpScore
 * - When tournament completes, for the final MVP
 */
export function useMVPWatcher(tournamentId: string | undefined) {
  const { success, info } = useToastContext();
  const prevLeaderId = useRef<string | null>(null);

  useEffect(() => {
    if (!tournamentId) return;
    const tournamentRef = doc(db, "tournaments", tournamentId);

    const unsub = onSnapshot(tournamentRef, (snap) => {
      if (!snap.exists()) return;
      const data = { id: snap.id, ...snap.data() } as TournamentDoc;
      const players = data.players || {};

      // Compute current leader by mvpScore
      let currentLeaderId: string | null = null;
      let maxScore = -1;
      Object.keys(players).forEach((pid) => {
        const p = players[pid];
        const score = p.mvpScore ?? 0;
        if (score > maxScore) {
          maxScore = score;
          currentLeaderId = pid;
        }
      });

      // If leader changed, toast
      if (currentLeaderId && currentLeaderId !== prevLeaderId.current) {
        const leader = players[currentLeaderId];
        const name = leader?.displayName || "Player";
        info(`🏆 MVP Watch: ${name} takes the top spot!`);
        logToastEvent("mvp_lead_change", tournamentId, currentLeaderId, { mvpScore: maxScore });
        prevLeaderId.current = currentLeaderId;
      }

      // Final MVP on tournament completion
      if (data.status === "completed" && currentLeaderId) {
        const mvp = players[currentLeaderId];
        const name = mvp?.displayName || "Player";
        const wins = mvp?.wins ?? 0;
        const surge = mvp?.avgSurgeScore ?? 0;
        success(`👑 Tournament MVP: ${name} with ${wins} wins and ${surge.toFixed(1)} Surge Score!`, {
          important: true,
        });
        logToastEvent("mvp_final", tournamentId, currentLeaderId, { wins, avgSurgeScore: surge });
      }
    });

    return () => unsub();
  }, [tournamentId, success, info]);
}



