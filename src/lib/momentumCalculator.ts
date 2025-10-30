"use client";

/**
 * Momentum Score Calculation
 * Formula: Weighted combination of performance metrics
 * - Recent Surge Score (40%)
 * - Win Streak (30%)
 * - Recent Round Performance (20%)
 * - Clutch Plays / Objectives (10%)
 * 
 * Output: 0-100 scale representing current momentum
 */

export type MomentumData = {
  recentSurgeScore?: number;
  winStreak?: number;
  recentRoundWins?: number;
  clutchPlays?: number;
  objectives?: number;
  consecutiveKills?: number;
};

export function calculateMomentum(data: MomentumData): number {
  const {
    recentSurgeScore = 0,
    winStreak = 0,
    recentRoundWins = 0,
    clutchPlays = 0,
    objectives = 0,
    consecutiveKills = 0,
  } = data;

  // Normalize inputs to 0-100 scale
  const surgeFactor = Math.min(recentSurgeScore, 100) * 0.4;
  const streakFactor = Math.min(winStreak * 15, 100) * 0.3;
  const roundFactor = Math.min(recentRoundWins * 20, 100) * 0.2;
  const clutchFactor = Math.min((clutchPlays + objectives + consecutiveKills) * 10, 100) * 0.1;

  const momentum = surgeFactor + streakFactor + roundFactor + clutchFactor;
  return Math.min(Math.max(momentum, 0), 100);
}

export function getMomentumLevel(momentum: number): {
  level: "cold" | "warming" | "hot" | "blazing";
  color: string;
  glow: string;
  icon: string;
} {
  if (momentum >= 80) {
    return {
      level: "blazing",
      color: "from-red-500 to-orange-500",
      glow: "shadow-[0_0_30px_rgba(239,68,68,0.6)]",
      icon: "🔥",
    };
  }
  if (momentum >= 60) {
    return {
      level: "hot",
      color: "from-orange-400 to-yellow-400",
      glow: "shadow-[0_0_20px_rgba(251,146,60,0.5)]",
      icon: "⚡",
    };
  }
  if (momentum >= 30) {
    return {
      level: "warming",
      color: "from-yellow-300 to-green-400",
      glow: "shadow-[0_0_10px_rgba(234,179,8,0.3)]",
      icon: "📈",
    };
  }
  return {
    level: "cold",
    color: "from-blue-400 to-cyan-400",
    glow: "shadow-[0_0_5px_rgba(59,130,246,0.2)]",
    icon: "❄️",
  };
}

export function getMomentumShift(prev: number, current: number): {
  direction: "rising" | "falling" | "stable";
  magnitude: number;
} {
  const diff = current - prev;
  const magnitude = Math.abs(diff);
  
  if (magnitude < 5) {
    return { direction: "stable", magnitude: 0 };
  }
  
  return {
    direction: diff > 0 ? "rising" : "falling",
    magnitude,
  };
}



