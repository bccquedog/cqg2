"use client";

import { useState } from "react";
import { useBNController } from "@/hooks/useBNController";
import { motion } from "framer-motion";

export default function BNControlPage() {
  const { state, goLive, goStandby, removeNode } = useBNController();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = state.nodes.find((n) => n.nodeId === selectedNodeId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl p-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 mb-2">
              CQG Broadcast Network
            </h1>
            <div className="text-sm text-gray-400">Centralized Multi-Tournament Production Control</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{state.totalViewers.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Total Viewers</div>
          </div>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-400">{state.nodes.length}</div>
            <div className="text-xs text-gray-400">Active Nodes</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{state.totalActiveMatches}</div>
            <div className="text-xs text-gray-400">Live Matches</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-cyan-400">{state.networkHealth}%</div>
            <div className="text-xs text-gray-400">Network Health</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold ${
              state.nodes.filter(n => n.status === "live").length > 0 ? "text-red-500 animate-pulse" : "text-gray-500"
            }`}>
              ●
            </div>
            <div className="text-xs text-gray-400">Broadcast Status</div>
          </div>
        </div>
      </div>

      {/* Node Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {state.nodes.map((node) => (
          <motion.div
            key={node.nodeId}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedNodeId(node.nodeId)}
            className={`bg-gradient-to-br from-gray-900 to-gray-800 border rounded-xl p-6 cursor-pointer transition-all ${
              selectedNodeId === node.nodeId
                ? "border-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.3)]"
                : node.status === "live"
                ? "border-green-500/50"
                : "border-gray-700"
            }`}
          >
            {/* Node Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-bold text-white mb-1">{node.tournamentName}</div>
                <div className="text-xs text-gray-400">Node: {node.nodeId.slice(-8)}</div>
              </div>
              <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                node.status === "live"
                  ? "bg-red-600 text-white animate-pulse"
                  : node.status === "standby"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-700 text-gray-400"
              }`}>
                {node.status.toUpperCase()}
              </div>
            </div>

            {/* Node Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                <div className="text-xl font-bold text-white">{node.viewers}</div>
                <div className="text-xs text-gray-400">Viewers</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                <div className="text-xl font-bold text-green-400">{node.activeMatches}</div>
                <div className="text-xs text-gray-400">Matches</div>
              </div>
            </div>

            {/* Health & Latency */}
            <div className="flex items-center justify-between text-xs mb-4">
              <div className="flex items-center gap-2">
                <div className="text-gray-400">Health:</div>
                <div className={`font-mono ${
                  node.health >= 80 ? "text-green-400" : node.health >= 50 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {node.health}%
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-gray-400">Latency:</div>
                <div className={`font-mono ${
                  node.latency < 50 ? "text-green-400" : node.latency < 100 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {node.latency}ms
                </div>
              </div>
            </div>

            {/* MVP Badge */}
            {node.mvpPlayer && (
              <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-2 text-xs">
                <div className="flex items-center gap-2">
                  <span>👑</span>
                  <span className="text-amber-300">MVP: {node.mvpPlayer.name}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              {node.status !== "live" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goLive(node.nodeId);
                  }}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium"
                >
                  Go Live
                </button>
              )}
              {node.status === "live" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goStandby(node.nodeId);
                  }}
                  className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded-lg font-medium"
                >
                  Standby
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNode(node.nodeId);
                }}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg font-medium"
              >
                Offline
              </button>
            </div>
          </motion.div>
        ))}

        {state.nodes.length === 0 && (
          <div className="col-span-full text-center py-16">
            <div className="text-4xl mb-3">📡</div>
            <div className="text-gray-400 text-lg">No active broadcast nodes</div>
            <div className="text-gray-500 text-sm mt-2">Register Vision nodes to begin network control</div>
          </div>
        )}
      </div>

      {/* Selected Node Detail */}
      {selectedNode && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-gray-900 to-black border border-amber-500/30 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">Node Details: {selectedNode.tournamentName}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Stream URL</div>
              <div className="text-sm text-white font-mono truncate">{selectedNode.streamUrl || "N/A"}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Highlights</div>
              <div className="text-2xl font-bold text-cyan-400">{selectedNode.highlights}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Last Heartbeat</div>
              <div className="text-sm text-white">
                {new Date(selectedNode.lastHeartbeat).toLocaleTimeString()}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Tournament ID</div>
              <div className="text-sm text-white font-mono">{selectedNode.tournamentId.slice(-8)}</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}



