"use client";

import { useEffect, useState } from "react";
import { getReplayVault, ReplayAsset, VaultStats } from "@/lib/vision/cloud/replayVault";
import { motion } from "framer-motion";

interface ReplayVaultPanelProps {
  tournamentId?: string;
}

export default function ReplayVaultPanel({ tournamentId }: ReplayVaultPanelProps) {
  const [vault] = useState(() => getReplayVault());
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [replays, setReplays] = useState<ReplayAsset[]>([]);
  const [filter, setFilter] = useState<ReplayAsset["type"] | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVaultData();
  }, [tournamentId, filter]);

  const loadVaultData = async () => {
    setLoading(true);
    try {
      const vaultStats = await vault.getVaultStats();
      setStats(vaultStats);

      if (tournamentId) {
        const assets = await vault.getReplaysByTournament(
          tournamentId,
          filter === "all" ? undefined : filter
        );
        setReplays(assets);
      } else {
        // Show top clips globally
        const topClips = await vault.getTopClips(20);
        setReplays(topClips);
      }
    } catch (error) {
      console.error("Failed to load vault data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatStorage = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          🎬 Replay Vault
        </h2>
        <button
          onClick={loadVaultData}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg"
        >
          Refresh
        </button>
      </div>

      {/* Vault Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.totalAssets}</div>
            <div className="text-xs text-gray-400">Total Assets</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-cyan-400">{formatDuration(stats.totalDuration)}</div>
            <div className="text-xs text-gray-400">Total Duration</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{formatStorage(stats.storageUsed)}</div>
            <div className="text-xs text-gray-400">Storage Used</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "highlight", "full_match", "clip", "instant_replay"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === type
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {type.replace(/_/g, " ").toUpperCase()}
          </button>
        ))}
      </div>

      {/* Replay List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading replays...</div>
        ) : replays.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No replays found</div>
        ) : (
          replays.map((replay) => (
            <motion.div
              key={replay.assetId}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                      replay.type === "highlight"
                        ? "bg-red-600 text-white"
                        : replay.type === "clip"
                        ? "bg-cyan-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}>
                      {replay.type.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      replay.status === "ready"
                        ? "bg-green-600 text-white"
                        : replay.status === "processing"
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}>
                      {replay.status}
                    </span>
                  </div>
                  
                  {replay.playerName && (
                    <div className="text-sm text-white font-medium mb-1">
                      {replay.playerName}
                    </div>
                  )}

                  <div className="text-xs text-gray-400">
                    Duration: {formatDuration(replay.duration)}
                    {replay.surgeScore && ` • Surge: ${replay.surgeScore}`}
                    {replay.metadata.viewCount > 0 && ` • ${replay.metadata.viewCount} views`}
                    {replay.metadata.upvotes > 0 && ` • ${replay.metadata.upvotes} upvotes`}
                  </div>

                  {replay.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {replay.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  {new Date(replay.metadata.timestamp).toLocaleDateString()}
                </div>
              </div>

              {replay.cdnUrl && (
                <div className="text-xs text-cyan-400 mt-2 truncate">
                  CDN: {replay.cdnUrl}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}



