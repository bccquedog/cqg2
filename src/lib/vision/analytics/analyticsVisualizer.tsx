"use client";

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

type MomentumDataPoint = {
  time: string;
  playerA: number;
  playerB: number;
};

type TeamComparisonData = {
  stat: string;
  teamA: number;
  teamB: number;
};

interface AnalyticsVisualizerProps {
  momentumHistory: MomentumDataPoint[];
  teamComparison: TeamComparisonData[];
  currentMomentum: { playerA: number; playerB: number };
  gameTheme?: "cod" | "madden" | "valorant" | "default";
}

const GAME_THEMES = {
  cod: { primary: "#FFD700", secondary: "#DC143C", bg: "from-yellow-900/20 to-red-900/20" },
  madden: { primary: "#1E90FF", secondary: "#C0C0C0", bg: "from-blue-900/20 to-gray-900/20" },
  valorant: { primary: "#FF4655", secondary: "#00C7B7", bg: "from-red-900/20 to-cyan-900/20" },
  default: { primary: "#FFA500", secondary: "#4169E1", bg: "from-amber-900/20 to-blue-900/20" },
};

export default function AnalyticsVisualizer({
  momentumHistory,
  teamComparison,
  currentMomentum,
  gameTheme = "default",
}: AnalyticsVisualizerProps) {
  const theme = GAME_THEMES[gameTheme];

  return (
    <div className={`bg-gradient-to-br ${theme.bg} border border-amber-500/20 rounded-xl p-6 shadow-2xl`}>
      <h2 className="text-xl font-bold text-white mb-6">📊 Live Analytics</h2>

      {/* Momentum Power Meters */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-sm font-semibold text-gray-300 mb-2">Player A Momentum</div>
          <div className="relative h-24 bg-gray-800 rounded-lg overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${currentMomentum.playerA}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
                {currentMomentum.playerA.toFixed(0)}%
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="text-sm font-semibold text-gray-300 mb-2">Player B Momentum</div>
          <div className="relative h-24 bg-gray-800 rounded-lg overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${currentMomentum.playerB}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
                {currentMomentum.playerB.toFixed(0)}%
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Momentum Over Time */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-gray-300 mb-2">Momentum Trend</div>
        <div className="bg-gray-900/50 rounded-lg p-4">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={momentumHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #F59E0B",
                  borderRadius: "8px",
                  color: "#FFF",
                }}
              />
              <Legend wrapperStyle={{ color: "#9CA3AF" }} />
              <Line
                type="monotone"
                dataKey="playerA"
                stroke={theme.primary}
                strokeWidth={3}
                dot={{ fill: theme.primary, r: 4 }}
                name="Player A"
              />
              <Line
                type="monotone"
                dataKey="playerB"
                stroke={theme.secondary}
                strokeWidth={3}
                dot={{ fill: theme.secondary, r: 4 }}
                name="Player B"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Comparison */}
      <div>
        <div className="text-sm font-semibold text-gray-300 mb-2">Performance Comparison</div>
        <div className="bg-gray-900/50 rounded-lg p-4">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={teamComparison} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
              <YAxis dataKey="stat" type="category" stroke="#9CA3AF" fontSize={12} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #F59E0B",
                  borderRadius: "8px",
                  color: "#FFF",
                }}
              />
              <Legend wrapperStyle={{ color: "#9CA3AF" }} />
              <Bar dataKey="teamA" fill={theme.primary} name="Player A" />
              <Bar dataKey="teamB" fill={theme.secondary} name="Player B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}



