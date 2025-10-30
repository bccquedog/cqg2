import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Verify user exists
    const userRef = doc(db, 'players', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove Discord profile from user
    await updateDoc(userRef, {
      discord: null,
      platformGamerTags: null,
      updatedAt: new Date(),
    });

    res.status(200).json({ 
      success: true, 
      message: 'Discord account unlinked successfully' 
    });
  } catch (error) {
    console.error('Error unlinking Discord account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
