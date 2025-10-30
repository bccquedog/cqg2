"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useVisionEngine } from "@/hooks/useVisionEngine";
import { useOBSBridge } from "@/hooks/useOBSBridge";
import VisionDirectorPanel from "@/components/VisionDirectorPanel";
import OBSControlPanel from "@/components/OBSControlPanel";
import InstantReplayControl from "@/components/InstantReplayControl";
import NowPlayingFeed from "@/components/NowPlayingFeed";
import AnalyticsVisualizer from "@/lib/vision/analytics/analyticsVisualizer";

export default function VisionCompanionPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const { currentFocus, engineState, setManualFocus, setAutoMode, getFocusHistory } = useVisionEngine(tournamentId);
  const obsControls = useOBSBridge(false);
  const [activePanel, setActivePanel] = useState<"caster" | "analytics" | "vision" | "replay">("caster");

  // Mock data for demo (replace with real hooks)
  const mockMomentumHistory = [
    { time: "0:00", playerA: 50, playerB: 50 },
    { time: "1:00", playerA: 65, playerB: 55 },
    { time: "2:00", playerA: 75, playerB: 48 },
    { time: "3:00", playerA: 85, playerB: 60 },
  ];

  const mockTeamComparison = [
    { stat: "Kills", teamA: 15, teamB: 12 },
    { stat: "Surge", teamA: 85, teamB: 72 },
    { stat: "Accuracy", teamA: 78, teamB: 81 },
    { stat: "Clutch", teamA: 3, teamB: 2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      {/* Header */}
      <div className="mb-6 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-lg p-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
              CQG Vision Companion
            </h1>
            <div className="text-sm text-gray-400 mt-1">Tournament: {tournamentId.slice(-8)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded text-xs font-bold ${
              obsControls.status.connected 
                ? "bg-green-600 text-white" 
                : "bg-gray-700 text-gray-400"
            }`}>
              OBS: {obsControls.status.connected ? "CONNECTED" : "OFFLINE"}
            </div>
            <div className={`px-3 py-1 rounded text-xs font-bold ${
              engineState.isActive 
                ? "bg-green-600 text-white animate-pulse" 
                : "bg-gray-700 text-gray-400"
            }`}>
              Vision: {engineState.isActive ? "ACTIVE" : "IDLE"}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActivePanel("caster")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activePanel === "caster"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          🎙 Caster Dashboard
        </button>
        <button
          onClick={() => setActivePanel("analytics")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activePanel === "analytics"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          📊 Analytics Board
        </button>
        <button
          onClick={() => setActivePanel("vision")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activePanel === "vision"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          🎥 Vision Control
        </button>
        <button
          onClick={() => setActivePanel("replay")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activePanel === "replay"
              ? "bg-amber-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          ⏪ Replay Queue
        </button>
      </div>

      {/* Panel Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {activePanel === "caster" && (
          <>
            <div className="lg:col-span-2">
              <NowPlayingFeed tournamentId={tournamentId} maxItems={8} />
            </div>
            <div>
              <OBSControlPanel />
            </div>
          </>
        )}

        {activePanel === "analytics" && (
          <div className="lg:col-span-3">
            <AnalyticsVisualizer
              momentumHistory={mockMomentumHistory}
              teamComparison={mockTeamComparison}
              currentMomentum={{ playerA: 85, playerB: 60 }}
              gameTheme="default"
            />
          </div>
        )}

        {activePanel === "vision" && (
          <>
            <div className="lg:col-span-2">
              <VisionDirectorPanel
                engineState={engineState}
                currentFocus={currentFocus}
                onManualFocus={setManualFocus}
                onAutoMode={setAutoMode}
                focusHistory={getFocusHistory()}
              />
            </div>
            <div>
              <OBSControlPanel />
            </div>
          </>
        )}

        {activePanel === "replay" && (
          <div className="lg:col-span-3">
            <InstantReplayControl
              highlights={[]}
              onReplayTriggered={(h) => console.log("Replay triggered:", h)}
            />
          </div>
        )}
      </div>
    </div>
  );
}



