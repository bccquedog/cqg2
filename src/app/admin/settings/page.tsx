"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const ref = doc(db, 'config', 'admin');
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() as any : {};
      setEnabled(Boolean(data.goldenTicketsEnabled));
      setLoading(false);
      // load invites via API
      const res = await fetch('/api/invites');
      const json = await res.json();
      setInvites(json.invites || []);
    })();
  }, []);

  const saveToggle = async (v: boolean) => {
    setBusy(true);
    try {
      await setDoc(doc(db, 'config', 'admin'), { goldenTicketsEnabled: v }, { merge: true });
      setEnabled(v);
    } finally { setBusy(false); }
  };

  const generateInvite = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ issuedBy: 'admin' }) });
      const json = await res.json();
      setInvites((prev) => [json, ...prev]);
    } finally { setBusy(false); }
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Settings</h1>

      <div className="border rounded p-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Golden Tickets</div>
            <div className="text-sm text-gray-600">Gate access with invite codes. Default: off.</div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} onChange={(e)=>saveToggle(e.target.checked)} disabled={busy} />
            <span>{enabled ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>
      </div>

      <div className="border rounded p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Invites</div>
          <button onClick={generateInvite} disabled={busy} className="text-sm px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Generate Invite</button>
        </div>
        {invites.length === 0 ? (
          <p className="text-sm text-gray-500">No invites yet.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto text-sm">
            <table className="w-full">
              <thead className="text-left text-gray-600">
                <tr>
                  <th className="py-1">Code</th>
                  <th className="py-1">Status</th>
                  <th className="py-1">Tier</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="py-1 font-mono">{i.code}</td>
                    <td className="py-1">{i.status}</td>
                    <td className="py-1">{i.tier || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}




