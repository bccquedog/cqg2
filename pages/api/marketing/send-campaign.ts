import { NextApiRequest, NextApiResponse } from 'next';
import { emailService, MarketingEmailData } from '@/lib/emailService';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      campaignType, 
      subject, 
      content, 
      targetAudience = 'all',
      tournamentId 
    } = req.body;

    if (!campaignType || !subject || !content) {
      return res.status(400).json({ error: 'Campaign type, subject, and content are required' });
    }

    // Get target audience
    let targetEmails: string[] = [];
    
    if (targetAudience === 'all') {
      // Get all users
      const usersRef = collection(db, 'players');
      const usersSnap = await getDocs(usersRef);
      targetEmails = usersSnap.docs.map(doc => doc.data().email).filter(Boolean);
    } else if (targetAudience === 'tournament') {
      // Get tournament participants
      if (!tournamentId) {
        return res.status(400).json({ error: 'Tournament ID required for tournament audience' });
      }
      
      const tournamentRef = collection(db, 'tournaments', tournamentId, 'roster');
      const rosterSnap = await getDocs(tournamentRef);
      const playerIds = rosterSnap.docs.map(doc => doc.data().playerId);
      
      // Get player emails
      const playersRef = collection(db, 'players');
      const playersQuery = query(playersRef, where('__name__', 'in', playerIds));
      const playersSnap = await getDocs(playersQuery);
      targetEmails = playersSnap.docs.map(doc => doc.data().email).filter(Boolean);
    }

    if (targetEmails.length === 0) {
      return res.status(400).json({ error: 'No target audience found' });
    }

    // Send emails to all targets
    const results = await Promise.allSettled(
      targetEmails.map(async (email) => {
        const marketingData: MarketingEmailData = {
          email,
          userName: email.split('@')[0], // Use email prefix as default name
          campaignType,
          subject,
          content
        };

        return await emailService.sendMarketingEmail(marketingData);
      })
    );

    const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
    const failed = results.length - successful;

    res.status(200).json({
      success: true,
      message: `Campaign sent to ${successful} recipients`,
      stats: {
        total: targetEmails.length,
        successful,
        failed
      }
    });

  } catch (error) {
    console.error('Error sending marketing campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
