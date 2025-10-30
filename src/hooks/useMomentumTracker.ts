"use client";

import { useEffect, useRef } from "react";
import { collection, onSnapshot, query, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { calculateMomentum, MomentumData } from "@/lib/momentumCalculator";
import { useToastContext } from "@/contexts/ToastContext";

type MatchDoc = {
  id: string;
  status?: string;
  winnerId?: string;
  loserId?: string;
  playerAId?: string;
  playerBId?: string;
  playerAName?: string;
  playerBName?: string;
  surgeScores?: {
    [playerId: string]: number;
  };
  clutchPlays?: {
    [playerId: string]: number;
  };
};

/**
 * useMomentumTracker
 * Tracks match events and updates player momentum in tournament roster.
 * Emits toasts when momentum shifts dramatically.
 */
export function useMomentumTracker(tournamentId: string | undefined) {
  const { warning, info } = useToastContext();
  const playerMomentum = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!tournamentId) return;
    const matchesCol = collection(db, "tournaments", tournamentId, "matches");
    const q = query(matchesCol);

    const unsub = onSnapshot(q, async (snap) => {
      // Aggregate momentum data per player from all matches
      const playerStats: Record<string, MomentumData & { name?: string }> = {};

      snap.forEach((matchDoc) => {
        const data = matchDoc.data() as MatchDoc;
        
        // Track surge scores
        if (data.surgeScores) {
          Object.entries(data.surgeScores).forEach(([pid, score]) => {
            if (!playerStats[pid]) playerStats[pid] = {};
            playerStats[pid].recentSurgeScore = score;
          });
        }

        // Track clutch plays
        if (data.clutchPlays) {
          Object.entries(data.clutchPlays).forEach(([pid, plays]) => {
            if (!playerStats[pid]) playerStats[pid] = {};
            playerStats[pid].clutchPlays = plays;
          });
        }

        // Track wins and streaks (simplified - real implementation would aggregate)
        if (data.status === "completed" && data.winnerId) {
          if (!playerStats[data.winnerId]) playerStats[data.winnerId] = {};
          playerStats[data.winnerId].recentRoundWins = (playerStats[data.winnerId].recentRoundWins || 0) + 1;
        }

        // Store player names
        if (data.playerAId) {
          if (!playerStats[data.playerAId]) playerStats[data.playerAId] = {};
          playerStats[data.playerAId].name = data.playerAName;
        }
        if (data.playerBId) {
          if (!playerStats[data.playerBId]) playerStats[data.playerBId] = {};
          playerStats[data.playerBId].name = data.playerBName;
        }
      });

      // Calculate and update momentum for each player
      for (const [playerId, stats] of Object.entries(playerStats)) {
        const newMomentum = calculateMomentum(stats);
        const prevMomentum = playerMomentum.current[playerId] || 0;
        
        // Update roster with momentum
        try {
          const rosterRef = doc(db, "tournaments", tournamentId, "roster", playerId);
          await updateDoc(rosterRef, {
            momentum: newMomentum,
            recentSurgeScore: stats.recentSurgeScore || 0,
          });
        } catch (error) {
          console.error("Failed to update momentum for player:", playerId, error);
        }

        // Emit toast on significant momentum shifts
        const diff = newMomentum - prevMomentum;
        if (Math.abs(diff) >= 20) {
          const name = stats.name || "Player";
          if (diff > 0) {
            warning(`🚀 ${name} is surging! Momentum up ${diff.toFixed(0)}%`);
          } else {
            info(`📉 ${name}'s momentum cooling... Down ${Math.abs(diff).toFixed(0)}%`);
          }
        }

        playerMomentum.current[playerId] = newMomentum;
      }
    });

    return () => unsub();
  }, [tournamentId, warning, info]);
}



