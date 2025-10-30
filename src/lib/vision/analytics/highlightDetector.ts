"use client";

import { MatchStats, HighlightMoment, SurgeEvent } from "./visionAnalytics";

/**
 * Auto-Highlight Detection Rules
 * Analyzes match data to automatically identify clip-worthy moments
 */

export type HighlightRule = {
  name: string;
  condition: (stats: MatchStats) => boolean;
  priority: number;
  description: (stats: MatchStats) => string;
};

const HIGHLIGHT_RULES: HighlightRule[] = [
  // Ace (5+ kills in rapid succession)
  {
    name: "ace",
    condition: (stats) => {
      return stats.playerAStats.currentStreak >= 5 || stats.playerBStats.currentStreak >= 5;
    },
    priority: 10,
    description: (stats) => {
      const streak = Math.max(stats.playerAStats.currentStreak, stats.playerBStats.currentStreak);
      return `ACE! ${streak}-kill streak`;
    },
  },

  // Clutch (1v2+ situation win)
  {
    name: "clutch",
    condition: (stats) => {
      return stats.playerAStats.clutchPlays > 0 || stats.playerBStats.clutchPlays > 0;
    },
    priority: 9,
    description: () => "Clutch play executed",
  },

  // Perfect round (no deaths + high surge)
  {
    name: "perfect_round",
    condition: (stats) => {
      return (
        (stats.playerAStats.deaths === 0 && stats.playerAStats.surgeScore >= 80) ||
        (stats.playerBStats.deaths === 0 && stats.playerBStats.surgeScore >= 80)
      );
    },
    priority: 8,
    description: () => "Perfect round performance",
  },

  // Comeback (flip from behind)
  {
    name: "comeback",
    condition: (stats) => {
      return stats.scoreDiff >= 10; // Large score swing
    },
    priority: 7,
    description: (stats) => `Comeback from ${stats.scoreDiff} point deficit`,
  },

  // High accuracy sniper shot
  {
    name: "precision_shot",
    condition: (stats) => {
      return stats.playerAStats.accuracy >= 90 || stats.playerBStats.accuracy >= 90;
    },
    priority: 7,
    description: (stats) => {
      const acc = Math.max(stats.playerAStats.accuracy, stats.playerBStats.accuracy);
      return `${acc}% precision shot`;
    },
  },

  // Multi-objective secure
  {
    name: "objective_control",
    condition: (stats) => {
      return stats.playerAStats.objectives >= 3 || stats.playerBStats.objectives >= 3;
    },
    priority: 6,
    description: (stats) => {
      const objs = Math.max(stats.playerAStats.objectives, stats.playerBStats.objectives);
      return `${objs} objectives secured`;
    },
  },
];

/**
 * Analyze match stats and detect highlights
 */
export function detectHighlights(
  stats: MatchStats,
  previousStats?: MatchStats
): HighlightMoment[] {
  const highlights: HighlightMoment[] = [];

  HIGHLIGHT_RULES.forEach((rule) => {
    if (rule.condition(stats)) {
      // Determine which player triggered the highlight
      const playerId = stats.playerAStats.surgeScore >= stats.playerBStats.surgeScore
        ? stats.playerAId
        : stats.playerBId;

      highlights.push({
        timestamp: Date.now(),
        playerId,
        type: rule.name === "ace" ? "play_of_the_game" : "clutch_moment",
        priority: rule.priority,
        description: rule.description(stats),
      });
    }
  });

  // Surge spike detection (compare to previous)
  if (previousStats) {
    const surgeA = stats.playerAStats.surgeScore - previousStats.playerAStats.surgeScore;
    const surgeB = stats.playerBStats.surgeScore - previousStats.playerBStats.surgeScore;

    if (surgeA >= 20) {
      highlights.push({
        timestamp: Date.now(),
        playerId: stats.playerAId,
        type: "play_of_the_game",
        priority: 8,
        description: `Surge spike: +${surgeA.toFixed(0)} points`,
      });
    }

    if (surgeB >= 20) {
      highlights.push({
        timestamp: Date.now(),
        playerId: stats.playerBId,
        type: "play_of_the_game",
        priority: 8,
        description: `Surge spike: +${surgeB.toFixed(0)} points`,
      });
    }
  }

  return highlights;
}

/**
 * Calculate highlight clip start/end timestamps
 */
export function calculateClipTimestamp(
  highlight: HighlightMoment,
  matchDuration: number
): { start: number; end: number } {
  const eventTime = highlight.timestamp;
  
  // Clip should start 5s before and end 3s after
  const start = Math.max(0, eventTime - 5000);
  const end = Math.min(matchDuration * 1000, eventTime + 3000);

  return { start, end };
}

/**
 * Priority-based highlight sorting
 */
export function sortHighlightsByPriority(highlights: HighlightMoment[]): HighlightMoment[] {
  return [...highlights].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.timestamp - a.timestamp;
  });
}

/**
 * Get top N highlights
 */
export function getTopHighlights(highlights: HighlightMoment[], count: number = 5): HighlightMoment[] {
  return sortHighlightsByPriority(highlights).slice(0, count);
}



