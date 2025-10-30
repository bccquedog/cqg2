"use client";

import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

type Participant = {
  userId: string;
  paid: boolean;
  joinedAt: any;
  paymentRef?: string;
  displayName?: string;
  avatarUrl?: string;
};

type Props = {
  tournamentId: string;
};

export default function ParticipantsPanel({ tournamentId }: Props) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusByPlayer, setStatusByPlayer] = useState<Record<string, 'Ready' | 'In Match' | 'Eliminated'>>({});

  useEffect(() => {
    const pRef = collection(db, 'tournaments', tournamentId, 'participants');
    const unsub = onSnapshot(pRef, async (snap) => {
      const items: Participant[] = snap.docs.map((d) => ({
        userId: d.id,
        ...(d.data() as any),
      }));

      // Resolve display names and avatars
      const resolved = await Promise.all(
        items.map(async (p) => {
          try {
            const playerSnap = await getDoc(doc(db, 'players', p.userId));
            if (playerSnap.exists()) {
              const data = playerSnap.data() as any;
              return {
                ...p,
                displayName: data.displayName || data.name || p.userId,
                avatarUrl: data.avatarUrl || data.avatar || null,
              };
            }
          } catch {}
          return { ...p, displayName: p.userId, avatarUrl: null };
        })
      );

      setParticipants(resolved);
      setLoading(false);
      if (process.env.NODE_ENV !== 'production') {
        console.log('[ParticipantsPanel] Updated participants:', resolved);
      }
    });

    return () => unsub();
  }, [tournamentId]);

  // Match-driven status sync
  useEffect(() => {
    const mRef = collection(db, 'tournaments', tournamentId, 'matches');
    const unsub = onSnapshot(mRef, (snap) => {
      const matches = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const nextStatus: Record<string, 'Ready' | 'In Match' | 'Eliminated'> = {};

      const participantIds = new Set(participants.map((p) => p.userId));

      participantIds.forEach((pid) => {
        // In Match if any live match includes player
        const inLive = matches.some((m) => (m.status === 'live' || m.status === 'Live') && (m.playerA === pid || m.playerB === pid || m.playerAId === pid || m.playerBId === pid));
        if (inLive) {
          nextStatus[pid] = 'In Match';
          return;
        }

        // Determine eliminated: participated in a completed match and lost, and no pending/live future match
        const playerMatches = matches.filter((m) => (m.playerA === pid || m.playerB === pid || m.playerAId === pid || m.playerBId === pid));
        const hasPending = playerMatches.some((m) => m.status === 'pending' || m.status === 'Pending' || m.status === 'live' || m.status === 'Live');
        const lostCompleted = playerMatches.some((m) => m.status === 'completed' && m.winner && m.winner !== pid);
        if (!hasPending && lostCompleted) {
          nextStatus[pid] = 'Eliminated';
          return;
        }

        nextStatus[pid] = 'Ready';
      });

      setStatusByPlayer(nextStatus);
    });
    return () => unsub();
  }, [tournamentId, participants]);

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString(undefined, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-4 bg-white border rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-4">Participants ({participants.length})</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading participants...</p>
      ) : participants.length === 0 ? (
        <p className="text-sm text-gray-500">No participants have joined yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Player</th>
                <th className="text-left py-2 px-3">Payment</th>
                <th className="text-left py-2 px-3">State</th>
                <th className="text-left py-2 px-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p, idx) => (
                <tr key={p.userId} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      {p.avatarUrl && (
                        <img src={p.avatarUrl} alt={p.displayName} className="w-6 h-6 rounded-full" />
                      )}
                      <Link href={`/profile/${p.userId}`} className="font-medium text-blue-600 hover:underline">
                        {p.displayName}
                      </Link>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    {p.paid ? (
                      <span className="rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700">Paid</span>
                    ) : (
                      <span className="rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">Free</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {statusByPlayer[p.userId] === 'In Match' && (
                      <span className="rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700">In Match</span>
                    )}
                    {statusByPlayer[p.userId] === 'Eliminated' && (
                      <span className="rounded-full px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700">Eliminated</span>
                    )}
                    {(!statusByPlayer[p.userId] || statusByPlayer[p.userId] === 'Ready') && (
                      <span className="rounded-full px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700">Ready</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-gray-600">{formatDate(p.joinedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

