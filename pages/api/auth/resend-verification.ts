import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { emailService } from '@/lib/emailService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'UserId and email are required' });
    }

    // Find existing verification record
    const verificationsRef = collection(db, 'emailVerifications');
    const q = query(
      verificationsRef,
      where('userId', '==', userId),
      where('email', '==', email),
      where('verified', '==', false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(400).json({ error: 'No pending verification found' });
    }

    const verificationDoc = snapshot.docs[0];
    const verificationData = verificationDoc.data();

    // Check if we can resend (rate limiting)
    const lastSent = verificationData.lastSent?.toDate();
    const now = new Date();
    const timeSinceLastSent = now.getTime() - (lastSent?.getTime() || 0);
    const minResendInterval = 60 * 1000; // 1 minute

    if (lastSent && timeSinceLastSent < minResendInterval) {
      const remainingTime = Math.ceil((minResendInterval - timeSinceLastSent) / 1000);
      return res.status(429).json({ 
        error: `Please wait ${remainingTime} seconds before requesting another verification email`,
        retryAfter: remainingTime
      });
    }

    // Generate new verification code
    const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update verification record
    await updateDoc(verificationDoc.ref, {
      code: newVerificationCode,
      lastSent: serverTimestamp(),
      attempts: 0 // Reset attempts
    });

    // Send new verification email
    const emailSent = await emailService.sendVerificationEmail({
      email,
      verificationCode: newVerificationCode,
      userName: verificationData.userName,
      tournamentName: verificationData.tournamentName
    });

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'New verification email sent' 
    });

  } catch (error) {
    console.error('Error resending verification email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
