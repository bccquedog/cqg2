"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useCompetitiveOverlay } from "@/hooks/useCompetitiveOverlay";
import { usePregameLobby } from "@/hooks/usePregameLobby";

export default function AdminTournamentPage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [seedingMode, setSeedingMode] = useState<"random" | "leaderboard" | "admin">("random");
  const { tournament, isOverlayVisible, toggleOverlay } = useCompetitiveOverlay(id);
  const { tournament: lobbyTournament, isLobbyVisible, toggleLobby, updateLobbySettings } = usePregameLobby(id);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "tournaments", id));
        if (snap.exists()) {
          const data = snap.data() as any;
          setSeedingMode((data.seedingMode as any) || "random");
        }
      } catch {}
    })();
  }, [id]);

  const exportReport = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/exportReport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: id })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed');
      setMessage('✅ Report exported successfully');
    } catch (e: any) {
      setMessage('❌ Report export failed');
    } finally {
      setLoading(false);
    }
  };

  const forceAdvance = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, "tournaments", id), { forceAdvance: true });
      setMessage("⚡ Forced round advancement triggered");
    } catch (e: any) {
      setMessage("❌ Failed to trigger force advance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin · Tournament {id}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={forceAdvance}
            disabled={loading}
            className="text-sm inline-flex items-center px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
          >
            ⚡ Force Advance
          </button>
          <button
            onClick={exportReport}
            disabled={loading}
            className="text-sm inline-flex items-center px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating…' : '📊 Export Report'}
          </button>
        </div>
      </div>

      <div className="p-4 border rounded bg-white">
        <label className="block text-sm font-medium mb-1">Seeding Mode
          <span className="ml-2 text-xs text-gray-500" title="Advanced seeding modes will be unlocked in Phase 2.">ⓘ</span>
        </label>
        <select
          value={seedingMode}
          onChange={async (e) => {
            const val = e.target.value as any;
            // Only allow random in Phase 1; others appear disabled in UI
            setSeedingMode(val);
            if (val !== 'random') return;
            try {
              await updateDoc(doc(db, 'tournaments', id), { seedingMode: 'random', seedOrder: null });
              setMessage('✅ Seeding mode set to Random');
            } catch (e) {
              setMessage('❌ Failed to update seeding mode');
            }
          }}
          className="border rounded px-2 py-1 disabled:opacity-50"
        >
          <option value="random">Random (active)</option>
          <option value="leaderboard" disabled>Leaderboard (Phase 2)</option>
          <option value="admin" disabled>Admin (Phase 2)</option>
        </select>
      </div>

      {/* Tournament Features Panel */}
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">⚙️</span>
          Tournament Features
          <span className="ml-2 text-xs text-gray-500" title="Configure tournament features and settings">ⓘ</span>
        </h3>
        
        <div className="space-y-6">
          {/* Competitive Overlay */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📺</span>
                <div>
                  <h4 className="font-medium text-gray-900">Competitive Overlay</h4>
                  <p className="text-sm text-gray-600">Live match overlay for streaming/broadcasting</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-xs px-2 py-1 rounded-full ${
                isOverlayVisible 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {isOverlayVisible ? 'Active' : 'Inactive'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOverlayVisible}
                  onChange={(e) => {
                    toggleOverlay(e.target.checked);
                    setMessage(e.target.checked ? '✅ Competitive overlay enabled' : '✅ Competitive overlay disabled');
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Pregame Lobby */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🎮</span>
                <div>
                  <h4 className="font-medium text-gray-900">Pregame Lobby</h4>
                  <p className="text-sm text-gray-600">Pre-tournament experience with music, polls, and countdown</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-xs px-2 py-1 rounded-full ${
                isLobbyVisible 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {isLobbyVisible ? 'Active' : 'Inactive'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLobbyVisible}
                  onChange={(e) => {
                    toggleLobby(e.target.checked);
                    setMessage(e.target.checked ? '✅ Pregame lobby enabled' : '✅ Pregame lobby disabled');
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Auto-Progression */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-lg">⚡</span>
                <div>
                  <h4 className="font-medium text-gray-900">Auto-Progression</h4>
                  <p className="text-sm text-gray-600">Automatically advance winners to next round</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-xs px-2 py-1 rounded-full ${
                tournament?.settings?.autoProgress 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tournament?.settings?.autoProgress ? 'Active' : 'Inactive'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={tournament?.settings?.autoProgress || false}
                  onChange={async (e) => {
                    try {
                      await updateDoc(doc(db, 'tournaments', id), {
                        'settings.autoProgress': e.target.checked,
                        updatedAt: new Date()
                      });
                      setMessage(e.target.checked ? '✅ Auto-progression enabled' : '✅ Auto-progression disabled');
                    } catch (e) {
                      setMessage('❌ Failed to update auto-progression setting');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Advanced Settings</h4>
          
          {/* Simulation Mode */}
          {tournament?.settings?.autoProgress && (
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🎲</span>
                  <div>
                    <h5 className="font-medium text-gray-900">Simulation Mode</h5>
                    <p className="text-sm text-gray-600">Random winners for testing and development</p>
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={tournament?.settings?.simulationMode || false}
                  onChange={async (e) => {
                    try {
                      await updateDoc(doc(db, 'tournaments', id), {
                        'settings.simulationMode': e.target.checked,
                        updatedAt: new Date()
                      });
                      setMessage(e.target.checked ? '✅ Simulation mode enabled' : '✅ Simulation mode disabled');
                    } catch (e) {
                      setMessage('❌ Failed to update simulation mode');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
          )}

          {/* Lobby Settings */}
          {isLobbyVisible && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-3">Lobby Content Settings</h5>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={lobbyTournament?.lobbySettings?.showCountdown || false}
                    onChange={(e) => updateLobbySettings({ showCountdown: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">Countdown Timer</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={lobbyTournament?.lobbySettings?.showMusic || false}
                    onChange={(e) => updateLobbySettings({ showMusic: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">Music Section</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={lobbyTournament?.lobbySettings?.showPoll || false}
                    onChange={(e) => updateLobbySettings({ showPoll: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">Prediction Poll</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={lobbyTournament?.lobbySettings?.showClips || false}
                    onChange={(e) => updateLobbySettings({ showClips: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">Featured Clips</span>
                </label>
              </div>
              
              {/* Quick Setup */}
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => updateLobbySettings({
                    pollQuestion: "How many total matches will be played?",
                    pollOptions: ["Under 15", "15-20", "Over 20"]
                  })}
                  className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
                >
                  Set Default Poll
                </button>
                <button
                  onClick={() => updateLobbySettings({
                    featuredClips: ["Highlight Reel #1", "Highlight Reel #2", "Highlight Reel #3"]
                  })}
                  className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors"
                >
                  Set Default Clips
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preset Configurations */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Quick Presets</h4>
          <div className="flex space-x-3">
            <button
              onClick={async () => {
                try {
                  await updateDoc(doc(db, 'tournaments', id), {
                    'settings.autoProgress': true,
                    'settings.simulationMode': false,
                    updatedAt: new Date()
                  });
                  toggleOverlay(true);
                  toggleLobby(true);
                  setMessage('✅ Major tournament preset applied');
                } catch (e) {
                  setMessage('❌ Failed to apply preset');
                }
              }}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
            >
              🏆 Major Tournament
            </button>
            <button
              onClick={async () => {
                try {
                  await updateDoc(doc(db, 'tournaments', id), {
                    'settings.autoProgress': false,
                    'settings.simulationMode': true,
                    updatedAt: new Date()
                  });
                  toggleOverlay(false);
                  toggleLobby(false);
                  setMessage('✅ Small tournament preset applied');
                } catch (e) {
                  setMessage('❌ Failed to apply preset');
                }
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              🧪 Test Tournament
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Major Tournament: All features ON | Test Tournament: All features OFF
          </p>
        </div>
      </div>

      {message && (
        <div className={`text-sm ${message.startsWith('✅') ? 'text-green-700' : 'text-red-700'}`}>{message}</div>
      )}
    </div>
  );
}


