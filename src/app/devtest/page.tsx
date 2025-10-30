"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import MatchResultForm from "@/components/MatchResultForm";
import { useToast } from "@/components/Toast";

// Helper to run master test harness
async function runMasterTestHarness(keepData: boolean = false, stressTest: boolean = false) {
  try {
    const response = await fetch('/api/test-harness', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keepData, stressTest })
    });
    if (response.ok) {
      const result = await response.json();
      return { 
        success: true, 
        message: result.message || "Master test harness completed successfully",
        output: result.output || "",
        tournamentIds: result.tournamentIds || []
      };
    } else {
      return { success: false, message: "Master test harness failed" };
    }
  } catch (error) {
    return { success: false, message: `Test harness error: ${error}` };
  }
}

// Helper to run seeding script
async function runSeedingScript() {
  try {
    const response = await fetch('/api/seed', { method: 'POST' });
    if (response.ok) {
      return { success: true, message: "Seeding completed successfully" };
    } else {
      return { success: false, message: "Seeding failed" };
    }
  } catch (error) {
    return { success: false, message: `Seeding error: ${error}` };
  }
}

// Helper to reset data
async function resetData() {
  try {
    const response = await fetch('/api/reset', { method: 'POST' });
    if (response.ok) {
      return { success: true, message: "Data reset completed" };
    } else {
      return { success: false, message: "Reset failed" };
    }
  } catch (error) {
    return { success: false, message: `Reset error: ${error}` };
  }
}

// Helper for quick emulator reset
async function quickResetEmulator() {
  try {
    const response = await fetch('/api/reset', { method: 'POST' });
    if (response.ok) {
      return { success: true, message: "🧹 Emulator reset complete." };
    } else {
      return { success: false, message: "Reset failed" };
    }
  } catch (error) {
    return { success: false, message: `Reset error: ${error}` };
  }
}

export default function DevTestPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [keepData, setKeepData] = useState<boolean>(false);
  const [stressTest, setStressTest] = useState<boolean>(false);
  const [seedSummary, setSeedSummary] = useState<{tournamentIds: string[], playerCount: number, bracketSize: string} | null>(null);
  const { showToast, ToastContainer } = useToast();

  // Add to action log
  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActionLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  // Load keepData preference from localStorage
  useEffect(() => {
    const savedKeepData = localStorage.getItem('devtest-keep-data');
    if (savedKeepData !== null) {
      setKeepData(JSON.parse(savedKeepData));
    }
    
    const savedStressTest = localStorage.getItem('devtest-stress-test');
    if (savedStressTest !== null) {
      setStressTest(JSON.parse(savedStressTest));
    }
  }, []);

  // Save keepData preference to localStorage
  const handleKeepDataToggle = (checked: boolean) => {
    setKeepData(checked);
    localStorage.setItem('devtest-keep-data', JSON.stringify(checked));
    localStorage.setItem('keepData', checked.toString()); // Also set the key that tournaments page expects
    addToLog(`Keep Data setting changed: ${checked ? 'Enabled' : 'Disabled'}`);
    
    // Dispatch custom event to notify other pages
    window.dispatchEvent(new CustomEvent('keepDataChanged'));
  };

  // Save stress test preference to localStorage
  const handleStressTestToggle = (checked: boolean) => {
    setStressTest(checked);
    localStorage.setItem('devtest-stress-test', JSON.stringify(checked));
    addToLog(`Stress Test Mode changed: ${checked ? 'Enabled' : 'Disabled'}`);
  };

  // Quick reset emulator
  const handleQuickReset = async () => {
    addToLog("Starting quick emulator reset...");
    const result = await quickResetEmulator();
    addToLog(result.message);
    
    if (result.success) {
      // Clear seed summary
      setSeedSummary(null);
      // Reload data
      window.location.reload();
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load tournaments
        const tournamentsSnap = await getDocs(collection(db, "tournaments"));
        const tournamentsData = tournamentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTournaments(tournamentsData);

        // Load players
        const playersSnap = await getDocs(collection(db, "players"));
        const playersData = playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPlayers(playersData);

        // Load matches from first tournament if available
        if (tournamentsData.length > 0) {
          const firstTournament = tournamentsData[0];
          setSelectedTournament(firstTournament.id);
          const matchesSnap = await getDocs(collection(db, "tournaments", firstTournament.id, "matches"));
          const matchesData = matchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMatches(matchesData);
        }

        setLoading(false);
        addToLog("Data loaded successfully");
      } catch (error) {
        console.error("Error loading data:", error);
        addToLog(`Error loading data: ${error}`);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Real-time listeners
  useEffect(() => {
    if (!selectedTournament) return;

    const unsubscribe = onSnapshot(
      collection(db, "tournaments", selectedTournament, "matches"),
      (snapshot) => {
        const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMatches(matchesData);
      }
    );

    return () => unsubscribe();
  }, [selectedTournament]);

  const handleMasterTestHarness = async () => {
    addToLog(`Starting master test harness (Keep Data: ${keepData ? 'Yes' : 'No'}, Stress Test: ${stressTest ? 'Yes' : 'No'})...`);
    
    // Show warning toast if KEEP_DATA is true
    if (keepData) {
      showToast("⚠️ Keep Data Mode is ON — new tournaments will be seeded with unique IDs.", "warning", 6000);
    }
    
    const result = await runMasterTestHarness(keepData, stressTest);
    addToLog(result.message);
    
    // Update seed summary if successful
    if (result.success && result.tournamentIds) {
      const tournamentCount = result.tournamentIds.length;
      const bracketSize = tournamentCount === 1 ? "Round of 16" : `${tournamentCount} tournaments`;
      setSeedSummary({
        tournamentIds: result.tournamentIds,
        playerCount: 16,
        bracketSize: bracketSize
      });
      
      // Add seed summary to log
      const summaryMessage = tournamentCount === 1 
        ? `✅ Seeded tournament \`${result.tournamentIds[0]}\` with 16 players (Round of 16).`
        : `✅ Seeded ${tournamentCount} tournaments (${result.tournamentIds.join(', ')}) with 16 players each.`;
      addToLog(summaryMessage);
    }
    
    // Add final cleanup status line
    if (result.success) {
      const tournamentList = result.tournamentIds?.length > 0 
        ? result.tournamentIds.map(id => `\`${id}\``).join(', ')
        : 'none';
      
      const cleanupStatus = keepData 
        ? `📦 Keep Data ON — Seeded ${tournamentList}, Cleanup skipped.`
        : `🧹 Cleanup complete — Seeded ${tournamentList}, test data wiped.`;
      addToLog(cleanupStatus);
    }
    
    if (result.success) {
      // Reload data
      window.location.reload();
    }
  };

  const handleSeedData = async () => {
    addToLog("Starting data seeding...");
    const result = await runSeedingScript();
    addToLog(result.message);
    
    if (result.success) {
      // Reload data
      window.location.reload();
    }
  };

  const handleResetData = async () => {
    if (!confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      return;
    }
    
    addToLog("Starting data reset...");
    const result = await resetData();
    addToLog(result.message);
    
    if (result.success) {
      // Reload data
      window.location.reload();
    }
  };

  const handleCompleteMatch = async (matchId: string) => {
    if (!selectedTournament) return;
    
    try {
      const matchRef = doc(db, "tournaments", selectedTournament, "matches", matchId);
      await updateDoc(matchRef, {
        status: "completed",
        scoreA: Math.floor(Math.random() * 11) + 5,
        scoreB: Math.floor(Math.random() * 11) + 5,
        winner: Math.random() > 0.5 ? "player1" : "player2",
        submittedAt: serverTimestamp(),
        reportedBy: "devtest"
      });
      addToLog(`Match ${matchId} completed`);
    } catch (error) {
      addToLog(`Error completing match: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading dev test environment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🧪 Dev Test Environment</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
          <strong>Warning:</strong> This is a development environment. Changes made here affect the test database.
        </div>
        
        {/* Cleanup Status */}
        <div className={`px-4 py-2 rounded mb-4 ${keepData ? 'bg-blue-100 border border-blue-400 text-blue-800' : 'bg-green-100 border border-green-400 text-green-800'}`}>
          {keepData ? '📦 Keep Data: On' : '🧹 Cleanup: Enabled'}
          <span className="text-sm ml-2">
            {keepData ? 'Test data will be preserved after dry runs' : 'Test data will be cleaned up after dry runs'}
          </span>
        </div>
      </div>

      {/* Test Configuration */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">🧪 Test Configuration</h3>
            <p className="text-sm text-gray-600">Configure test behavior and data handling</p>
          </div>
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={keepData}
                onChange={(e) => handleKeepDataToggle(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Keep Data After Dry Run</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stressTest}
                onChange={(e) => handleStressTestToggle(e.target.checked)}
                className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-medium">Stress Test Mode</span>
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <button
          onClick={handleMasterTestHarness}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold"
        >
          🚀 Master Test Harness
        </button>
        <button
          onClick={handleSeedData}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          🌱 Seed Test Data
        </button>
        <button
          onClick={handleQuickReset}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          🧹 Reset Emulator
        </button>
        <button
          onClick={handleResetData}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          🗑️ Reset Data
        </button>
        <Link
          href="/tournaments"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
        >
          🏆 View Tournaments
        </Link>
        <Link
          href="/players"
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-center"
        >
          👥 View Players
        </Link>
      </div>

      {/* Seed Summary Panel */}
      {seedSummary && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">📊 Seed Summary</h3>
          <div className="text-sm text-green-700">
            <p><strong>Tournament ID(s):</strong> {seedSummary.tournamentIds.map(id => `\`${id}\``).join(', ')}</p>
            <p><strong>Players Seeded:</strong> {seedSummary.playerCount}</p>
            <p><strong>Bracket Size:</strong> {seedSummary.bracketSize}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Data Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tournaments */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">🏆 Seeded Tournaments ({tournaments.length})</h2>
            {tournaments.length === 0 ? (
              <p className="text-gray-500">No tournaments found. Click "Seed Test Data" to create some.</p>
            ) : (
              <div className="space-y-3">
                {tournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTournament === tournament.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTournament(tournament.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{tournament.name}</h3>
                        <p className="text-sm text-gray-600">
                          {tournament.game} • {tournament.status} • {tournament.maxPlayers || 16} players
                        </p>
                        {tournament.entryFee > 0 && (
                          <p className="text-sm text-green-600">Entry Fee: ${tournament.entryFee / 100}</p>
                        )}
                      </div>
                      <Link
                        href={`/tournaments/${tournament.id}`}
                        className="text-blue-600 hover:underline text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Bracket →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Players */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">👥 Players ({players.length})</h2>
            {players.length === 0 ? (
              <p className="text-gray-500">No players found.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {players.slice(0, 12).map((player) => (
                  <div key={player.id} className="p-3 border rounded-lg text-center">
                    <div className="font-medium text-sm">{player.displayName || player.name}</div>
                    <div className="text-xs text-gray-500">Seed #{player.seed}</div>
                    <Link
                      href={`/profile/${player.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View Profile
                    </Link>
                  </div>
                ))}
                {players.length > 12 && (
                  <div className="p-3 border rounded-lg text-center text-gray-500">
                    +{players.length - 12} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Matches */}
          {selectedTournament && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">🎮 Matches ({matches.length})</h2>
              {matches.length === 0 ? (
                <p className="text-gray-500">No matches found for this tournament.</p>
              ) : (
                <div className="space-y-3">
                  {matches.slice(0, 5).map((match) => (
                    <div key={match.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">Round {match.round || 1}</h4>
                          <p className="text-sm text-gray-600">
                            {match.playerA || "Player A"} vs {match.playerB || "Player B"}
                          </p>
                          <p className="text-xs text-gray-500">Status: {match.status || "pending"}</p>
                        </div>
                        <div className="flex gap-2">
                          {match.status !== "completed" && (
                            <button
                              onClick={() => handleCompleteMatch(match.id)}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Complete
                            </button>
                          )}
                          <Link
                            href={`/tournaments/${selectedTournament}/matches/${match.id}`}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                      
                      {/* Match Submission Form */}
                      {match.status === "live" && (
                        <div className="mt-3 pt-3 border-t">
                          <MatchResultForm 
                            tournamentId={selectedTournament} 
                            match={match}
                            tournament={tournaments.find(t => t.id === selectedTournament)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  {matches.length > 5 && (
                    <p className="text-center text-gray-500 text-sm">
                      +{matches.length - 5} more matches
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Activity Log */}
        <div className="bg-white p-6 rounded-lg shadow">
          <details open className="mb-4">
            <summary className="text-xl font-bold cursor-pointer hover:text-blue-600">
              📝 Live Activity Log ({actionLog.length})
            </summary>
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              {actionLog.length === 0 ? (
                <p className="text-gray-500 text-sm">No activity yet.</p>
              ) : (
                actionLog.map((log, index) => {
                  const isCleanupStatus = log.includes('🧹 Cleanup complete') || log.includes('📦 Keep Data ON');
                  return (
                    <div 
                      key={index} 
                      className={`text-sm font-mono p-2 rounded ${
                        isCleanupStatus 
                          ? 'bg-blue-100 border border-blue-300 text-blue-800 font-semibold' 
                          : 'bg-gray-100'
                      }`}
                    >
                      {log}
                    </div>
                  );
                })
              )}
            </div>
          </details>
        </div>
      </div>
      
      {/* Toast Container */}
      {ToastContainer}
    </div>
  );
}
