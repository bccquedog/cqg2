"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MatchStats } from "@/lib/vision/analytics/visionAnalytics";
import LiveMomentumBar from "../LiveMomentumBar";

interface CommentatorHUDProps {
  matchStats: MatchStats | null;
  mvpPlayer: { id: string; name: string; stats: any } | null;
  liveEvents: Array<{ timestamp: number; description: string; type: string }>;
  matchDuration: number; // seconds
  onPinHighlight?: (eventId: string) => void;
}

export default function CommentatorHUD({
  matchStats,
  mvpPlayer,
  liveEvents,
  matchDuration,
  onPinHighlight,
}: CommentatorHUDProps) {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Top Left: Match Timer */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-4 left-4 bg-gray-900/90 border border-amber-500/30 rounded-lg px-4 py-2 backdrop-blur-md pointer-events-auto"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatTime(matchDuration)}
          </div>
          {matchStats && (
            <div className="text-xs text-gray-400">
              Round {matchStats.roundNumber}
            </div>
          )}
        </div>
      </motion.div>

      {/* Top Right: Momentum Comparison */}
      {matchStats && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute top-4 right-4 bg-gray-900/90 border border-amber-500/30 rounded-lg p-4 backdrop-blur-md pointer-events-auto w-80"
        >
          <div className="text-sm font-semibold text-gray-300 mb-3">Momentum Battle</div>
          <div className="space-y-3">
            <LiveMomentumBar
              playerId={matchStats.playerAId}
              playerName={matchStats.playerAStats.surgeScore > matchStats.playerBStats.surgeScore ? "🔥 " + "Player A" : "Player A"}
              momentumData={{
                recentSurgeScore: matchStats.playerAStats.surgeScore,
                winStreak: matchStats.playerAStats.currentStreak,
                clutchPlays: matchStats.playerAStats.clutchPlays,
              }}
              showStats={false}
            />
            <LiveMomentumBar
              playerId={matchStats.playerBId}
              playerName={matchStats.playerBStats.surgeScore > matchStats.playerAStats.surgeScore ? "🔥 " + "Player B" : "Player B"}
              momentumData={{
                recentSurgeScore: matchStats.playerBStats.surgeScore,
                winStreak: matchStats.playerBStats.currentStreak,
                clutchPlays: matchStats.playerBStats.clutchPlays,
              }}
              showStats={false}
            />
          </div>
        </motion.div>
      )}

      {/* Bottom Left: MVP Card */}
      {mvpPlayer && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-4 left-4 bg-gradient-to-br from-amber-900/90 to-yellow-900/90 border border-amber-500/50 rounded-lg p-4 backdrop-blur-md pointer-events-auto w-72"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">👑</div>
            <div>
              <div className="text-xs text-amber-300">Current MVP</div>
              <div className="text-lg font-bold text-white">{mvpPlayer.name}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-xl font-bold text-white">{mvpPlayer.stats?.kills || 0}</div>
              <div className="text-gray-300">Kills</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-cyan-400">{mvpPlayer.stats?.surgeScore || 0}</div>
              <div className="text-gray-300">Surge</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-400">{mvpPlayer.stats?.clutchPlays || 0}</div>
              <div className="text-gray-300">Clutch</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bottom Right: Live Event Log */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-4 right-4 bg-gray-900/90 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-md pointer-events-auto w-80 max-h-64 overflow-hidden"
      >
        <div className="text-sm font-semibold text-gray-300 mb-3">🎙️ Live Event Feed</div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <AnimatePresence>
            {liveEvents.slice(-5).reverse().map((event, index) => (
              <motion.div
                key={event.timestamp}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-2 rounded-lg ${
                  event.type === "clutch" || event.type === "ace"
                    ? "bg-red-900/30 border border-red-500/30"
                    : "bg-gray-800/50 border border-gray-700"
                }`}
              >
                <div className="text-xs text-white">{event.description}</div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}



