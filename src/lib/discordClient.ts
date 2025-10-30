"use client";

import { DiscordProfile } from "@/types/player";

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  avatar?: string;
  verified: boolean;
  email?: string;
}

export interface DiscordConnection {
  id: string;
  name: string;
  type: string;
  verified: boolean;
  visibility: number;
  show_activity: boolean;
  friend_sync: boolean;
  metadata_visibility: number;
  metadata?: {
    [key: string]: string;
  };
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  owner: boolean;
  permissions: string;
  features: string[];
}

class DiscordClient {
  private clientId: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '';
    this.redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || '';
  }

  /**
   * Generate Discord OAuth2 authorization URL
   */
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'identify email connections guilds guilds.members.read',
      ...(state && { state }),
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
  }> {
    const response = await fetch('/api/discord/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return response.json();
  }

  /**
   * Fetch Discord user data
   */
  async fetchUserData(accessToken: string): Promise<DiscordUser> {
    const response = await fetch('/api/discord/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Discord user data');
    }

    return response.json();
  }

  /**
   * Fetch Discord user connections (linked gaming accounts)
   */
  async fetchUserConnections(accessToken: string): Promise<DiscordConnection[]> {
    const response = await fetch('/api/discord/connections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Discord connections');
    }

    return response.json();
  }

  /**
   * Fetch Discord user guilds (servers)
   */
  async fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
    const response = await fetch('/api/discord/guilds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Discord guilds');
    }

    return response.json();
  }

  /**
   * Sync Discord data with user profile
   */
  async syncDiscordData(accessToken: string, userId: string): Promise<DiscordProfile> {
    const [userData, connections, guilds] = await Promise.all([
      this.fetchUserData(accessToken),
      this.fetchUserConnections(accessToken),
      this.fetchUserGuilds(accessToken),
    ]);

    // Process gaming connections
    const linkedAccounts: DiscordProfile['linkedAccounts'] = {};
    
    connections.forEach(connection => {
      if (!connection.verified) return;

      switch (connection.type) {
        case 'xbox':
          linkedAccounts.xbox = {
            gamertag: connection.name,
            id: connection.id,
            verified: connection.verified,
          };
          break;
        case 'playstation':
          linkedAccounts.playstation = {
            username: connection.name,
            id: connection.id,
            verified: connection.verified,
          };
          break;
        case 'steam':
          linkedAccounts.steam = {
            username: connection.name,
            id: connection.id,
            verified: connection.verified,
          };
          break;
        case 'battlenet':
          linkedAccounts.battleNet = {
            battletag: connection.name,
            id: connection.id,
            verified: connection.verified,
          };
          break;
        case 'epic':
          linkedAccounts.epic = {
            username: connection.name,
            id: connection.id,
            verified: connection.verified,
          };
          break;
        case 'riot':
          linkedAccounts.riot = {
            username: connection.name,
            id: connection.id,
            verified: connection.verified,
          };
          break;
      }
    });

    const discordProfile: DiscordProfile = {
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      global_name: userData.global_name,
      avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : undefined,
      verified: userData.verified,
      linkedAt: new Date(),
      linkedAccounts: Object.keys(linkedAccounts).length > 0 ? linkedAccounts : undefined,
      serverMemberships: guilds.map(guild => guild.id),
    };

    // Save to Firestore
    const response = await fetch('/api/discord/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        discordProfile,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync Discord data');
    }

    return discordProfile;
  }

  /**
   * Unlink Discord account
   */
  async unlinkDiscordAccount(userId: string): Promise<void> {
    const response = await fetch('/api/discord/unlink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to unlink Discord account');
    }
  }

  /**
   * Get Discord avatar URL
   */
  getAvatarUrl(userId: string, avatarHash: string, discriminator?: string): string {
    if (avatarHash) {
      return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=256`;
    }
    
    // Default avatar based on discriminator
    const defaultAvatarNumber = discriminator ? parseInt(discriminator) % 5 : 0;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
  }
}

export const discordClient = new DiscordClient();
export default discordClient;
