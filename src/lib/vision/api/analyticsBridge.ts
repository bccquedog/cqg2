"use client";

import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { MatchStats, PlayerGameStats, HighlightMoment } from "../analytics/visionAnalytics";

/**
 * Analytics API Bridge
 * Consolidates analytics data streams from Firestore and local models
 */

export class AnalyticsBridge {
  private tournamentId: string;

  constructor(tournamentId: string) {
    this.tournamentId = tournamentId;
  }

  /**
   * Get live momentum for a specific match
   */
  async getLiveMomentum(matchId: string): Promise<{ playerA: number; playerB: number }> {
    try {
      const matchRef = doc(db, "tournaments", this.tournamentId, "matches", matchId);
      const matchSnap = await getDoc(matchRef);

      if (!matchSnap.exists()) {
        return { playerA: 0, playerB: 0 };
      }

      const data = matchSnap.data();
      return {
        playerA: data.playerAMomentum?.recentSurgeScore || 0,
        playerB: data.playerBMomentum?.recentSurgeScore || 0,
      };
    } catch (error) {
      console.error("[Analytics Bridge] Failed to get momentum:", error);
      return { playerA: 0, playerB: 0 };
    }
  }

  /**
   * Get top players by performance
   */
  async getTopPlayers(limitCount: number = 5): Promise<Array<{ playerId: string; stats: PlayerGameStats }>> {
    try {
      const rosterCol = collection(db, "tournaments", this.tournamentId, "roster");
      const q = query(
        rosterCol,
        orderBy("momentum", "desc"),
        limit(limitCount)
      );

      const snap = await getDocs(q);
      const topPlayers: Array<{ playerId: string; stats: PlayerGameStats }> = [];

      snap.forEach((doc) => {
        const data = doc.data();
        topPlayers.push({
          playerId: doc.id,
          stats: {
            kills: data.kills || 0,
            deaths: data.deaths || 0,
            assists: data.assists || 0,
            accuracy: data.accuracy || 0,
            surgeScore: data.recentSurgeScore || 0,
            currentStreak: data.winStreak || 0,
            clutchPlays: data.clutchPlays || 0,
            objectives: data.objectives || 0,
          },
        });
      });

      return topPlayers;
    } catch (error) {
      console.error("[Analytics Bridge] Failed to get top players:", error);
      return [];
    }
  }

  /**
   * Get team/player comparison data
   */
  async getTeamComparison(matchId: string): Promise<{
    playerA: PlayerGameStats;
    playerB: PlayerGameStats;
  }> {
    try {
      const matchRef = doc(db, "tournaments", this.tournamentId, "matches", matchId);
      const matchSnap = await getDoc(matchRef);

      if (!matchSnap.exists()) {
        throw new Error("Match not found");
      }

      const data = matchSnap.data();
      return {
        playerA: data.playerAStats || {},
        playerB: data.playerBStats || {},
      };
    } catch (error) {
      console.error("[Analytics Bridge] Failed to get team comparison:", error);
      return {
        playerA: {
          kills: 0,
          deaths: 0,
          assists: 0,
          accuracy: 0,
          surgeScore: 0,
          currentStreak: 0,
          clutchPlays: 0,
          objectives: 0,
        },
        playerB: {
          kills: 0,
          deaths: 0,
          assists: 0,
          accuracy: 0,
          surgeScore: 0,
          currentStreak: 0,
          clutchPlays: 0,
          objectives: 0,
        },
      };
    }
  }

  /**
   * Get recent highlights
   */
  async getRecentHighlights(matchId?: string, limitCount: number = 10): Promise<HighlightMoment[]> {
    try {
      // For now, return empty array
      // In production, query clips collection filtered by matchId
      return [];
    } catch (error) {
      console.error("[Analytics Bridge] Failed to get highlights:", error);
      return [];
    }
  }

  /**
   * Get match statistics
   */
  async getMatchStats(matchId: string): Promise<MatchStats | null> {
    try {
      const matchRef = doc(db, "tournaments", this.tournamentId, "matches", matchId);
      const matchSnap = await getDoc(matchRef);

      if (!matchSnap.exists()) {
        return null;
      }

      const data = matchSnap.data();
      return {
        matchId,
        playerAId: data.playerAId || "",
        playerBId: data.playerBId || "",
        playerAStats: data.playerAStats || {},
        playerBStats: data.playerBStats || {},
        scoreDiff: Math.abs((data.scoreA || 0) - (data.scoreB || 0)),
        duration: data.duration || 0,
        surgeEvents: data.surgeEvents || [],
        highlightMoments: data.highlightMoments || [],
      };
    } catch (error) {
      console.error("[Analytics Bridge] Failed to get match stats:", error);
      return null;
    }
  }
}

/**
 * Singleton instance
 */
let analyticsBridgeInstance: AnalyticsBridge | null = null;

export function getAnalyticsBridge(tournamentId: string): AnalyticsBridge {
  if (!analyticsBridgeInstance || analyticsBridgeInstance["tournamentId"] !== tournamentId) {
    analyticsBridgeInstance = new AnalyticsBridge(tournamentId);
  }
  return analyticsBridgeInstance;
}



