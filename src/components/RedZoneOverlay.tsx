"use client";

import { useRedZoneFeed } from "@/hooks/useRedZoneFeed";
import { useRedZoneOverlayState } from "@/hooks/useRedZoneOverlayState";
import { useVisionEngine } from "@/hooks/useVisionEngine";
import LiveMomentumBar from "./LiveMomentumBar";
import VisionDirectorPanel from "./VisionDirectorPanel";
import { getMomentumLevel } from "@/lib/momentumCalculator";
import { useState } from "react";

interface RedZoneOverlayProps {
  tournamentId: string;
  showControls?: boolean;
}

export default function RedZoneOverlay({ tournamentId, showControls = false }: RedZoneOverlayProps) {
  const feedData = useRedZoneFeed(tournamentId);
  const { state, setMode, pinMatch } = useRedZoneOverlayState(feedData.activeMatches);
  const { currentFocus, engineState, setManualFocus, setAutoMode, getFocusHistory } = useVisionEngine(tournamentId);
  const [showVisionPanel, setShowVisionPanel] = useState(false);

  const displayMatches = state.mode === "spotlight" && state.spotlightMatchId
    ? feedData.activeMatches.filter((m) => m.matchId === state.spotlightMatchId)
    : state.mode === "rotation"
    ? feedData.activeMatches.slice(state.rotationIndex, state.rotationIndex + 1)
    : feedData.activeMatches.slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      {/* Header */}
      <div className="mb-6 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-lg p-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
              CQG RedZone
            </div>
            <div className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded animate-pulse">
              LIVE
            </div>
          </div>
          <div className="text-sm text-gray-300">
            {feedData.totalActive} Active Matches
          </div>
        </div>

        {/* Live Ticker */}
        <div className="mt-3 overflow-hidden">
          <div className="flex gap-8 animate-marquee whitespace-nowrap text-sm text-gray-300">
            {feedData.activeMatches.map((m) => (
              <span key={m.matchId} className="inline-flex items-center gap-2">
                🔥 {m.playerAName} vs {m.playerBName} • Avg Momentum: {m.avgMomentum.toFixed(0)}%
              </span>
            ))}
            {feedData.mvpLeader && (
              <span className="inline-flex items-center gap-2">
                🏆 MVP Leader: {feedData.mvpLeader.playerName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Match Grid */}
      <div className={`grid gap-4 ${
        state.mode === "spotlight" || state.mode === "rotation"
          ? "grid-cols-1"
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2"
      }`}>
        {displayMatches.map((match) => {
          const levelA = getMomentumLevel(match.playerAMomentum.recentSurgeScore || 0);
          const levelB = getMomentumLevel(match.playerBMomentum.recentSurgeScore || 0);
          const isSpotlight = state.spotlightMatchId === match.matchId;

          return (
            <div
              key={match.matchId}
              className={`bg-gradient-to-br from-gray-900 to-gray-800 border border-amber-500/30 rounded-xl p-6 shadow-2xl backdrop-blur-md transition-all duration-500 ${
                isSpotlight ? "scale-105 shadow-[0_0_40px_rgba(251,191,36,0.4)]" : ""
              }`}
              onClick={() => state.mode === "grid" && pinMatch(match.matchId)}
            >
              {/* Match Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-bold text-amber-400">
                  ROUND {match.roundNumber}
                </div>
                <div className="flex items-center gap-2">
                  {match.avgMomentum > 70 && (
                    <span className="text-xs text-red-400 animate-pulse">🔥 HOT MATCH</span>
                  )}
                  <span className="text-xs text-gray-400">Match {match.matchId.slice(-4)}</span>
                </div>
              </div>

              {/* Player A */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{match.playerAName}</span>
                    {match.playerASeed && (
                      <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        #{match.playerASeed}
                      </span>
                    )}
                  </div>
                  <div className="text-xl">{levelA.icon}</div>
                </div>
                <LiveMomentumBar
                  playerId={match.playerAId}
                  playerName={match.playerAName}
                  momentumData={match.playerAMomentum}
                  showStats={false}
                />
              </div>

              {/* VS Divider */}
              <div className="flex items-center justify-center my-3">
                <div className="text-xl font-bold text-amber-400 px-4 py-1 bg-gray-800/50 rounded">
                  VS
                </div>
              </div>

              {/* Player B */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{match.playerBName}</span>
                    {match.playerBSeed && (
                      <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        #{match.playerBSeed}
                      </span>
                    )}
                  </div>
                  <div className="text-xl">{levelB.icon}</div>
                </div>
                <LiveMomentumBar
                  playerId={match.playerBId}
                  playerName={match.playerBName}
                  momentumData={match.playerBMomentum}
                  showStats={false}
                />
              </div>

              {/* Match Stats */}
              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>Avg Momentum: {match.avgMomentum.toFixed(0)}%</span>
                <span className="text-green-400">● LIVE</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Active Matches State */}
      {displayMatches.length === 0 && (
        <div className="flex items-center justify-center h-64 bg-gray-900/50 border border-gray-700 rounded-xl">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-2">🎮</div>
            <div className="text-lg">No active matches</div>
            <div className="text-sm">Waiting for tournament to start...</div>
          </div>
        </div>
      )}

      {/* Mode Indicator */}
      {!state.streamerMode && (
        <div className="fixed bottom-4 left-4 px-3 py-2 bg-gray-900/90 border border-amber-500/30 rounded-lg text-xs text-amber-400">
          Mode: {state.mode.toUpperCase()}
          {state.pinnedMatchId && " (PINNED)"}
          {currentFocus && ` | Vision: ${currentFocus.reason.replace(/_/g, " ").toUpperCase()}`}
        </div>
      )}

      {/* Vision Director Panel Toggle */}
      {showControls && (
        <>
          <button
            onClick={() => setShowVisionPanel(!showVisionPanel)}
            className="fixed top-4 right-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium shadow-lg transition-colors"
          >
            🎥 {showVisionPanel ? "Hide" : "Show"} Vision Director
          </button>

          {showVisionPanel && (
            <div className="fixed top-16 right-4 w-96">
              <VisionDirectorPanel
                engineState={engineState}
                currentFocus={currentFocus}
                onManualFocus={setManualFocus}
                onAutoMode={setAutoMode}
                focusHistory={getFocusHistory()}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

