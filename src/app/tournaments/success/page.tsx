"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Link from 'next/link';

function TournamentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournamentId');
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<string>('');
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!tournamentId || !user) {
      setStatus('error');
      setMessage('Missing tournament or user info');
      return;
    }

    (async () => {
      try {
        const pRef = doc(db, 'tournaments', tournamentId, 'participants', user.uid);
        await setDoc(pRef, {
          paid: true,
          joinedAt: serverTimestamp(),
          paymentRef: sessionId || null,
        }, { merge: true });
        setStatus('success');
        setMessage('✅ Payment Successful — You\'ve joined the tournament!');
      } catch (e: any) {
        setStatus('error');
        setMessage(`❌ Failed to register: ${e?.message || 'Unknown error'}`);
      }
    })();
  }, [tournamentId, user, sessionId]);

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="p-4 border rounded-xl shadow bg-white">
        <h1 className="text-2xl font-bold mb-4">Tournament Registration</h1>
        {status === 'processing' && (
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Processing your registration...</span>
          </div>
        )}
        {status === 'success' && (
          <div className="space-y-4">
            <p className="text-lg text-green-700">{message}</p>
            <div className="flex gap-3">
              <Link href={`/tournaments/${tournamentId}`} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">View Tournament</Link>
              <Link href="/tournaments" className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700">All Tournaments</Link>
            </div>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-4">
            <p className="text-lg text-red-700">{message}</p>
            <Link href="/tournaments" className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700">Back to Tournaments</Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function TournamentSuccessPage() {
  return (
    <Suspense fallback={
      <main className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="p-4 border rounded-xl shadow bg-white">
          <h1 className="text-2xl font-bold mb-4">Tournament Registration</h1>
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading...</span>
          </div>
        </div>
      </main>
    }>
      <TournamentSuccessContent />
    </Suspense>
  );
}



