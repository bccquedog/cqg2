import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { DiscordProfile } from '@/types/player';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, discordProfile } = req.body;

  if (!userId || !discordProfile) {
    return res.status(400).json({ error: 'User ID and Discord profile are required' });
  }

  try {
    // Verify user exists
    const userRef = doc(db, 'players', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user with Discord profile
    await updateDoc(userRef, {
      discord: discordProfile,
      updatedAt: new Date(),
    });

    // If Discord has linked gaming accounts, update gamer tags
    if (discordProfile.linkedAccounts) {
      const linkedAccounts = discordProfile.linkedAccounts;
      const gamerTags = [];

      // Extract gamer tags from linked accounts
      if (linkedAccounts.xbox?.gamertag) {
        gamerTags.push({ platform: 'xbox', tag: linkedAccounts.xbox.gamertag });
      }
      if (linkedAccounts.playstation?.username) {
        gamerTags.push({ platform: 'playstation', tag: linkedAccounts.playstation.username });
      }
      if (linkedAccounts.steam?.username) {
        gamerTags.push({ platform: 'steam', tag: linkedAccounts.steam.username });
      }
      if (linkedAccounts.battleNet?.battletag) {
        gamerTags.push({ platform: 'battlenet', tag: linkedAccounts.battleNet.battletag });
      }
      if (linkedAccounts.epic?.username) {
        gamerTags.push({ platform: 'epic', tag: linkedAccounts.epic.username });
      }
      if (linkedAccounts.riot?.username) {
        gamerTags.push({ platform: 'riot', tag: linkedAccounts.riot.username });
      }

      // Update user with platform-specific gamer tags
      if (gamerTags.length > 0) {
        await updateDoc(userRef, {
          platformGamerTags: gamerTags,
          updatedAt: new Date(),
        });
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Discord profile synced successfully',
      discordProfile 
    });
  } catch (error) {
    console.error('Error syncing Discord data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
