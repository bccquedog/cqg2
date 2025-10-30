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
    const connectionsResponse = await fetch('https://discord.com/api/users/@me/connections', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!connectionsResponse.ok) {
      const errorData = await connectionsResponse.text();
      console.error('Discord connections fetch failed:', errorData);
      return res.status(400).json({ error: 'Failed to fetch Discord connections' });
    }

    const connectionsData = await connectionsResponse.json();
    res.status(200).json(connectionsData);
  } catch (error) {
    console.error('Error fetching Discord connections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
