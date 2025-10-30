"use client";

import { useState } from "react";
import { useOBSBridge } from "@/hooks/useOBSBridge";

interface OBSControlPanelProps {
  onSceneChange?: (sceneName: string) => void;
}

export default function OBSControlPanel({ onSceneChange }: OBSControlPanelProps) {
  const { status, connect, disconnect, switchScene, toggleSource, setText } = useOBSBridge(false);
  const [selectedScene, setSelectedScene] = useState("MatchFeed");
  const [sponsorVisible, setSponsorVisible] = useState(false);
  const [playerNameText, setPlayerNameText] = useState("");

  const handleConnect = async () => {
    const success = await connect();
    if (!success) {
      alert("Failed to connect to OBS. Check connection settings.");
    }
  };

  const handleSwitchScene = async (sceneName: string) => {
    const success = await switchScene(sceneName);
    if (success) {
      setSelectedScene(sceneName);
      onSceneChange?.(sceneName);
    }
  };

  const handleToggleSponsor = async () => {
    const newState = !sponsorVisible;
    const success = await toggleSource("SponsorLayer", newState);
    if (success) {
      setSponsorVisible(newState);
    }
  };

  const handleUpdatePlayerName = async () => {
    if (playerNameText.trim()) {
      await setText("PlayerNameTag", playerNameText);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-xl p-6 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        📡 OBS Stream Control
        {status.connected && (
          <span className="text-xs px-2 py-1 bg-green-600 rounded animate-pulse">LIVE</span>
        )}
      </h2>

      {/* Connection Status */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Connection Status</span>
          <span className={`text-xs px-2 py-1 rounded ${
            status.connected 
              ? "bg-green-600 text-white" 
              : "bg-red-600 text-white"
          }`}>
            {status.connected ? "Connected" : "Disconnected"}
          </span>
        </div>
        {status.version && (
          <div className="text-xs text-gray-400">OBS v{status.version}</div>
        )}
        {status.error && (
          <div className="text-xs text-red-400 mt-1">{status.error}</div>
        )}
      </div>

      {/* Connect/Disconnect */}
      <div className="mb-6">
        {!status.connected ? (
          <button
            onClick={handleConnect}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Connect to OBS
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>

      {status.connected && (
        <>
          {/* Scene Switcher */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Quick Scenes</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSwitchScene("MatchFeed")}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedScene === "MatchFeed"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Match Feed
              </button>
              <button
                onClick={() => handleSwitchScene("PlayerCam")}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedScene === "PlayerCam"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Player Cam
              </button>
              <button
                onClick={() => handleSwitchScene("Bracket")}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedScene === "Bracket"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Bracket
              </button>
              <button
                onClick={() => handleSwitchScene("Intermission")}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedScene === "Intermission"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Intermission
              </button>
            </div>
          </div>

          {/* Sponsor Overlay */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Overlays</label>
            <button
              onClick={handleToggleSponsor}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                sponsorVisible
                  ? "bg-amber-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {sponsorVisible ? "Hide" : "Show"} Sponsor Layer
            </button>
          </div>

          {/* Text Source Update */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Player Name Tag</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={playerNameText}
                onChange={(e) => setPlayerNameText(e.target.value)}
                placeholder="Enter player name"
                className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleUpdatePlayerName}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                Update
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}



