"use client";

import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export type MatchStats = {
  matchId: string;
  playerAId: string;
  playerBId: string;
  playerAStats: PlayerGameStats;
  playerBStats: PlayerGameStats;
  scoreDiff: number;
  duration: number; // seconds
  surgeEvents: SurgeEvent[];
  highlightMoments: HighlightMoment[];
};

export type PlayerGameStats = {
  kills: number;
  deaths: number;
  assists: number;
  accuracy: number; // percentage
  surgeScore: number;
  currentStreak: number;
  clutchPlays: number;
  objectives: number;
};

export type SurgeEvent = {
  timestamp: number;
  playerId: string;
  type: "kill_streak" | "clutch" | "objective" | "ace";
  surgeIncrease: number;
  description: string;
};

export type HighlightMoment = {
  timestamp: number;
  playerId: string;
  type: "play_of_the_game" | "clutch_moment" | "comeback" | "upset";
  priority: number; // 1-10
  clipId?: string;
  description: string;
};

export type AnalyticsSnapshot = {
  currentMatches: MatchStats[];
  topPerformers: { playerId: string; surgeScore: number; kills: number }[];
  recentHighlights: HighlightMoment[];
  tournamentAverages: {
    avgSurgeScore: number;
    avgKills: number;
    avgAccuracy: number;
  };
};

/**
 * CQG Vision Analytics Engine
 * Real-time gameplay analytics, highlight detection, and stat aggregation
 */
export class VisionAnalytics {
  private tournamentId: string;
  private listeners: Array<() => void> = [];
  private matchStats: Map<string, MatchStats> = new Map();
  private highlightQueue: HighlightMoment[] = [];

  constructor(tournamentId: string) {
    this.tournamentId = tournamentId;
  }

  /**
   * Start analytics monitoring
   */
  start(onUpdate: (snapshot: AnalyticsSnapshot) => void) {
    console.log("[Vision Analytics] Starting for tournament:", this.tournamentId);

    // Monitor live matches
    const matchesCol = collection(db, "tournaments", this.tournamentId, "matches");
    const liveQuery = query(matchesCol, where("status", "==", "live"));

    const matchUnsub = onSnapshot(liveQuery, (snap) => {
      snap.docChanges().forEach((change) => {
        const matchId = change.doc.id;
        const data = change.doc.data();

        if (change.type === "added" || change.type === "modified") {
          const stats: MatchStats = {
            matchId,
            playerAId: data.playerAId || "",
            playerBId: data.playerBId || "",
            playerAStats: this.extractPlayerStats(data.playerAStats || {}),
            playerBStats: this.extractPlayerStats(data.playerBStats || {}),
            scoreDiff: Math.abs((data.scoreA || 0) - (data.scoreB || 0)),
            duration: data.duration || 0,
            surgeEvents: data.surgeEvents || [],
            highlightMoments: data.highlightMoments || [],
          };

          this.matchStats.set(matchId, stats);

          // Detect auto-highlights
          this.detectHighlights(stats);
        }

        if (change.type === "removed") {
          this.matchStats.delete(matchId);
        }
      });

      // Generate snapshot
      const snapshot = this.generateSnapshot();
      onUpdate(snapshot);
    });

    this.listeners.push(matchUnsub);
  }

  /**
   * Extract player stats from raw data
   */
  private extractPlayerStats(raw: any): PlayerGameStats {
    return {
      kills: raw.kills || 0,
      deaths: raw.deaths || 0,
      assists: raw.assists || 0,
      accuracy: raw.accuracy || 0,
      surgeScore: raw.surgeScore || 0,
      currentStreak: raw.currentStreak || 0,
      clutchPlays: raw.clutchPlays || 0,
      objectives: raw.objectives || 0,
    };
  }

  /**
   * Detect highlight-worthy moments
   */
  private detectHighlights(stats: MatchStats) {
    const highlights: HighlightMoment[] = [];

    // Clutch detection (1vX win or low health comeback)
    [stats.playerAStats, stats.playerBStats].forEach((pStats, idx) => {
      const playerId = idx === 0 ? stats.playerAId : stats.playerBId;

      if (pStats.clutchPlays > 0) {
        highlights.push({
          timestamp: Date.now(),
          playerId,
          type: "clutch_moment",
          priority: 8,
          description: `Clutch play executed`,
        });
      }

      // Kill streak milestone
      if (pStats.currentStreak >= 5) {
        highlights.push({
          timestamp: Date.now(),
          playerId,
          type: "play_of_the_game",
          priority: 9,
          description: `${pStats.currentStreak}-kill streak`,
        });
      }

      // High surge score
      if (pStats.surgeScore >= 90) {
        highlights.push({
          timestamp: Date.now(),
          playerId,
          type: "play_of_the_game",
          priority: 9,
          description: `Surge Score: ${pStats.surgeScore}`,
        });
      }
    });

    // Comeback detection (large score swing)
    if (stats.scoreDiff >= 10) {
      const prevStats = this.matchStats.get(stats.matchId);
      if (prevStats && prevStats.scoreDiff < 5) {
        highlights.push({
          timestamp: Date.now(),
          playerId: stats.playerAId, // Could determine which player made comeback
          type: "comeback",
          priority: 8,
          description: `Comeback from ${prevStats.scoreDiff} point deficit`,
        });
      }
    }

    // Add to queue
    this.highlightQueue.push(...highlights);

    // Keep only last 20 highlights
    if (this.highlightQueue.length > 20) {
      this.highlightQueue = this.highlightQueue.slice(-20);
    }
  }

  /**
   * Generate analytics snapshot
   */
  private generateSnapshot(): AnalyticsSnapshot {
    const currentMatches = Array.from(this.matchStats.values());

    // Aggregate top performers
    const playerPerformance: Map<string, { surgeScore: number; kills: number }> = new Map();
    
    currentMatches.forEach((match) => {
      [
        { id: match.playerAId, stats: match.playerAStats },
        { id: match.playerBId, stats: match.playerBStats },
      ].forEach(({ id, stats }) => {
        const existing = playerPerformance.get(id) || { surgeScore: 0, kills: 0 };
        playerPerformance.set(id, {
          surgeScore: Math.max(existing.surgeScore, stats.surgeScore),
          kills: existing.kills + stats.kills,
        });
      });
    });

    const topPerformers = Array.from(playerPerformance.entries())
      .map(([playerId, perf]) => ({ playerId, ...perf }))
      .sort((a, b) => b.surgeScore - a.surgeScore)
      .slice(0, 5);

    // Calculate tournament averages
    let totalSurge = 0;
    let totalKills = 0;
    let totalAccuracy = 0;
    let count = 0;

    currentMatches.forEach((match) => {
      [match.playerAStats, match.playerBStats].forEach((stats) => {
        totalSurge += stats.surgeScore;
        totalKills += stats.kills;
        totalAccuracy += stats.accuracy;
        count++;
      });
    });

    return {
      currentMatches,
      topPerformers,
      recentHighlights: this.highlightQueue.slice(-10),
      tournamentAverages: {
        avgSurgeScore: count > 0 ? totalSurge / count : 0,
        avgKills: count > 0 ? totalKills / count : 0,
        avgAccuracy: count > 0 ? totalAccuracy / count : 0,
      },
    };
  }

  /**
   * Get highlight queue
   */
  getHighlights(): HighlightMoment[] {
    return [...this.highlightQueue];
  }

  /**
   * Clear highlights
   */
  clearHighlights() {
    this.highlightQueue = [];
  }

  /**
   * Stop analytics
   */
  stop() {
    console.log("[Vision Analytics] Stopping");
    this.listeners.forEach((unsub) => unsub());
    this.listeners = [];
    this.matchStats.clear();
  }
}



