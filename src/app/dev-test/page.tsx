"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { seedTestData, resetTestData, getCurrentTestState, seedFreeTournament, seedPaidTournament } from '@/lib/devTestUtils';
import { devLog, getDevLogs } from '@/lib/logger';
import { testAutoProgression } from '@/lib/testAutoProgression';

export default function DevTestPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthed(Boolean(u));
    });
    return () => unsub();
  }, []);

  const pushLog = (msg: string) => setLogs((prev) => [msg, ...prev].slice(0, 100));

  useEffect(() => {
    // Load recent logs
    setLogs(getDevLogs(20).map((e: any) => JSON.stringify(e)));
    // Auto-seed if empty
    (async () => {
      try {
        const state = await getCurrentTestState();
        if ((state.playersCount === 0) && (state.tournamentsCount === 0)) {
          const res = await seedTestData({ auto: true });
          devLog('auto-seed', res);
          pushLog(JSON.stringify(res));
        }
      } catch {}
    })();
  }, []);

  const seed = async () => {
    setBusy(true);
    try {
      const res = await seedTestData();
      devLog('seed', res);
      pushLog(JSON.stringify(res));
    } catch (e: any) {
      pushLog(`❌ Seed failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      const res = await resetTestData();
      devLog('reset', res);
      pushLog(JSON.stringify(res));
    } catch (e: any) {
      pushLog(`❌ Reset failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const checkState = async () => {
    setBusy(true);
    try {
      const state = await getCurrentTestState();
      devLog('state', state);
      pushLog(JSON.stringify(state));
    } catch (e: any) {
      pushLog(`❌ State check failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const spawnFreeTourney = async () => {
    setBusy(true);
    try {
      const res = await seedFreeTournament();
      devLog('spawn-free', res);
      pushLog(JSON.stringify(res));
    } catch (e: any) {
      pushLog(`❌ Spawn free failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const spawnPaidTourney = async () => {
    setBusy(true);
    try {
      const res = await seedPaidTournament();
      devLog('spawn-paid', res);
      pushLog(JSON.stringify(res));
    } catch (e: any) {
      pushLog(`❌ Spawn paid failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const testAutoProgressionFlow = async () => {
    try {
      setBusy(true);
      pushLog('🎯 Testing auto-progression flow...');
      
      // Get current tournament ID (assuming we have a seeded tournament)
      const state = await getCurrentTestState();
      const tournaments = state.tournaments || [];
      
      if (tournaments.length === 0) {
        pushLog('❌ No tournaments found. Please seed data first.');
        return;
      }

      const tournamentId = tournaments[0].id;
      pushLog(`🎮 Testing auto-progression for tournament: ${tournamentId}`);
      
      // Test completing Round 1
      await testAutoProgression(tournamentId, 1);
      pushLog('✅ Round 1 completed - auto-progression should trigger Round 2');
      
    } catch (e: any) {
      pushLog(`❌ Auto-progression test failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const simulateFullTournament = async () => {
    try {
      setBusy(true);
      pushLog('🏆 Simulating full tournament with auto-progression...');
      
      // Get current tournament ID
      const state = await getCurrentTestState();
      const tournaments = state.tournaments || [];
      
      if (tournaments.length === 0) {
        pushLog('❌ No tournaments found. Please seed data first.');
        return;
      }

      const tournamentId = tournaments[0].id;
      pushLog(`🎮 Running full simulation for tournament: ${tournamentId}`);
      
      // Run full tournament simulation
      await testAutoProgression(tournamentId);
      pushLog('🏆 Full tournament simulation completed!');
      
    } catch (e: any) {
      pushLog(`❌ Tournament simulation failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  if (authed === null) {
    return <main className="p-6">Loading...</main>;
  }
  if (!authed) {
    return <main className="p-6"><div className="text-red-700 font-semibold">Sign in required to access Dev Test.</div></main>;
  }

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="p-3 rounded bg-yellow-100 border border-yellow-200 text-yellow-800 font-semibold">
        🚧 Developer Test Environment – Not For Public Use
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded-xl shadow">
          <h2 className="font-semibold mb-2">Seed Test Data</h2>
          <button onClick={seed} disabled={busy} className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-400 disabled:opacity-50 text-sm">{busy ? 'Working…' : 'Seed Test Data'}</button>
        </div>

        <div className="p-4 bg-white border rounded-xl shadow">
          <h2 className="font-semibold mb-2">View Tournament Flow</h2>
          <button onClick={() => router.push('/tournaments')} className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 text-sm">Open Tournaments</button>
        </div>

        <div className="p-4 bg-white border rounded-xl shadow">
          <h2 className="font-semibold mb-2">View Players</h2>
          <div className="flex gap-2">
            <button onClick={() => router.push('/players')} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 text-sm">Open Players</button>
            <button onClick={() => router.push('/profile/player1')} className="px-3 py-2 rounded bg-sky-600 text-white hover:bg-sky-700 focus:ring-2 focus:ring-sky-400 text-sm">View Sample Profile</button>
          </div>
        </div>

        <div className="p-4 bg-white border rounded-xl shadow md:col-span-1">
          <h2 className="font-semibold mb-2">Reset Data</h2>
          <button onClick={reset} disabled={busy} className="px-3 py-2 rounded bg-gray-700 text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-400 disabled:opacity-50 text-sm">Reset</button>
        </div>

        <div className="p-4 bg-white border rounded-xl shadow md:col-span-1">
          <h2 className="font-semibold mb-2">Check Current State</h2>
          <button onClick={checkState} disabled={busy} className="px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-400 disabled:opacity-50 text-sm">Check State</button>
        </div>

        <div className="p-4 bg-white border rounded-xl shadow md:col-span-1">
          <h2 className="font-semibold mb-2">Spawn Free Tournament</h2>
          <button onClick={spawnFreeTourney} disabled={busy} className="px-3 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 focus:ring-2 focus:ring-teal-400 disabled:opacity-50 text-sm">Spawn Free</button>
        </div>

        <div className="p-4 bg-white border rounded-xl shadow md:col-span-1">
          <h2 className="font-semibold mb-2">Spawn Paid Tournament ($5)</h2>
          <button onClick={spawnPaidTourney} disabled={busy} className="px-3 py-2 rounded bg-orange-600 text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-400 disabled:opacity-50 text-sm">Spawn Paid</button>
        </div>

        <div className="p-4 bg-white border rounded-xl shadow md:col-span-1">
          <h2 className="font-semibold mb-2">Test Auto-Progression</h2>
          <button onClick={testAutoProgressionFlow} disabled={busy} className="px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-400 disabled:opacity-50 text-sm">{busy ? 'Working…' : 'Test Round 1'}</button>
        </div>

        <div className="p-4 bg-white border rounded-xl shadow md:col-span-1">
          <h2 className="font-semibold mb-2">Simulate Full Tournament</h2>
          <button onClick={simulateFullTournament} disabled={busy} className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-400 disabled:opacity-50 text-sm">{busy ? 'Working…' : 'Full Simulation'}</button>
        </div>

      </div>

      <div className="p-4 bg-white border rounded-xl shadow">
        <h2 className="font-semibold mb-2">Activity Log</h2>
        <div className="text-xs font-mono text-gray-700 space-y-1 max-h-64 overflow-auto">
          {logs.length === 0 ? <div className="text-gray-400">No activity yet.</div> : logs.slice(0,5).map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    </main>
  );
}


