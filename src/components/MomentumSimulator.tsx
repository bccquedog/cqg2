"use client";

import { useState, useEffect } from "react";
import LiveMomentumBar from "./LiveMomentumBar";
import { MomentumData } from "@/lib/momentumCalculator";

export default function MomentumSimulator() {
  const [playerA, setPlayerA] = useState<MomentumData>({
    recentSurgeScore: 50,
    winStreak: 0,
    recentRoundWins: 0,
    clutchPlays: 0,
  });
  
  const [playerB, setPlayerB] = useState<MomentumData>({
    recentSurgeScore: 50,
    winStreak: 0,
    recentRoundWins: 0,
    clutchPlays: 0,
  });
  
  const [isSimulating, setIsSimulating] = useState(false);

  // Auto-simulation mode
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      // Randomize Player A
      setPlayerA((prev) => ({
        recentSurgeScore: Math.min(Math.max(prev.recentSurgeScore! + (Math.random() * 20 - 10), 0), 100),
        winStreak: Math.max((prev.winStreak || 0) + (Math.random() > 0.5 ? 1 : -1), 0),
        recentRoundWins: Math.max((prev.recentRoundWins || 0) + (Math.random() > 0.7 ? 1 : 0), 0),
        clutchPlays: Math.max((prev.clutchPlays || 0) + (Math.random() > 0.8 ? 1 : 0), 0),
      }));

      // Randomize Player B
      setPlayerB((prev) => ({
        recentSurgeScore: Math.min(Math.max(prev.recentSurgeScore! + (Math.random() * 20 - 10), 0), 100),
        winStreak: Math.max((prev.winStreak || 0) + (Math.random() > 0.5 ? 1 : -1), 0),
        recentRoundWins: Math.max((prev.recentRoundWins || 0) + (Math.random() > 0.7 ? 1 : 0), 0),
        clutchPlays: Math.max((prev.clutchPlays || 0) + (Math.random() > 0.8 ? 1 : 0), 0),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">⚡ Momentum Simulator</h2>
        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isSimulating
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {isSimulating ? "Stop" : "Start"} Simulation
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Player A</h3>
          <LiveMomentumBar
            playerId="playerA"
            playerName="ProGamer"
            momentumData={playerA}
            showStats={true}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Player B</h3>
          <LiveMomentumBar
            playerId="playerB"
            playerName="ElitePlayer"
            momentumData={playerB}
            showStats={true}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Simulation Info</h3>
        <p className="text-sm text-blue-700">
          Random updates every 3 seconds. Surge scores fluctuate ±10, streaks and stats increment randomly.
          Hover over bars to see detailed metrics tooltip.
        </p>
      </div>
    </div>
  );
}



