"use client";

import { useState } from "react";
import { VisionEngineState, VisionFocusTarget } from "@/lib/vision/visionEngine";

interface VisionDirectorPanelProps {
  engineState: VisionEngineState;
  currentFocus: VisionFocusTarget | null;
  onManualFocus: (matchId: string, playerId?: string) => void;
  onAutoMode: () => void;
  focusHistory: VisionFocusTarget[];
}

export default function VisionDirectorPanel({
  engineState,
  currentFocus,
  onManualFocus,
  onAutoMode,
  focusHistory,
}: VisionDirectorPanelProps) {
  const [showHistory, setShowHistory] = useState(false);

  const isAutoMode = engineState.mode === "auto";

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-amber-500/30 rounded-xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
          🎥 CQG Vision Director
        </h2>
        <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
          engineState.isActive 
            ? "bg-green-600 text-white animate-pulse" 
            : "bg-gray-700 text-gray-400"
        }`}>
          {engineState.isActive ? "ACTIVE" : "INACTIVE"}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Control Mode</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAutoMode}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              isAutoMode
                ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🤖 Auto Director
          </button>
          <button
            onClick={() => {}}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              !isAutoMode
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🎛️ Manual Control
          </button>
        </div>
      </div>

      {/* Current Focus */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Current Focus</label>
        {currentFocus ? (
          <div className="bg-gray-800/50 border border-amber-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-mono text-amber-400">
                Match: {currentFocus.matchId.slice(-8)}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                currentFocus.priority >= 8 
                  ? "bg-red-600 text-white" 
                  : currentFocus.priority >= 6
                  ? "bg-yellow-600 text-white"
                  : "bg-blue-600 text-white"
              }`}>
                P{currentFocus.priority}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              Reason: {currentFocus.reason.replace(/_/g, " ").toUpperCase()}
            </div>
            {currentFocus.playerId && (
              <div className="text-xs text-gray-400 mt-1">
                Player: {currentFocus.playerId.slice(-8)}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center text-gray-500 text-sm">
            No active focus
          </div>
        )}
      </div>

      {/* Candidate Focuses */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Active Candidates ({engineState.candidateFocuses.length})
        </label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {engineState.candidateFocuses
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 5)
            .map((candidate, index) => (
              <div
                key={`${candidate.matchId}-${index}`}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-2 text-xs hover:border-amber-500/30 cursor-pointer transition-colors"
                onClick={() => onManualFocus(candidate.matchId, candidate.playerId)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{candidate.reason.replace(/_/g, " ")}</span>
                  <span className="text-amber-400 font-bold">P{candidate.priority}</span>
                </div>
              </div>
            ))}
          {engineState.candidateFocuses.length === 0 && (
            <div className="text-xs text-gray-500 text-center py-2">
              No candidates detected
            </div>
          )}
        </div>
      </div>

      {/* Focus History */}
      <div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-sm text-amber-400 hover:text-amber-300 mb-2"
        >
          {showHistory ? "▼" : "▶"} Focus History ({focusHistory.length})
        </button>
        {showHistory && (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {focusHistory.slice(-10).reverse().map((focus, index) => (
              <div
                key={index}
                className="bg-gray-800/30 rounded p-2 text-xs text-gray-400"
              >
                <div className="flex justify-between">
                  <span>{focus.reason.replace(/_/g, " ")}</span>
                  <span className="text-amber-400">P{focus.priority}</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {new Date(focus.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



