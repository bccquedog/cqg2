import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, platform, timestamp } = req.body;

  if (!userId || !platform || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Log community join event
    await setDoc(doc(db, 'analytics', 'community-joins', `${userId}-${Date.now()}`), {
      userId,
      platform,
      timestamp: new Date(timestamp),
      createdAt: serverTimestamp(),
    });

    // Update user's community engagement
    const userRef = doc(db, 'players', userId);
    await setDoc(userRef, {
      communityEngagement: {
        discordJoined: platform === 'discord',
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    }, { merge: true });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking community join:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
