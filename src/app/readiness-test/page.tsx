"use client";

import { useState, useEffect } from "react";
import { 
  FaCheck, 
  FaTimes, 
  FaClock, 
  FaCircle, 
  FaSearch, 
  FaTrophy, 
  FaExclamationTriangle, 
  FaTools, 
  FaRocket, 
  FaSeedling, 
  FaUser, 
  FaCircle as FaCircleGreen, 
  FaGamepad, 
  FaLock, 
  FaClipboardList, 
  FaBook 
} from "react-icons/fa";
import { doc, getDoc } from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { db, rtdb } from "@/lib/firebaseClient";
import { Profile } from "@/types/profile";
import { Tournament, League } from "@/types/events";
import { seedTestData } from "@/utils/seedTestData";

interface CheckResult {
  status: "pending" | "success" | "error";
  message: string;
  details?: string;
}

interface SystemChecks {
  profiles: CheckResult;
  presence: CheckResult;
  tournaments: CheckResult;
  leagues: CheckResult;
  matches: CheckResult;
}

export default function ReadinessTestPage() {
  // Test configuration
  const [testUserId, setTestUserId] = useState<string>("");
  const [testTournamentId, setTestTournamentId] = useState<string>("");
  const [testLeagueId, setTestLeagueId] = useState<string>("");

  // System check results
  const [checks, setChecks] = useState<SystemChecks>({
    profiles: { status: "pending", message: "Not tested" },
    presence: { status: "pending", message: "Not tested" },
    tournaments: { status: "pending", message: "Not tested" },
    leagues: { status: "pending", message: "Not tested" },
    matches: { status: "pending", message: "Not tested" },
  });

  // Loading state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [presenceUnsubscribe, setPresenceUnsubscribe] = useState<(() => void) | null>(null);
  const [message, setMessage] = useState<string>("");

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // Update a specific check result
  const updateCheck = (
    checkName: keyof SystemChecks, 
    status: CheckResult["status"], 
    message: string, 
    details?: string
  ) => {
    setChecks(prev => ({
      ...prev,
      [checkName]: { status, message, details }
    }));
  };

  // Check Profiles (Firestore)
  const checkProfiles = async () => {
    if (!testUserId.trim()) {
      updateCheck("profiles", "error", "No User ID provided");
      return;
    }

    try {
      updateCheck("profiles", "pending", "Checking...");
      const profileRef = doc(db, "users", testUserId);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const profile = profileSnap.data() as Profile;
        updateCheck("profiles", "success", "Connected", `Found: ${profile.username || "Unknown"}`);
      } else {
        updateCheck("profiles", "error", "Profile not found", `No profile exists for ID: ${testUserId}`);
      }
    } catch (error) {
      console.error("Profile check error:", error);
      updateCheck("profiles", "error", "Connection failed", error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Check Presence (Realtime Database)
  const checkPresence = () => {
    if (!testUserId.trim()) {
      updateCheck("presence", "error", "No User ID provided");
      return;
    }

    // Cleanup existing subscription
    if (presenceUnsubscribe) {
      presenceUnsubscribe();
    }

    try {
      updateCheck("presence", "pending", "Listening...");
      const presenceRef = ref(rtdb, `presence/${testUserId}`);
      
      const unsubscribe = onValue(presenceRef, (snapshot) => {
        if (snapshot.exists()) {
          const presenceData = snapshot.val();
          const state = presenceData.state || "offline";
          const lastChanged = presenceData.lastChanged ? new Date(presenceData.lastChanged).toLocaleString() : "Unknown";
          updateCheck("presence", "success", "Connected", `Status: ${state}, Last: ${lastChanged}`);
        } else {
          updateCheck("presence", "error", "No presence data", `No presence found for ID: ${testUserId}`);
        }
      }, (error) => {
        console.error("Presence check error:", error);
        updateCheck("presence", "error", "Connection failed", error.message);
      });

      setPresenceUnsubscribe(() => unsubscribe);
    } catch (error) {
      console.error("Presence setup error:", error);
      updateCheck("presence", "error", "Setup failed", error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Check Tournaments (Firestore)
  const checkTournaments = async () => {
    if (!testTournamentId.trim()) {
      updateCheck("tournaments", "error", "No Tournament ID provided");
      return;
    }

    try {
      updateCheck("tournaments", "pending", "Checking...");
      const tournamentRef = doc(db, "tournaments", testTournamentId);
      const tournamentSnap = await getDoc(tournamentRef);
      
      if (tournamentSnap.exists()) {
        const tournament = tournamentSnap.data() as Tournament;
        updateCheck("tournaments", "success", "Connected", `Found: ${tournament.name || "Unknown"} (${tournament.participants?.length || 0} participants)`);
      } else {
        updateCheck("tournaments", "error", "Tournament not found", `No tournament exists for ID: ${testTournamentId}`);
      }
    } catch (error) {
      console.error("Tournament check error:", error);
      updateCheck("tournaments", "error", "Connection failed", error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Check Leagues (Firestore)
  const checkLeagues = async () => {
    if (!testLeagueId.trim()) {
      updateCheck("leagues", "error", "No League ID provided");
      return;
    }

    try {
      updateCheck("leagues", "pending", "Checking...");
      const leagueRef = doc(db, "leagues", testLeagueId);
      const leagueSnap = await getDoc(leagueRef);
      
      if (leagueSnap.exists()) {
        const league = leagueSnap.data() as League;
        updateCheck("leagues", "success", "Connected", `Found: ${league.name || "Unknown"} (${league.participants?.length || 0} participants)`);
      } else {
        updateCheck("leagues", "error", "League not found", `No league exists for ID: ${testLeagueId}`);
      }
    } catch (error) {
      console.error("League check error:", error);
      updateCheck("leagues", "error", "Connection failed", error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Check Matches (Firestore - part of tournament)
  const checkMatches = async () => {
    if (!testTournamentId.trim()) {
      updateCheck("matches", "error", "No Tournament ID provided");
      return;
    }

    try {
      updateCheck("matches", "pending", "Checking...");
      const tournamentRef = doc(db, "tournaments", testTournamentId);
      const tournamentSnap = await getDoc(tournamentRef);
      
      if (tournamentSnap.exists()) {
        const tournament = tournamentSnap.data() as Tournament;
        // Check if tournament has bracket with matches
        const bracket = tournament.bracket || {};
        const hasMatches = bracket && Object.keys(bracket).length > 0;
        if (hasMatches) {
          updateCheck("matches", "success", "Connected", "Tournament has bracket structure");
        } else {
          updateCheck("matches", "success", "Connected", "No bracket structure yet");
        }
      } else {
        updateCheck("matches", "error", "Tournament not found", `Cannot check matches - tournament ${testTournamentId} doesn't exist`);
      }
    } catch (error) {
      console.error("Matches check error:", error);
      updateCheck("matches", "error", "Connection failed", error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Run all checks
  const runAllChecks = async () => {
    setIsRunning(true);
    
    // Run checks in parallel for Firestore, but handle presence separately for live updates
    await Promise.all([
      checkProfiles(),
      checkTournaments(), 
      checkLeagues(),
      checkMatches()
    ]);
    
    // Start presence subscription
    checkPresence();
    
    setIsRunning(false);
  };

  // Cleanup presence subscription on unmount
  useEffect(() => {
    return () => {
      if (presenceUnsubscribe) {
        presenceUnsubscribe();
      }
    };
  }, [presenceUnsubscribe]);

  // Get status icon and color
  const getStatusDisplay = (check: CheckResult) => {
    switch (check.status) {
      case "success":
        return { icon: <FaCheck className="w-5 h-5" />, color: "text-green-600 bg-green-50 border-green-200" };
      case "error":
        return { icon: <FaTimes className="w-5 h-5" />, color: "text-red-600 bg-red-50 border-red-200" };
      case "pending":
        return { icon: <FaClock className="w-5 h-5" />, color: "text-yellow-600 bg-yellow-50 border-yellow-200" };
      default:
        return { icon: <FaCircle className="w-5 h-5" />, color: "text-gray-600 bg-gray-50 border-gray-200" };
    }
  };

  // Check if all systems are ready
  const allSystemsReady = Object.values(checks).every(check => check.status === "success");
  const hasAnyErrors = Object.values(checks).some(check => check.status === "error");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <FaSearch className="inline mr-2" />CQG Readiness Test
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Flip Dev → Prod Rules when all checks are green.
          </p>
          
          {/* Overall Status */}
          {allSystemsReady && (
            <div className="inline-flex items-center px-4 py-2 bg-green-100 border border-green-200 rounded-lg text-green-800 font-medium">
              <FaTrophy className="inline mr-2" />All Systems Ready for Production!
            </div>
          )}
          {hasAnyErrors && !allSystemsReady && (
            <div className="inline-flex items-center px-4 py-2 bg-red-100 border border-red-200 rounded-lg text-red-800 font-medium">
              <FaExclamationTriangle className="inline mr-2" />Some Systems Need Attention
            </div>
          )}
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4"><FaTools className="inline mr-2" />Test Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test User ID</label>
              <input
                type="text"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                placeholder="user123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test Tournament ID</label>
              <input
                type="text"
                value={testTournamentId}
                onChange={(e) => setTestTournamentId(e.target.value)}
                placeholder="tournament123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test League ID</label>
              <input
                type="text"
                value={testLeagueId}
                onChange={(e) => setTestLeagueId(e.target.value)}
                placeholder="league123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={runAllChecks}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? "Running Checks..." : <><FaRocket className="mr-2" />Run All Checks</>}
            </button>
            <button
              onClick={async () => {
                try {
                  setIsRunning(true);
                  await seedTestData();
                  // Auto-fill the test IDs after seeding
                  setTestUserId("user123");
                  setTestTournamentId("tournament123");
                  setTestLeagueId("league123");
                  showMessage("Test data seeded! IDs auto-filled.");
                } catch (error) {
                  showMessage("Failed to seed test data", true);
                } finally {
                  setIsRunning(false);
                }
              }}
              disabled={isRunning}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <FaSeedling className="mr-2" />Seed Test Data
            </button>
          </div>
          
          {/* Message Display */}
          {message && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">{message}</p>
            </div>
          )}
        </div>

        {/* System Checks */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profiles Check */}
          <div className={`bg-white rounded-lg shadow-md border-2 p-6 ${getStatusDisplay(checks.profiles).color}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold"><FaUser className="inline mr-2" />Profiles</h3>
              <span className="text-2xl">{getStatusDisplay(checks.profiles).icon}</span>
            </div>
            <p className="text-sm font-medium mb-1">{checks.profiles.message}</p>
            {checks.profiles.details && (
              <p className="text-xs text-gray-600">{checks.profiles.details}</p>
            )}
            <div className="mt-3 text-xs text-gray-500">
              Firestore: /users/{testUserId}
            </div>
            <p className="text-xs text-green-600">
              Debug testUserId value: {testUserId ?? "no testUserId yet"}
            </p>
          </div>

          {/* Presence Check */}
          <div className={`bg-white rounded-lg shadow-md border-2 p-6 ${getStatusDisplay(checks.presence).color}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold"><FaCircleGreen className="inline mr-2 text-green-500" />Presence</h3>
              <span className="text-2xl">{getStatusDisplay(checks.presence).icon}</span>
            </div>
            <p className="text-sm font-medium mb-1">{checks.presence.message}</p>
            {checks.presence.details && (
              <p className="text-xs text-gray-600">{checks.presence.details}</p>
            )}
            <div className="mt-3 text-xs text-gray-500">
              Realtime DB: /presence/{testUserId}
            </div>
            <p className="text-xs text-green-600">
              Debug testUserId value: {testUserId ?? "no testUserId yet"}
            </p>
          </div>

          {/* Tournaments Check */}
          <div className={`bg-white rounded-lg shadow-md border-2 p-6 ${getStatusDisplay(checks.tournaments).color}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold"><FaTrophy className="inline mr-2" />Tournaments</h3>
              <span className="text-2xl">{getStatusDisplay(checks.tournaments).icon}</span>
            </div>
            <p className="text-sm font-medium mb-1">{checks.tournaments.message}</p>
            {checks.tournaments.details && (
              <p className="text-xs text-gray-600">{checks.tournaments.details}</p>
            )}
            <div className="mt-3 text-xs text-gray-500">
              Firestore: /tournaments/{testTournamentId}
            </div>
            <p className="text-xs text-green-600">
              Debug testTournamentId value: {testTournamentId ?? "no testTournamentId yet"}
            </p>
          </div>

          {/* Leagues Check */}
          <div className={`bg-white rounded-lg shadow-md border-2 p-6 ${getStatusDisplay(checks.leagues).color}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">🏅 Leagues</h3>
              <span className="text-2xl">{getStatusDisplay(checks.leagues).icon}</span>
            </div>
            <p className="text-sm font-medium mb-1">{checks.leagues.message}</p>
            {checks.leagues.details && (
              <p className="text-xs text-gray-600">{checks.leagues.details}</p>
            )}
            <div className="mt-3 text-xs text-gray-500">
              Firestore: /leagues/{testLeagueId}
            </div>
            <p className="text-xs text-green-600">
              Debug testLeagueId value: {testLeagueId ?? "no testLeagueId yet"}
            </p>
          </div>

          {/* Matches Check */}
          <div className={`bg-white rounded-lg shadow-md border-2 p-6 ${getStatusDisplay(checks.matches).color}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold"><FaGamepad className="inline mr-2" />Matches</h3>
              <span className="text-2xl">{getStatusDisplay(checks.matches).icon}</span>
            </div>
            <p className="text-sm font-medium mb-1">{checks.matches.message}</p>
            {checks.matches.details && (
              <p className="text-xs text-gray-600">{checks.matches.details}</p>
            )}
            <div className="mt-3 text-xs text-gray-500">
              Firestore: /tournaments/{testTournamentId}.matches[]
            </div>
            <p className="text-xs text-green-600">
              Debug testTournamentId value: {testTournamentId ?? "no testTournamentId yet"}
            </p>
          </div>

          {/* Rules Deployment Status */}
          <div className="bg-white rounded-lg shadow-md border-2 p-6 border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-blue-800"><FaLock className="inline mr-2" />Rules Status</h3>
              <FaClipboardList className="text-2xl" />
            </div>
            <p className="text-sm font-medium mb-1 text-blue-800">Ready for Deployment</p>
            <p className="text-xs text-blue-600 mb-3">
              When all checks are green, deploy production rules.
            </p>
            <div className="space-y-1 text-xs text-blue-600">
              <div>Dev: pnpm deploy:rules:dev</div>
              <div>Prod: pnpm deploy:rules:prod</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4"><FaBook className="inline mr-2" />Instructions</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <span className="font-medium">1. Enter Test IDs:</span> Provide existing User, Tournament, and League IDs from your database.
            </div>
            <div>
              <span className="font-medium">2. Run Checks:</span> Click &quot;Run All Checks&quot; to verify all systems.
            </div>
            <div>
              <span className="font-medium">3. Fix Issues:</span> Address any ❌ errors before proceeding.
            </div>
            <div>
              <span className="font-medium">4. Deploy Rules:</span> When all ✅ green, run <code className="bg-gray-100 px-1 rounded">pnpm deploy:rules:prod</code>
            </div>
            <div>
              <span className="font-medium">5. Live Updates:</span> Presence status updates in real-time as users come online/offline.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
