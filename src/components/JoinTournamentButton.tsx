"use client";

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { getAuth } from 'firebase/auth';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

type Props = {
  tournamentId: string;
  buyIn: number;
  isFull?: boolean;
  disabled?: boolean;
};

export default function JoinTournamentButton({ tournamentId, buyIn, isFull, disabled }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const isTestMode = process.env.NODE_ENV !== 'production';

  const handleJoin = async () => {
    if (!user) {
      setError('Login required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (buyIn === 0) {
        // Free join logic (to be implemented)
        setError('Free join not yet implemented');
        return;
      }

      // Paid join via Stripe
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
        },
        body: JSON.stringify({ tournamentId, amount: buyIn, userId: user.uid }),
      });
      if (!res.ok) throw new Error('Checkout failed');
      const { sessionId } = await res.json();
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not loaded');
      await stripe.redirectToCheckout({ sessionId });
    } catch (e: any) {
      setError(e?.message || 'Failed to join');
    } finally {
      setBusy(false);
    }
  };

  const label = isFull
    ? 'Tournament Full'
    : buyIn === 0
      ? 'Join Tournament'
      : `Join Tournament ($${(buyIn / 100).toFixed(2)})`;

  return (
    <div className="space-y-2">
      {isTestMode && buyIn > 0 && (
        <div className="p-2 rounded bg-yellow-100 border border-yellow-200 text-yellow-800 text-xs">
          ⚠️ TEST MODE — Use Stripe test card 4242 4242 4242 4242
        </div>
      )}
      <button
        onClick={handleJoin}
        disabled={disabled || busy || isFull}
        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold w-full"
      >
        {busy ? 'Processing...' : label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}



