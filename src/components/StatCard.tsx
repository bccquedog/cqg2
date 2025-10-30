"use client";

import { PlayerGameStats } from "@/lib/vision/analytics/visionAnalytics";

interface StatCardProps {
  playerName: string;
  stats: PlayerGameStats;
  variant?: "compact" | "full";
}

export default function StatCard({ playerName, stats, variant = "compact" }: StatCardProps) {
  const kda = stats.deaths > 0 
    ? ((stats.kills + stats.assists) / stats.deaths).toFixed(2)
    : (stats.kills + stats.assists).toFixed(2);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-amber-500/20 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold text-white">{playerName}</div>
        <div className="text-xs text-gray-400">Live Stats</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* KDA */}
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-400">{kda}</div>
          <div className="text-xs text-gray-400">KDA</div>
          <div className="text-[10px] text-gray-500 mt-1">
            {stats.kills}/{stats.deaths}/{stats.assists}
          </div>
        </div>

        {/* Surge Score */}
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-400">{stats.surgeScore}</div>
          <div className="text-xs text-gray-400">Surge</div>
          <div className={`text-[10px] mt-1 ${
            stats.surgeScore >= 80 ? "text-red-400" : "text-gray-500"
          }`}>
            {stats.surgeScore >= 80 ? "🔥 HOT" : ""}
          </div>
        </div>

        {variant === "full" && (
          <>
            {/* Accuracy */}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.accuracy}%</div>
              <div className="text-xs text-gray-400">Accuracy</div>
            </div>

            {/* Streak */}
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{stats.currentStreak}</div>
              <div className="text-xs text-gray-400">Streak</div>
            </div>

            {/* Clutch */}
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.clutchPlays}</div>
              <div className="text-xs text-gray-400">Clutch</div>
            </div>

            {/* Objectives */}
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.objectives}</div>
              <div className="text-xs text-gray-400">Objectives</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}



