"use client";

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircle, Tag } from 'lucide-react';

type Registration = {
  userId: string;
  paid?: boolean;
  amount?: number | null;
  registeredAt?: Timestamp | { toDate: () => Date } | Date | null;
};

export default function RegistrationsList({ tournamentId }: { tournamentId: string }) {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [nameCache, setNameCache] = useState<Record<string, string>>({});
  const [showRegistrations, setShowRegistrations] = useState<boolean>(true);
  const [maxPlayers, setMaxPlayers] = useState<number>(16);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const hasItems = regs.length > 0;

  useEffect(() => {
    // Listen to tournament doc for visibility toggle
    const tourUnsub = onSnapshot(doc(db, 'tournaments', tournamentId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        setShowRegistrations(data.showRegistrations !== false);
        setMaxPlayers(typeof data.maxPlayers === 'number' ? data.maxPlayers : 16);
        setStatus(data.status);
      } else {
        setShowRegistrations(true);
        setMaxPlayers(16);
        setStatus(undefined);
      }
    });

    const q = query(
      collection(db, 'tournaments', tournamentId, 'registrations'),
      orderBy('registeredAt', 'asc')
    );
    const regsUnsub = onSnapshot(q, async (snap) => {
      const items: Registration[] = snap.docs.map((d) => ({ userId: d.id, ...(d.data() as any) }));
      setRegs(items);

      // Resolve display names lazily and cache results
      const unresolved = items
        .map((r) => r.userId)
        .filter((uid) => !nameCache[uid]);
      if (unresolved.length > 0) {
        const updates: Record<string, string> = {};
        await Promise.all(
          unresolved.map(async (uid) => {
            try {
              const p = await getDoc(doc(db, 'players', uid));
              if (p.exists()) {
                const pd = p.data() as any;
                updates[uid] = pd.displayName || pd.name || uid;
              } else {
                updates[uid] = uid;
              }
            } catch {
              updates[uid] = uid;
            }
          })
        );
        setNameCache((prev) => ({ ...prev, ...updates }));
      }
    });
    return () => { tourUnsub(); regsUnsub(); };
  }, [db, tournamentId, nameCache]);

  const items = useMemo(() => {
    return regs.map((r) => {
      const when = r.registeredAt
        ? r.registeredAt instanceof Date
          ? r.registeredAt
          : (r.registeredAt as any).toDate?.() ?? new Date()
        : undefined;
      const dateStr = when
        ? new Intl.DateTimeFormat(undefined, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(when)
        : '—';
      const paid = r.paid === true;
      const amount = r.amount ?? 0;
      return {
        key: r.userId,
        name: nameCache[r.userId] || r.userId,
        paid,
        amount,
        dateStr,
      };
    });
  }, [regs, nameCache]);

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold text-indigo-700">
          Registered Players: {regs.length} / {maxPlayers}
        </div>
        {status === 'closed' && (
          <span className="ml-3 text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200">Tournament Full</span>
        )}
      </div>
      <h3 className="text-lg font-semibold mb-2">Registrations</h3>
      {showRegistrations === false ? (
        <p className="text-sm text-gray-500">Registrations are hidden for this tournament.</p>
      ) : !hasItems ? (
        <p className="text-sm text-gray-500">No players registered yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((it) => (
            <div key={it.key} className="rounded-md shadow p-3 bg-white border">
              <div className="flex items-center justify-between">
                <div className="font-medium truncate mr-2">{it.name}</div>
                {it.paid ? (
                  <div className="flex items-center text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    ${ (it.amount / 100).toFixed(2) } Paid
                  </div>
                ) : (
                  <div className="flex items-center text-blue-600 text-sm">
                    <Tag className="w-4 h-4 mr-1" />
                    Free
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">{it.dateStr}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


