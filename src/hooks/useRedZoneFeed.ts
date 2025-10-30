"use client";

import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { MomentumData } from "@/lib/momentumCalculator";

export type RedZoneMatch = {
  matchId: string;
  playerAId: string;
  playerAName: string;
  playerASeed?: number;
  playerAMomentum: MomentumData;
  playerBId: string;
  playerBName: string;
  playerBSeed?: number;
  playerBMomentum: MomentumData;
  roundNumber: number;
  status: string;
  avgMomentum: number;
  surgeScore?: number;
};

export type RedZoneFeedData = {
  activeMatches: RedZoneMatch[];
  totalActive: number;
  totalCompleted: number;
  nextUpMatches: RedZoneMatch[];
  topPlays: { playerId: string; playerName: string; surgeScore: number }[];
  mvpLeader: { playerId: string; playerName: string; mvpScore: number } | null;
};

/**
 * useRedZoneFeed
 * Aggregates real-time tournament data for RedZone overlay:
 * - Active matches with momentum data
 * - Next up matches
 * - Top plays/highlights
 * - MVP leader
 * 
 * Throttled to 2 Hz for performance
 */
export function useRedZoneFeed(tournamentId: string | undefined): RedZoneFeedData {
  const [feedData, setFeedData] = useState<RedZoneFeedData>({
    activeMatches: [],
    totalActive: 0,
    totalCompleted: 0,
    nextUpMatches: [],
    topPlays: [],
    mvpLeader: null,
  });

  const throttleTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdate = useRef<RedZoneFeedData | null>(null);

  useEffect(() => {
    if (!tournamentId) return;

    const matchesCol = collection(db, "tournaments", tournamentId, "matches");
    const activeQuery = query(matchesCol, where("status", "==", "live"));

    const unsub = onSnapshot(activeQuery, (snap) => {
      const activeMatches: RedZoneMatch[] = [];
      
      snap.forEach((doc) => {
        const data = doc.data();
        const playerAMomentum = {
          recentSurgeScore: data.playerAMomentum?.recentSurgeScore || 0,
          winStreak: data.playerAMomentum?.winStreak || 0,
          recentRoundWins: data.playerAMomentum?.recentRoundWins || 0,
          clutchPlays: data.playerAMomentum?.clutchPlays || 0,
        };
        
        const playerBMomentum = {
          recentSurgeScore: data.playerBMomentum?.recentSurgeScore || 0,
          winStreak: data.playerBMomentum?.winStreak || 0,
          recentRoundWins: data.playerBMomentum?.recentRoundWins || 0,
          clutchPlays: data.playerBMomentum?.clutchPlays || 0,
        };

        const avgMomentum = ((data.playerAMomentum?.recentSurgeScore || 0) + (data.playerBMomentum?.recentSurgeScore || 0)) / 2;

        activeMatches.push({
          matchId: doc.id,
          playerAId: data.playerAId || "",
          playerAName: data.playerAName || "Player A",
          playerASeed: data.playerASeed,
          playerAMomentum,
          playerBId: data.playerBId || "",
          playerBName: data.playerBName || "Player B",
          playerBSeed: data.playerBSeed,
          playerBMomentum,
          roundNumber: data.roundNumber || 1,
          status: data.status || "pending",
          avgMomentum,
          surgeScore: avgMomentum,
        });
      });

      // Sort by average momentum (most exciting first)
      activeMatches.sort((a, b) => b.avgMomentum - a.avgMomentum);

      const newData: RedZoneFeedData = {
        activeMatches: activeMatches.slice(0, 4), // Show top 4 most exciting
        totalActive: activeMatches.length,
        totalCompleted: 0, // TODO: query completed matches
        nextUpMatches: [], // TODO: query pending matches
        topPlays: [], // TODO: query recent clips
        mvpLeader: null, // TODO: query tournament MVP
      };

      // Throttle updates to 2 Hz (500ms)
      pendingUpdate.current = newData;
      if (!throttleTimer.current) {
        throttleTimer.current = setInterval(() => {
          if (pendingUpdate.current) {
            setFeedData(pendingUpdate.current);
            pendingUpdate.current = null;
          }
        }, 500);
      }
    });

    return () => {
      unsub();
      if (throttleTimer.current) {
        clearInterval(throttleTimer.current);
      }
    };
  }, [tournamentId]);

  return feedData;
}



