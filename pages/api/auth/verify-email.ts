import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { emailService } from '@/lib/emailService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, email, userId } = req.body;

    if (!code || !email || !userId) {
      return res.status(400).json({ error: 'Code, email, and userId are required' });
    }

    // Find verification record by userId and email
    const verificationsRef = db.collection('emailVerifications');
    const snapshot = await verificationsRef
      .where('userId', '==', userId)
      .where('email', '==', email)
      .where('verified', '==', false)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ error: 'No pending verification found' });
    }

    const verificationDoc = snapshot.docs[0];
    const verificationData = verificationDoc.data();

    // Check if verification has expired
    const now = new Date();
    const expiresAt = verificationData.expiresAt.toDate();
    
    if (now > expiresAt) {
      // Delete expired verification
      await verificationDoc.ref.delete();
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Check attempt limit
    if (verificationData.attempts >= 5) {
      return res.status(400).json({ error: 'Too many verification attempts' });
    }

    // Verify the code
    if (verificationData.code !== code) {
      // Increment attempts
      await verificationDoc.ref.update({
        attempts: verificationData.attempts + 1
      });
      
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Mark as verified
    await verificationDoc.ref.update({
      verified: true,
      verifiedAt: new Date()
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        email,
        userName: verificationData.userName || 'Player',
        gamerTag: verificationData.gamerTag || 'Player',
        tournamentName: verificationData.tournamentName
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the verification if welcome email fails
    }

    res.status(200).json({ 
      success: true, 
      message: 'Email verified successfully' 
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
