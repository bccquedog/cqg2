"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { getMomentumLevel } from "@/lib/momentumCalculator";

interface PlayerMomentum {
  playerId: string;
  playerName: string;
  momentum: number;
  surgeScore: number;
  status: "active" | "eliminated" | "idle";
  currentMatchId?: string;
}

interface SurgeHeatMapProps {
  tournamentId: string;
  maxPlayers?: number;
  onTileClick?: (playerId: string, matchId?: string) => void;
}

export default function SurgeHeatMap({ tournamentId, maxPlayers = 16, onTileClick }: SurgeHeatMapProps) {
  const [players, setPlayers] = useState<PlayerMomentum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const playersCol = collection(db, "tournaments", tournamentId, "roster");
    const q = query(playersCol);

    const unsub = onSnapshot(q, (snap) => {
      const playerData: PlayerMomentum[] = [];
      
      snap.forEach((doc) => {
        const data = doc.data();
        playerData.push({
          playerId: doc.id,
          playerName: data.gamerTag || data.displayName || "Player",
          momentum: data.momentum || 0,
          surgeScore: data.recentSurgeScore || 0,
          status: data.status || "active",
          currentMatchId: data.currentMatchId,
        });
      });

      // Sort by momentum (highest first)
      playerData.sort((a, b) => b.momentum - a.momentum);
      setPlayers(playerData.slice(0, maxPlayers));
      setLoading(false);
    });

    return () => unsub();
  }, [tournamentId, maxPlayers]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="text-center text-gray-600">Loading heat map...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          🔥 Surge Heat Map
        </h3>
        <div className="text-xs text-gray-400">Live</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {players.map((player, index) => {
          const level = getMomentumLevel(player.momentum);
          const isEliminated = player.status === "eliminated";
          
          const isSurging = player.momentum >= 90;
          
          return (
            <div
              key={player.playerId}
              onClick={() => onTileClick?.(player.playerId, player.currentMatchId)}
              className={`relative p-3 rounded-lg border transition-all duration-300 cursor-pointer hover:scale-105 ${
                isEliminated 
                  ? "bg-gray-800 border-gray-700 opacity-50" 
                  : `bg-gradient-to-br ${level.color} ${level.glow} border-transparent ${
                      isSurging ? "animate-pulse" : ""
                    }`
              }`}
            >
              <div className="absolute top-1 right-1 text-[10px] font-bold text-white/60">
                #{index + 1}
              </div>
              
              <div className="text-center">
                <div className="text-2xl mb-1">{level.icon}</div>
                <div className="font-bold text-white text-sm truncate mb-1">
                  {player.playerName}
                </div>
                <div className="text-xs text-white/80 font-mono">
                  {player.momentum.toFixed(0)}%
                </div>
                <div className="text-[10px] text-white/60 mt-1">
                  Surge: {player.surgeScore}
                </div>
              </div>

              {isEliminated && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <span className="text-xs font-bold text-red-400">OUT</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span>🔥 Blazing (80+)</span>
          <span>⚡ Hot (60+)</span>
          <span>📈 Warming (30+)</span>
          <span>❄️ Cold (&lt;30)</span>
        </div>
        <div className="text-gray-500">
          Updates in real-time
        </div>
      </div>
    </div>
  );
}

