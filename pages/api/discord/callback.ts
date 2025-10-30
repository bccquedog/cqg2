import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error } = req.query;

  // Handle OAuth errors
  if (error) {
    console.error('Discord OAuth error:', error);
    return res.redirect(`/?discord_error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.redirect('/?discord_error=no_code');
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch(`${req.headers.host?.includes('localhost') ? 'http://' : 'https://'}${req.headers.host}/api/discord/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Fetch user data
    const userResponse = await fetch(`${req.headers.host?.includes('localhost') ? 'http://' : 'https://'}${req.headers.host}/api/discord/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken: access_token }),
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await userResponse.json();

    // Redirect back to the app with success parameters
    const redirectUrl = state ? 
      `/?discord_linked=true&discord_id=${userData.id}&discord_username=${encodeURIComponent(userData.username)}&state=${state}` :
      `/?discord_linked=true&discord_id=${userData.id}&discord_username=${encodeURIComponent(userData.username)}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Discord callback error:', error);
    res.redirect(`/?discord_error=${encodeURIComponent('callback_failed')}`);
  }
}
