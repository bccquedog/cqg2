import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' });
  }

  try {
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error('Discord user fetch failed:', errorData);
      return res.status(400).json({ error: 'Failed to fetch Discord user data' });
    }

    const userData = await userResponse.json();
    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching Discord user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
