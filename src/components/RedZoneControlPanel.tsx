"use client";

import { RedZoneMode } from "@/hooks/useRedZoneOverlayState";

interface RedZoneControlPanelProps {
  mode: RedZoneMode;
  onModeChange: (mode: RedZoneMode) => void;
  rotationInterval: number;
  onRotationIntervalChange: (seconds: number) => void;
  clipAutoplay: boolean;
  onToggleClipAutoplay: () => void;
  streamerMode: boolean;
  onToggleStreamerMode: () => void;
  pinnedMatchId: string | null;
  onPinMatch: (matchId: string | null) => void;
}

export default function RedZoneControlPanel({
  mode,
  onModeChange,
  rotationInterval,
  onRotationIntervalChange,
  clipAutoplay,
  onToggleClipAutoplay,
  streamerMode,
  onToggleStreamerMode,
  pinnedMatchId,
  onPinMatch,
}: RedZoneControlPanelProps) {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-amber-500/30 rounded-xl p-6 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-4">🎛️ RedZone Control Panel</h2>

      <div className="space-y-4">
        {/* Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Display Mode</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onModeChange("grid")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "grid"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Grid (4)
            </button>
            <button
              onClick={() => onModeChange("spotlight")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "spotlight"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Spotlight
            </button>
            <button
              onClick={() => onModeChange("rotation")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "rotation"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Rotation
            </button>
          </div>
        </div>

        {/* Rotation Interval */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Rotation Timer (seconds)
          </label>
          <input
            type="number"
            value={rotationInterval}
            onChange={(e) => onRotationIntervalChange(Number(e.target.value))}
            min="10"
            max="300"
            step="10"
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <span className="text-sm text-gray-300">Clip Autoplay</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={clipAutoplay}
                onChange={onToggleClipAutoplay}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <span className="text-sm text-gray-300">Streamer Mode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={streamerMode}
                onChange={onToggleStreamerMode}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </div>

        {/* Pin Match */}
        {pinnedMatchId && (
          <div className="p-3 bg-amber-900/30 border border-amber-500/40 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-300">📌 Match Pinned</span>
              <button
                onClick={() => onPinMatch(null)}
                className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Unpin
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-gray-800/50 rounded-lg text-center">
            <div className="text-2xl font-bold text-amber-400">{feedData.totalActive}</div>
            <div className="text-gray-400">Active</div>
          </div>
          <div className="p-3 bg-gray-800/50 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">{feedData.totalCompleted}</div>
            <div className="text-gray-400">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}



