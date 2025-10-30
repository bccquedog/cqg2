"use client";

import { useEffect, useRef } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useToastContext } from "@/contexts/ToastContext";

type PlayerStats = {
  winStreak?: number;
  totalWins?: number;
  totalMatches?: number;
  seedRank?: number;
  displayName?: string;
};

type MatchDoc = {
  id: string;
  status?: string;
  winnerId?: string;
  loserId?: string;
  roundNumber?: number;
  players?: Record<string, PlayerStats>; // keyed by playerId
};

const STREAK_MILESTONES = [3, 5];
const TOTAL_WIN_MILESTONES = [10];
const TOTAL_MATCH_MILESTONES = [20];

export function useMatchMilestoneToasts(tournamentId: string | undefined) {
  const { success, warning, info } = useToastContext();
  const lastToastIds = useRef<Record<string, true>>({});

  useEffect(() => {
    if (!tournamentId) return;
    const matchesCol = collection(db, "tournaments", tournamentId, "matches");
    const q = query(matchesCol);

    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        const data = { id: change.doc.id, ...(change.doc.data() as any) } as MatchDoc;
        // Only react to completed matches (or when winnerId exists)
        if (data.status !== "completed" && !data.winnerId) return;

        const players = data.players || {};
        const winnerStats = data.winnerId ? players[data.winnerId] : undefined;
        const loserStats = data.loserId ? players[data.loserId] : undefined;

        // Streak milestones
        if (winnerStats?.winStreak) {
          if (STREAK_MILESTONES.includes(winnerStats.winStreak)) {
            const key = `streak:${data.id}:${data.winnerId}:${winnerStats.winStreak}`;
            if (!lastToastIds.current[key]) {
              if (winnerStats.winStreak === 3) {
                warning(`🔥 ${winnerStats.displayName || "Player"} is heating up!`);
              } else if (winnerStats.winStreak === 5) {
                warning(`⚡ ${winnerStats.displayName || "Player"} is unstoppable!`);
              }
              lastToastIds.current[key] = true;
              console.log("[toast] streak milestone", key);
            }
          }
        }

        // Total wins milestone
        if (winnerStats?.totalWins && TOTAL_WIN_MILESTONES.includes(winnerStats.totalWins)) {
          const key = `wins:${data.id}:${data.winnerId}:${winnerStats.totalWins}`;
          if (!lastToastIds.current[key]) {
            success(`🏆 ${winnerStats.displayName || "Player"} joins the elite tier!`);
            lastToastIds.current[key] = true;
            console.log("[toast] total wins milestone", key);
          }
        }

        // Total matches milestone (either player)
        [data.winnerId, data.loserId].forEach((pid) => {
          if (!pid) return;
          const ps = players[pid];
          if (ps?.totalMatches && TOTAL_MATCH_MILESTONES.includes(ps.totalMatches)) {
            const key = `matches:${data.id}:${pid}:${ps.totalMatches}`;
            if (!lastToastIds.current[key]) {
              info(`🎮 ${ps.displayName || "Player"} – veteran status unlocked!`);
              lastToastIds.current[key] = true;
              console.log("[toast] total matches milestone", key);
            }
          }
        });

        // Upset detection
        if (winnerStats && loserStats && winnerStats.seedRank != null && loserStats.seedRank != null) {
          const winnerSeed = winnerStats.seedRank;
          const loserSeed = loserStats.seedRank;
          // Higher number is lower seed; upset if winnerSeed > loserSeed + 2
          if (winnerSeed > loserSeed + 2) {
            const key = `upset:${data.id}:${data.winnerId}`;
            if (!lastToastIds.current[key]) {
              warning(`😱 Upset Alert! ${winnerStats.displayName || "Player"} defeats #${loserSeed}!`);
              lastToastIds.current[key] = true;
              console.log("[toast] upset milestone", key);
            }
          }
        }
      });
    });

    return () => unsub();
  }, [tournamentId, success, warning, info]);
}




