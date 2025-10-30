import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, setDoc, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, tournamentId, tournamentName, channelName, timestamp } = req.body;

  if (!userId || !tournamentId || !tournamentName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Log tournament Discord join event
    await setDoc(doc(db, 'analytics', 'tournament-discord-joins', `${userId}-${tournamentId}-${Date.now()}`), {
      userId,
      tournamentId,
      tournamentName,
      channelName: channelName || `tournament-${tournamentId.slice(0, 8)}`,
      timestamp: new Date(timestamp),
      createdAt: serverTimestamp(),
    });

    // Update user's tournament Discord engagement
    const userRef = doc(db, 'players', userId);
    await setDoc(userRef, {
      tournamentDiscordEngagement: {
        [tournamentId]: {
          tournamentName,
          channelName: channelName || `tournament-${tournamentId.slice(0, 8)}`,
          joinedAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        }
      },
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Update tournament with Discord engagement stats
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    await updateDoc(tournamentRef, {
      discordEngagement: {
        totalJoins: arrayUnion(userId),
        lastUpdated: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking tournament Discord join:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
