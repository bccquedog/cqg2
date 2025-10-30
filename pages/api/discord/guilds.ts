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
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!guildsResponse.ok) {
      const errorData = await guildsResponse.text();
      console.error('Discord guilds fetch failed:', errorData);
      return res.status(400).json({ error: 'Failed to fetch Discord guilds' });
    }

    const guildsData = await guildsResponse.json();
    res.status(200).json(guildsData);
  } catch (error) {
    console.error('Error fetching Discord guilds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
