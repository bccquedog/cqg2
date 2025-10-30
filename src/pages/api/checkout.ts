import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { createCheckoutSession } from '@/lib/stripe';

// Minimal client config to allow Firestore reads in API route (validate amount)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'fake',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'fake',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-cqg',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Basic auth check: require x-user-id header in dev
    const userId = (req.headers['x-user-id'] as string) || (req.body?.userId as string);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { tournamentId, amount } = req.body as { tournamentId: string; amount: number };
    if (!tournamentId || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Missing tournamentId or amount' });
    }

    // Validate amount against Firestore buyIn
    const tRef = doc(db, 'tournaments', tournamentId);
    const tSnap = await getDoc(tRef);
    if (!tSnap.exists()) return res.status(404).json({ error: 'Tournament not found' });
    const t = tSnap.data() as any;
    const buyIn = Number(t.buyIn || 0);
    if (buyIn !== amount) return res.status(400).json({ error: 'Invalid amount' });

    const successUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/tournaments/success?tournamentId=${encodeURIComponent(tournamentId)}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/tournaments/${encodeURIComponent(tournamentId)}`;

    const session = await createCheckoutSession({
      amount,
      currency: 'usd',
      successUrl,
      cancelUrl,
      metadata: { tournamentId, userId },
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (e: any) {
    console.error('[checkout] error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}




