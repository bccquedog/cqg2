"use client";

import { useState } from "react";
import { HighlightMoment } from "@/lib/vision/analytics/visionAnalytics";
import { useOBSBridge } from "@/hooks/useOBSBridge";

interface InstantReplayControlProps {
  highlights: HighlightMoment[];
  onReplayTriggered?: (highlight: HighlightMoment) => void;
}

export default function InstantReplayControl({ 
  highlights, 
  onReplayTriggered 
}: InstantReplayControlProps) {
  const { switchScene, playStinger, status } = useOBSBridge(false);
  const [selectedHighlight, setSelectedHighlight] = useState<HighlightMoment | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);

  const triggerReplay = async (highlight: HighlightMoment) => {
    if (isReplaying) return;

    setSelectedHighlight(highlight);
    setIsReplaying(true);
    onReplayTriggered?.(highlight);

    // OBS integration
    if (status.connected) {
      await playStinger("InstantReplay_Stinger");
      await switchScene("InstantReplay");

      // Return to main feed after 10 seconds
      setTimeout(async () => {
        await switchScene("MatchFeed");
        setIsReplaying(false);
      }, 10000);
    } else {
      // Fallback without OBS
      setTimeout(() => {
        setIsReplaying(false);
      }, 10000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          ⏪ Instant Replay
          {isReplaying && (
            <span className="text-xs px-2 py-1 bg-red-600 rounded animate-pulse">REPLAYING</span>
          )}
        </h2>
        <div className="text-xs text-gray-400">
          {highlights.length} Highlights
        </div>
      </div>

      {/* Highlight Queue */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {highlights.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No highlights detected yet
          </div>
        ) : (
          highlights.map((highlight, index) => (
            <div
              key={`${highlight.playerId}-${highlight.timestamp}`}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                selectedHighlight === highlight
                  ? "bg-cyan-900/50 border-cyan-500"
                  : "bg-gray-800/50 border-gray-700 hover:border-cyan-500/50"
              }`}
              onClick={() => !isReplaying && triggerReplay(highlight)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded font-bold ${
                    highlight.priority >= 9
                      ? "bg-red-600 text-white"
                      : highlight.priority >= 7
                      ? "bg-yellow-600 text-white"
                      : "bg-blue-600 text-white"
                  }`}>
                    P{highlight.priority}
                  </span>
                  <span className="text-sm font-medium text-white">
                    {highlight.type.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  #{index + 1}
                </span>
              </div>
              <div className="text-xs text-gray-300 mb-1">
                {highlight.description}
              </div>
              <div className="text-xs text-gray-500">
                Player: {highlight.playerId.slice(-8)}
              </div>
              {highlight.clipId && (
                <div className="text-xs text-cyan-400 mt-1">
                  📹 Clip Available
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {highlights.length > 0 && !isReplaying && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={() => triggerReplay(highlights[0])}
            className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
          >
            Play Latest Highlight
          </button>
        </div>
      )}

      {isReplaying && selectedHighlight && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/40 rounded-lg">
          <div className="text-sm text-red-300 font-medium">
            🔴 Replaying: {selectedHighlight.description}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Returns to live in 10 seconds...
          </div>
        </div>
      )}
    </div>
  );
}



