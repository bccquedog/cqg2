"use client";

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

type Props = {
  tournamentId: string;
  disabled?: boolean;
};

export default function WaitlistButton({ tournamentId, disabled }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const auth = getAuth();
  const user = auth.currentUser;

  const joinWaitlist = async () => {
    if (!user) {
      setMessage('❌ Login required');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      // Check if already on waitlist
      const wRef = doc(db, 'tournaments', tournamentId, 'waitlist', user.uid);
      const wSnap = await getDoc(wRef);
      if (wSnap.exists()) {
        setMessage('ℹ️ You are already on the waitlist');
        return;
      }

      // Check if already a participant
      const pRef = doc(db, 'tournaments', tournamentId, 'participants', user.uid);
      const pSnap = await getDoc(pRef);
      if (pSnap.exists()) {
        setMessage('ℹ️ You are already registered');
        return;
      }

      // Add to waitlist
      await setDoc(wRef, {
        joinedAt: serverTimestamp(),
        priority: 0,
      });
      setMessage('✅ You\'re on the waitlist. You\'ll be notified if a slot opens.');
    } catch (e: any) {
      setMessage(`❌ ${e?.message || 'Failed to join waitlist'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={joinWaitlist}
        disabled={disabled || busy}
        className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
      >
        {busy ? 'Joining…' : 'Join Waitlist'}
      </button>
      {message && <p className="text-xs">{message}</p>}
    </div>
  );
}



