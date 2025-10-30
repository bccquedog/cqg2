import { NextApiRequest, NextApiResponse } from 'next';
import { emailService, MarketingEmailData } from '@/lib/emailService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      email,
      userName,
      gamerTag,
      campaignType, 
      subject, 
      content 
    } = req.body;

    if (!email || !campaignType || !subject || !content) {
      return res.status(400).json({ error: 'Email, campaign type, subject, and content are required' });
    }

    const marketingData: MarketingEmailData = {
      email,
      userName: userName || email.split('@')[0],
      gamerTag,
      campaignType,
      subject,
      content
    };

    const success = await emailService.sendMarketingEmail(marketingData);

    if (success) {
      res.status(200).json({ 
        success: true, 
        message: 'Marketing email sent successfully' 
      });
    } else {
      res.status(500).json({ error: 'Failed to send marketing email' });
    }

  } catch (error) {
    console.error('Error sending marketing email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
