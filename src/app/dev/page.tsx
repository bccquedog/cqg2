"use client";

import { useEffect, useRef, useState } from "react";
import TournamentRegistration from "@/components/TournamentRegistration";
import TournamentCheckIn from "@/components/TournamentCheckIn";
import AdminGenerateMatches from "@/components/AdminGenerateMatches";
import MatchSubmission from "@/components/MatchSubmission";
import AdminMatchValidation from "@/components/AdminMatchValidation";
import TournamentBracket from "@/components/TournamentBracket";
import TournamentWinner from "@/components/TournamentWinner";
import MatchOverlay from "@/components/Overlay/MatchOverlay";
import { db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  setDoc,
  collectionGroup
} from "firebase/firestore";

function JsonViewer({ name, value }: { name: string; value: any }) {
  const [open, setOpen] = useState(true);
  if (value === null || typeof value !== "object") {
    return (
      <div>
        <span className="text-gray-600">{name}:</span> <span>{JSON.stringify(value)}</span>
      </div>
    );
  }
  const entries = Object.entries(value);
  return (
    <div className="mb-1">
      <button className="text-blue-600 text-xs mr-2" onClick={() => setOpen(!open)}>
        {open ? "▾" : "▸"}
      </button>
      <span className="text-gray-700 font-semibold">{name}</span>
      {open && (
        <div className="ml-4 border-l pl-3">
          {entries.map(([k, v]) => (
            <JsonViewer key={k} name={k} value={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuickSubmissionForm({ tournamentId, matches, onSubmitted, simulateLatency }: { tournamentId: string; matches: any[]; onSubmitted: (mid: string, winner: string) => void; simulateLatency: boolean }) {
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [winnerChoice, setWinnerChoice] = useState<"A" | "B" | "">("");
  const [busy, setBusy] = useState(false);
  const selected = matches.find(m => m.id === selectedMatchId);
  const playerA = selected?.playerA || "PlayerA";
  const playerB = selected?.playerB || "PlayerB";

  const doDelay = async () => {
    if (simulateLatency) await new Promise(r => setTimeout(r, 2000));
  };

  const submit = async () => {
    if (!selectedMatchId || !winnerChoice) return;
    setBusy(true);
    try {
      const winId = winnerChoice === "A" ? playerA : playerB;
      const matchRef = doc(db, "tournaments", tournamentId, "matches", selectedMatchId);
      await doDelay();
      await updateDoc(matchRef, { status: "completed", winner: winId, winnerId: winId });
      onSubmitted(selectedMatchId, winId);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end gap-3">
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Match</label>
        <select className="w-full border rounded p-2 text-sm" value={selectedMatchId} onChange={(e) => setSelectedMatchId(e.target.value)}>
          <option value="">Select a match…</option>
          {matches.map(m => (
            <option key={m.id} value={m.id}>R{m.round || m.roundNumber} • M{m.matchNumber || m.id.slice(-4)} — {m.playerA || "TBD"} vs {m.playerB || "TBD"}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Winner</label>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-1">
            <input type="radio" name="winner" value="A" checked={winnerChoice === "A"} onChange={() => setWinnerChoice("A")} />
            <span>{playerA}</span>
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name="winner" value="B" checked={winnerChoice === "B"} onChange={() => setWinnerChoice("B")} />
            <span>{playerB}</span>
          </label>
        </div>
      </div>
      <div>
        <button
          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50"
          disabled={!selectedMatchId || !winnerChoice || busy}
          onClick={submit}
        >
          {busy ? "Submitting…" : "Submit Result"}
        </button>
      </div>
    </div>
  );
}

export default function DevTestPage() {
  const tournamentId = "tourney1"; // seeded tournament
  const [playerCount, setPlayerCount] = useState<number>(8); // default = 8
  const [tournament, setTournament] = useState<any | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [openEventSim, setOpenEventSim] = useState(true);
  const [openErrorTool, setOpenErrorTool] = useState(true);
  const [openLatencyTool, setOpenLatencyTool] = useState(true);
  const [openQuickSubmit, setOpenQuickSubmit] = useState(true);
  const [openInspector, setOpenInspector] = useState(true);
  const [openSnapshots, setOpenSnapshots] = useState(true);
  const [simulateLatency, setSimulateLatency] = useState(false);
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [liveMatchId, setLiveMatchId] = useState<string | null>(null);
  const [openBracketDebug, setOpenBracketDebug] = useState(true);
  const [openPlayerRandomizer, setOpenPlayerRandomizer] = useState(true);
  const [openForceState, setOpenForceState] = useState(true);
  // Live Logs
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const addLog = (msg: string) => {
    const now = new Date();
    const ts = now.toLocaleTimeString([], { hour12: false });
    setLogs((prev) => {
      const next = [...prev, `[${ts}] ${msg}`];
      return next.slice(-100);
    });
  };
  useEffect(() => {
    if (logRef.current && !isPaused) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const exportLogs = () => {
    const content = logs.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    a.href = url;
    a.download = `cqg-dev-logs-${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const clearLogs = () => setLogs([]);

  // Generate fake players dynamically
  const testPlayers = Array.from({ length: playerCount }, (_, i) => `player${i + 1}`);
  const playerId = "player1"; // active test user

  // Real-time tournament listener
  useEffect(() => {
    const tourneyRef = doc(db, "tournaments", tournamentId);
    const unsubscribe = onSnapshot(tourneyRef, (snapshot) => {
      if (snapshot.exists()) {
        setTournament({ id: snapshot.id, ...snapshot.data() });
        addLog("Tournament document updated");
      }
    });
    return () => unsubscribe();
  }, [tournamentId]);

  // Real-time matches listener
  useEffect(() => {
    const matchesRef = collection(db, "tournaments", tournamentId, "matches");
    const unsubscribe = onSnapshot(matchesRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMatches(data);
      if (selectedMatch) {
        const updated = data.find((m) => m.id === selectedMatch.id);
        if (updated) setSelectedMatch(updated);
      }
      const live = data.find((m: any) => (m.status || "").toLowerCase() === "live");
      setLiveMatchId(live ? live.id : null);
    });
    return () => unsubscribe();
  }, [tournamentId, selectedMatch]);

  // Global match change logs via collectionGroup listener
  useEffect(() => {
    const unsub = onSnapshot(collectionGroup(db, "matches"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data: any = change.doc.data();
        const path = change.doc.ref.path; // tournaments/{tid}/matches/{mid}
        const parts = path.split("/");
        const tid = parts.length >= 2 ? parts[1] : "unknown";
        const matchNum = data.matchNumber || change.doc.id.slice(-4);
        if (change.type === "modified" && (data.status === "completed" || data.status === "Completed") && data.winner) {
          addLog(`Match ${matchNum} completed (tournament ${tid}). Winner: ${data.winner}.`);
        }
        if (change.type === "added") {
          const rn = data.roundNumber || data.round;
          if (rn && rn > 1) {
            addLog(`Round advanced → Round ${rn} match created (tournament ${tid}).`);
          }
        }
      });
    });
    return () => unsub();
  }, []);

  // Quick Fill
  const quickFill = async () => {
    const tourneyRef = doc(db, "tournaments", tournamentId);
    await maybeDelay();
    await updateDoc(tourneyRef, {
      players: testPlayers,
      checkIns: testPlayers,
      status: "setup",
      winner: null
    });
  };

  // Force Complete a Match (Bracket Debug)
  const forceCompleteMatch = async (m: any) => {
    try {
      const winner = Math.random() < 0.5 ? (m.playerA || "PlayerA") : (m.playerB || "PlayerB");
      const matchRef = doc(db, "tournaments", tournamentId, "matches", m.id);
      await maybeDelay();
      await updateDoc(matchRef, {
        winner,
        status: "completed"
      });
      addLog(`Force completed match ${m.matchNumber || m.id.slice(-4)}. Winner: ${winner}`);
    } catch (e) {
      console.error(e);
      addLog(`Error force completing match ${m.id}: ${(e as any)?.message || e}`);
    }
  };

  // Player Randomizer: Shuffle Seeds
  const shufflePlayers = async () => {
    try {
      const playersRef = collection(db, "tournaments", tournamentId, "players");
      const snap = await getDocs(playersRef);
      const players = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      if (players.length === 0) {
        addLog("Shuffle skipped: no players found.");
        return;
      }
      // Shuffle array
      const shuffled = [...players].sort(() => 0.5 - Math.random());
      // Reassign seeds 1..N
      await Promise.all(shuffled.map(async (p, idx) => {
        await maybeDelay();
        return updateDoc(doc(db, "tournaments", tournamentId, "players", p.id), { seed: idx + 1 });
      }));
      addLog(`Seeds shuffled → ${shuffled.map(p => `${p.name || p.id}(#${(shuffled.indexOf(p) + 1)})`).join(", ")}`);
    } catch (e) {
      console.error(e);
      addLog(`Error shuffling seeds: ${(e as any)?.message || e}`);
    }
  };

  // Force State Switcher
  const setTournamentStatus = async (status: string) => {
    try {
      if (process.env.NODE_ENV === "production") {
        addLog("Blocked status change in production mode.");
        return;
      }
      const tourneyRef = doc(db, "tournaments", tournamentId);
      await maybeDelay();
      await updateDoc(tourneyRef, { status });
      addLog(`Tournament status set → ${status}`);
    } catch (e) {
      console.error(e);
      addLog(`Error setting status: ${(e as any)?.message || e}`);
    }
  };

  // Quick Reset
  const quickReset = async () => {
    const tourneyRef = doc(db, "tournaments", tournamentId);
    await maybeDelay();
    await updateDoc(tourneyRef, {
      players: [],
      checkIns: [],
      status: "setup",
      winner: null
    });

    const matchesRef = collection(db, "tournaments", tournamentId, "matches");
    const snapshot = await getDocs(matchesRef);
    await maybeDelay();
    const deletes = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletes);

    setSelectedMatch(null);
  };

  // Latency helper
  async function maybeDelay() {
    if (simulateLatency) {
      addLog("Latency: 2s simulated delay");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Multi-round Quick Simulate
  const quickSimulate = async () => {
    const tourneyRef = doc(db, "tournaments", tournamentId);

    // Reset tournament
    await updateDoc(tourneyRef, {
      players: testPlayers,
      checkIns: testPlayers,
      status: "setup",
      winner: null
    });

    // Clear old matches
    const matchesRef = collection(db, "tournaments", tournamentId, "matches");
    const oldMatches = await getDocs(matchesRef);
    await Promise.all(oldMatches.docs.map((docSnap) => deleteDoc(docSnap.ref)));

    // Recursive simulation
    let roundPlayers = [...testPlayers];
    let round = 1;

    while (roundPlayers.length > 1) {
      // Shuffle players for this round
      const shuffled = [...roundPlayers].sort(() => 0.5 - Math.random());
      const nextRoundPlayers = [];

      // Create matches for this round
      for (let i = 0; i < shuffled.length; i += 2) {
        const playerA = shuffled[i];
        const playerB = shuffled[i + 1] || null;

        const matchRef = doc(matchesRef);
        const scoreA = Math.floor(Math.random() * 10);
        const scoreB = playerB ? Math.floor(Math.random() * 10) : 0;
        const winner = !playerB ? playerA : scoreA >= scoreB ? playerA : playerB;

        await setDoc(matchRef, {
          playerA,
          playerB,
          status: "completed",
          score: { [playerA]: scoreA, [playerB]: scoreB },
          winner,
          round,
          validatedAt: new Date()
        });

        nextRoundPlayers.push(winner);
      }

      roundPlayers = nextRoundPlayers;
      round++;
    }

    // Set final winner
    if (roundPlayers.length === 1) {
      await updateDoc(tourneyRef, {
        winner: roundPlayers[0],
        status: "completed"
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">🏆 CQG Tournament Dev Test</h1>
        <a
          href="/docs/cqg-roadmap.md"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => addLog("Roadmap opened in new tab")}
          className="bg-gray-800 hover:bg-gray-700 text-white rounded-md px-3 py-1 text-sm"
        >
          📑 View Roadmap
        </a>
      </div>

      {/* Admin Tools */}
      <section className="border p-4 rounded-xl bg-white shadow-md">
        <h2 className="text-xl font-semibold mb-2">Admin Tools</h2>
        <div className="flex items-center gap-3">
          <ResetAndReseedButton onLog={addLog} />
          <button
            className={`px-3 py-2 rounded text-sm ${showOverlay ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-800"}`}
            onClick={() => setShowOverlay(!showOverlay)}
          >
            {showOverlay ? "Hide Overlay" : "Show Overlay"}
          </button>
        </div>
      </section>

      {/* ⚡ Simulation Tools */}
      <section className="border p-4 rounded-xl bg-white shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">⚡ Simulation Tools</h2>
        </div>

        {/* Event Trigger Simulator */}
        <div className="border rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Event Trigger Simulator</h3>
            <button className="text-sm text-blue-600" onClick={() => setOpenEventSim(!openEventSim)}>
              {openEventSim ? "Hide" : "Show"}
            </button>
          </div>
          {openEventSim && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                onClick={async () => { await setTournamentStatus("live"); addLog("Event: Start Tournament"); }}
              >
                Start Tournament
              </button>
              <button
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
                onClick={() => { addLog("Event: Advance Round"); /* No-op placeholder for real logic */ }}
              >
                Advance Round
              </button>
              <button
                className="px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm"
                onClick={async () => { await setTournamentStatus("completed"); addLog("Event: Complete Tournament"); }}
              >
                Complete Tournament
              </button>
            </div>
          )}
        </div>

        {/* Error Injector */}
        <div className="border rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Error Injector</h3>
            <button className="text-sm text-blue-600" onClick={() => setOpenErrorTool(!openErrorTool)}>
              {openErrorTool ? "Hide" : "Show"}
            </button>
          </div>
          {openErrorTool && (
            <div className="mt-3">
              <button
                className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm"
                onClick={() => {
                  setShowErrorBanner(true);
                  addLog("Injected error at runtime");
                  setTimeout(() => setShowErrorBanner(false), 5000);
                }}
              >
                Inject Error
              </button>
              {showErrorBanner && (
                <div className="mt-3 p-3 rounded bg-red-100 border border-red-300 text-red-800 text-sm">
                  Simulated Error: Something went wrong. This banner will auto-dismiss.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Latency Simulator */}
        <div className="border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Latency Simulator</h3>
            <button className="text-sm text-blue-600" onClick={() => setOpenLatencyTool(!openLatencyTool)}>
              {openLatencyTool ? "Hide" : "Show"}
            </button>
          </div>
          {openLatencyTool && (
            <div className="mt-3 flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={simulateLatency}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setSimulateLatency(val);
                    addLog(val ? "Latency simulation enabled" : "Latency simulation disabled");
                  }}
                />
                Simulate Latency (2s)
              </label>
            </div>
          )}
        </div>
      </section>

      {/* 📝 Quick Submission Panel */}
      <section className="border p-4 rounded-xl bg-white shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">📝 Quick Submission</h2>
          <button className="text-sm text-blue-600" onClick={() => setOpenQuickSubmit(!openQuickSubmit)}>
            {openQuickSubmit ? "Hide" : "Show"}
          </button>
        </div>
        {openQuickSubmit && (
          <QuickSubmissionForm
            tournamentId={tournamentId}
            matches={matches}
            onSubmitted={(mid: string, winner: string) => {
              setToast(`Match ${mid} completed with winner ${winner}`);
              addLog(`Quick submission → Match ${mid} winner: ${winner}`);
              setTimeout(() => setToast(null), 2500);
            }}
            simulateLatency={simulateLatency}
          />
        )}
      </section>

      {/* 🛠️ Firestore Inspector */}
      <section className="border p-4 rounded-xl bg-white shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">🛠️ Firestore Inspector</h2>
          <button className="text-sm text-blue-600" onClick={() => setOpenInspector(!openInspector)}>
            {openInspector ? "Hide" : "Show"}
          </button>
        </div>
        {openInspector && (
          <div className="bg-gray-50 border rounded p-3 max-h-80 overflow-auto text-xs">
            {tournament ? (
              <JsonViewer name="tournament" value={tournament} />
            ) : (
              <div className="text-gray-500">No tournament loaded.</div>
            )}
          </div>
        )}
      </section>

      {/* 💾 Test Data Snapshots */}
      <section className="border p-4 rounded-xl bg-white shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">💾 Test Data Snapshots</h2>
          <button className="text-sm text-blue-600" onClick={() => setOpenSnapshots(!openSnapshots)}>
            {openSnapshots ? "Hide" : "Show"}
          </button>
        </div>
        {openSnapshots && (
          <div className="flex flex-wrap gap-2 items-center">
            <button
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
              onClick={async () => {
                // Build snapshot of tournament + players + matches
                try {
                  if (!tournament) return;
                  const playersSnap = await getDocs(collection(db, "tournaments", tournamentId, "players"));
                  const matchesSnap = await getDocs(collection(db, "tournaments", tournamentId, "matches"));
                  const snapshotObj = {
                    tournament,
                    players: playersSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })),
                    matches: matchesSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
                  };
                  localStorage.setItem("cqg_dev_snapshot", JSON.stringify(snapshotObj));
                  setToast("Snapshot saved");
                  addLog("Snapshot saved to localStorage");
                  setTimeout(() => setToast(null), 2000);
                } catch (e) {
                  console.error(e);
                  addLog(`Snapshot save error: ${(e as any)?.message || e}`);
                }
              }}
            >
              Save Snapshot
            </button>
            <button
              className="px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm"
              onClick={async () => {
                try {
                  const raw = localStorage.getItem("cqg_dev_snapshot");
                  if (!raw) { addLog("No snapshot to load"); return; }
                  const data = JSON.parse(raw);
                  // Restore tournament (merge), players/matches (replace)
                  const tRef = doc(db, "tournaments", tournamentId);
                  await updateDoc(tRef, data.tournament || {});
                  // Replace players
                  const pCol = collection(db, "tournaments", tournamentId, "players");
                  const pOld = await getDocs(pCol);
                  await Promise.all(pOld.docs.map(d => deleteDoc(d.ref)));
                  await Promise.all((data.players || []).map((p: any) => setDoc(doc(db, "tournaments", tournamentId, "players", p.id), p)));
                  // Replace matches
                  const mCol = collection(db, "tournaments", tournamentId, "matches");
                  const mOld = await getDocs(mCol);
                  await Promise.all(mOld.docs.map(d => deleteDoc(d.ref)));
                  await Promise.all((data.matches || []).map((m: any) => setDoc(doc(db, "tournaments", tournamentId, "matches", m.id), m)));
                  setToast("Snapshot loaded");
                  addLog("Snapshot restored to Firestore");
                  setTimeout(() => setToast(null), 2000);
                } catch (e) {
                  console.error(e);
                  addLog(`Snapshot load error: ${(e as any)?.message || e}`);
                }
              }}
            >
              Load Snapshot
            </button>
            <button
              className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm"
              onClick={() => {
                localStorage.removeItem("cqg_dev_snapshot");
                setToast("Snapshot cleared");
                addLog("Snapshot cleared from localStorage");
                setTimeout(() => setToast(null), 1500);
              }}
            >
              Clear Snapshot
            </button>
          </div>
        )}
      </section>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-black text-white text-sm px-3 py-2 rounded shadow-lg">{toast}</div>
      )}

      {/* Overlay render */}
      {showOverlay && liveMatchId && (
        <MatchOverlay tournamentId={tournamentId} matchId={liveMatchId} />
      )}
      {/* Quick Tools */}
      <section className="border p-4 rounded-xl bg-white shadow-md">
        <h2 className="text-xl font-semibold mb-2">⚡ Quick Tools</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={quickFill}
            className="px-4 py-2 bg-pink-600 text-white rounded-xl"
          >
            Quick Fill Players
          </button>
          <button
            onClick={quickReset}
            className="px-4 py-2 bg-gray-700 text-white rounded-xl"
          >
            Quick Reset Tournament
          </button>
          <button
            onClick={quickSimulate}
            className="px-4 py-2 bg-green-600 text-white rounded-xl"
          >
            Quick Simulate Tournament
          </button>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <label className="text-sm font-medium">Tournament Size:</label>
          <div className="flex gap-2">
            {[8, 16, 32].map((count) => (
              <button
                key={count}
                onClick={() => setPlayerCount(count)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  playerCount === count
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {count} Players
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-gray-600 text-sm">
          Current: {playerCount} players ({Math.ceil(Math.log2(playerCount))} rounds, {playerCount - 1} matches)
        </p>
      </section>

      {/* 🎮 Tournament Tools */}
      <section className="border p-4 rounded-xl bg-white shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">🎮 Tournament Tools</h2>
        </div>

        {/* Bracket Visualizer Debug Mode */}
        <div className="border rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Bracket Visualizer (Debug)</h3>
            <button className="text-sm text-blue-600" onClick={() => setOpenBracketDebug(!openBracketDebug)}>
              {openBracketDebug ? "Hide" : "Show"}
            </button>
          </div>
          {openBracketDebug && (
            <div className="mt-3">
              {matches.length === 0 ? (
                <p className="text-gray-500 text-sm">No matches yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {matches.sort((a,b) => (a.round||0)-(b.round||0) || (a.matchNumber||0)-(b.matchNumber||0)).map((m) => (
                    <div key={m.id} className="p-2 border rounded flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium">R{m.round || m.roundNumber} • M{m.matchNumber || m.id.slice(-4)}</div>
                        <div>{m.playerA || "TBD"} vs {m.playerB || "TBD"}</div>
                        <div className="text-xs text-gray-600">{(m.status||"").toString()}</div>
                      </div>
                      <button
                        className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                        onClick={() => forceCompleteMatch(m)}
                        disabled={(m.status||"").toLowerCase() === "completed"}
                      >
                        Force Complete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Player Randomizer */}
        <div className="border rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Player Randomizer</h3>
            <button className="text-sm text-blue-600" onClick={() => setOpenPlayerRandomizer(!openPlayerRandomizer)}>
              {openPlayerRandomizer ? "Hide" : "Show"}
            </button>
          </div>
          {openPlayerRandomizer && (
            <div className="mt-3">
              <button
                onClick={shufflePlayers}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
              >
                Shuffle Seeds
              </button>
              <p className="text-xs text-gray-500 mt-2">Randomizes seeding numbers and logs the new order.</p>
            </div>
          )}
        </div>

        {/* Force State Switcher */}
        <div className="border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Force State Switcher</h3>
            <button className="text-sm text-blue-600" onClick={() => setOpenForceState(!openForceState)}>
              {openForceState ? "Hide" : "Show"}
            </button>
          </div>
          {openForceState && (
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: "Draft", value: "draft", color: "bg-gray-300 text-gray-900" },
                { label: "Upcoming", value: "upcoming", color: "bg-blue-600 text-white" },
                { label: "Live", value: "live", color: "bg-green-600 text-white" },
                { label: "Completed", value: "completed", color: "bg-gray-700 text-white" }
              ].map(btn => (
                <button
                  key={btn.value}
                  onClick={() => setTournamentStatus(btn.value)}
                  className={`px-3 py-1 rounded ${btn.color} hover:opacity-90 text-sm`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Player registration */}
      <section className="border p-4 rounded-xl bg-white shadow-md">
        <h2 className="text-xl font-semibold mb-2">Step 1: Register</h2>
        <TournamentRegistration
          tournamentId={tournamentId}
          playerId={playerId}
        />
        <p className="mt-2 text-gray-600 text-sm">
          Registered Players:{" "}
          {tournament?.players?.length > 0
            ? tournament.players.join(", ")
            : "None yet"}
        </p>
      </section>

      {/* Player check-in */}
      <section className="border p-4 rounded-xl bg-white shadow-md">
        <h2 className="text-xl font-semibold mb-2">Step 2: Check-In</h2>
        <TournamentCheckIn tournamentId={tournamentId} playerId={playerId} />
        <p className="mt-2 text-gray-600 text-sm">
          Checked-In Players:{" "}
          {tournament?.checkIns?.length > 0
            ? tournament.checkIns.join(", ")
            : "None yet"}
        </p>
      </section>

      {/* Admin generates matches */}
      <section className="border p-4 rounded-xl bg-white shadow-md">
        <h2 className="text-xl font-semibold mb-2">Step 3: Generate Matches (Admin)</h2>
        <AdminGenerateMatches tournamentId={tournamentId} />
        <p className="mt-2 text-gray-600 text-sm">
          Tournament Status: {tournament?.status || "loading..."}
        </p>
      </section>

      {/* Dynamic match list */}
      <section className="border p-4 rounded-xl bg-white shadow-md">
        <h2 className="text-xl font-semibold mb-2">Step 4: Matches ({matches.length} total)</h2>
        {matches.length === 0 ? (
          <p className="text-gray-500">No matches generated yet.</p>
        ) : (
          <div className="space-y-4">
            {/* Group matches by round */}
            {Array.from(new Set(matches.map(m => m.round))).sort().map(roundNum => {
              const roundMatches = matches.filter(m => m.round === roundNum);
              return (
                <div key={roundNum}>
                  <h3 className="font-semibold text-lg mb-2">
                    Round {roundNum} ({roundMatches.length} matches)
                  </h3>
                  <ul className="space-y-2">
                    {roundMatches.map((m) => (
                      <li
                        key={m.id}
                        className={`p-3 border rounded-lg cursor-pointer ${
                          selectedMatch?.id === m.id ? "bg-indigo-100" : "bg-gray-50"
                        }`}
                        onClick={() => setSelectedMatch(m)}
                      >
                        {m.playerA || "TBD"} vs {m.playerB || "Bye"} —{" "}
                        {m.status.toUpperCase()}
                        {m.winner && (
                          <span className="ml-2 text-green-600 font-bold">
                            Winner: {m.winner}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Match interaction if one is selected */}
      {selectedMatch && (
        <div className="space-y-6">
          <section className="border p-4 rounded-xl bg-white shadow-md">
            <h2 className="text-xl font-semibold mb-2">
              Step 5: Submit Result ({selectedMatch.id})
            </h2>
            <MatchSubmission
              tournamentId={tournamentId}
              matchId={selectedMatch.id}
              playerId={playerId}
            />
          </section>

          <section className="border p-4 rounded-xl bg-white shadow-md">
            <h2 className="text-xl font-semibold mb-2">
              Step 6: Admin Validation ({selectedMatch.id})
            </h2>
            <AdminMatchValidation
              tournamentId={tournamentId}
              matchId={selectedMatch.id}
              playerA={selectedMatch.playerA}
              playerB={selectedMatch.playerB}
            />
          </section>
        </div>
      )}

      {/* Bracket view */}
      <section className="border p-4 rounded-xl bg-white shadow-md">
        <h2 className="text-xl font-semibold mb-2">Step 7: Bracket</h2>
        <TournamentBracket tournamentId={tournamentId} />
      </section>

      {/* Winner recognition */}
      <section className="border p-4 rounded-xl shadow-md bg-yellow-100 text-center">
        <h2 className="text-2xl font-bold mb-2">Step 8: Champion</h2>
        <TournamentWinner tournamentId={tournamentId} />
      </section>

      {/* Live Logs Panel */}
      <section className="border rounded-xl bg-black shadow-md p-3 font-mono text-green-400">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-green-300">Live Logs</h2>
          <button
            onClick={exportLogs}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-md px-2 py-1"
          >
            Export Logs
          </button>
          <button
            onClick={clearLogs}
            className="ml-2 text-xs bg-red-700 hover:bg-red-600 text-white rounded-md px-2 py-1"
          >
            Clear Logs
          </button>
          <button
            onClick={() => {
              const next = !isPaused;
              setIsPaused(next);
              if (!next && logRef.current) {
                // Just resumed: snap to latest
                logRef.current.scrollTop = logRef.current.scrollHeight;
              }
            }}
            className="ml-2 text-xs bg-yellow-600 hover:bg-yellow-500 text-black rounded-md px-2 py-1"
          >
            {isPaused ? "Resume Logs" : "Pause Logs"}
          </button>
        </div>
        <div ref={logRef} className="h-48 overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <div className="text-green-700">[--] No logs yet. Actions will appear here.</div>
          ) : (
            logs.map((line, idx) => (
              <div key={idx} className="whitespace-pre-wrap">{line}</div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function ResetAndReseedButton({ onLog }: { onLog?: (m: string) => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const runReset = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/resetAndSeed", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Reset failed");
      setMessage("✅ Tournaments reset & reseeded successfully.");
      if (onLog) {
        const idList = Array.isArray(json.tournaments) ? json.tournaments.join(", ") : "";
        onLog(`Tournaments reseeded. IDs: ${idList}.${json.champion ? ` Champion: ${json.champion}.` : ""}`);
      }
    } catch (e: any) {
      setMessage("❌ Reset failed. Check logs.");
      console.error(e);
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div>
      <button
        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>
            Resetting...
          </span>
        ) : (
          "Reset & Reseed Tournaments"
        )}
      </button>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Confirm Reset</h3>
            <p className="text-sm text-gray-700 mb-4">
              This will clear all tournaments and reseed test data. Are you sure?
            </p>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 rounded border" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={runReset}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Toast */}
      {message && (
        <div className="mt-3 text-sm">
          {message}
        </div>
      )}
    </div>
  );
}
