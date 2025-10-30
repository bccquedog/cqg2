"use client";

import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { loadStripe } from '@stripe/stripe-js';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function PayButton({ tournamentId }: { tournamentId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFree, setIsFree] = useState<boolean | null>(null);
  const [entryFeeCents, setEntryFeeCents] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('USD');
  const [registered, setRegistered] = useState<boolean>(false);

  // Fetch fee to render correct CTA
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'tournaments', tournamentId));
        if (!mounted) return;
        if (snap.exists()) {
          const data = snap.data() as { entryFee?: number; currency?: string };
          const fee = data.entryFee ?? 0;
          setEntryFeeCents(fee);
          setIsFree(!fee || fee <= 0);
          setCurrency((data.currency || 'usd').toUpperCase());
        } else {
          setIsFree(true);
          setEntryFeeCents(0);
          setCurrency('USD');
        }
      } catch (e) {
        setIsFree(null);
        setEntryFeeCents(0);
        setCurrency('USD');
      }
    })();
    return () => { mounted = false; };
  }, [db, tournamentId]);

  const onClick = async () => {
    setError(null);
    try {
      setBusy(true);
      const user = auth.currentUser;
      if (!user) throw new Error('Login required');
      // If tournament is free, create registration directly
      if (isFree) {
        const functions = getFunctions();
        const registerFree = httpsCallable(functions, 'registerFreeRegistration');
        await registerFree({ tournamentId, userId: user.uid });
        setRegistered(true);
        setBusy(false);
        return;
      }
      const functions = getFunctions();
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const res: any = await createCheckoutSession({ tournamentId, userId: user.uid });
      if (res.data?.free) {
        // Defensive: backend deemed free
        setBusy(false);
        return;
      }
      const sessionId = res.data?.sessionId;
      if (!sessionId) throw new Error('Failed to create checkout session');
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not loaded');
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (e: any) {
      setError(e?.message || 'Payment failed');
    } finally {
      setBusy(false);
    }
  };

  const label = registered
    ? 'Registered ✅'
    : isFree
      ? 'Join for Free'
      : `Register & Pay $${(entryFeeCents / 100).toFixed(2)}`;

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={onClick}
        disabled={busy || registered || isFree === null}
        className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50"
      >
        {busy ? 'Processing…' : label}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}


