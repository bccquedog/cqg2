import { NextApiRequest, NextApiResponse } from 'next';
import { emailService } from '@/lib/emailService';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, userId, userName, tournamentName } = req.body;

    if (!email || !userId) {
      return res.status(400).json({ error: 'Email and userId are required' });
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationId = uuidv4();

    // Store verification data in Firestore
    const verificationRef = doc(db, 'emailVerifications', verificationId);
    await setDoc(verificationRef, {
      userId,
      email,
      code: verificationCode,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      verified: false,
      attempts: 0
    });

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail({
      email,
      verificationCode,
      userName,
      tournamentName
    });

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Verification email sent',
      verificationId 
    });

  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
