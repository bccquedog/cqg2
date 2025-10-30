// Discord Integration Service
// Handles Discord OAuth and API interactions

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  avatar?: string;
  verified: boolean;
  email?: string;
  locale?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  owner: boolean;
  permissions: string;
}

export class DiscordService {
  private static readonly CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "";
  private static readonly REDIRECT_URI = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || "";
  private static readonly API_BASE = "https://discord.com/api/v10";

  /**
   * Generate Discord OAuth URL for authorization
   */
  static getOAuthURL(): string {
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      response_type: "code",
      scope: "identify email",
      state: this.generateState()
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    const response = await fetch(`${this.API_BASE}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET || "",
        grant_type: "authorization_code",
        code,
        redirect_uri: this.REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error(`Discord token exchange failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get Discord user information
   */
  static async getUserInfo(accessToken: string): Promise<DiscordUser> {
    const response = await fetch(`${this.API_BASE}/users/@me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user's Discord guilds (servers)
   */
  static async getUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
    const response = await fetch(`${this.API_BASE}/users/@me/guilds`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Refresh Discord access token
   */
  static async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    const response = await fetch(`${this.API_BASE}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Discord token refresh failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Validate Discord ID format
   */
  static validateDiscordId(discordId: string): boolean {
    return /^\d{17,19}$/.test(discordId);
  }

  /**
   * Get Discord avatar URL
   */
  static getAvatarUrl(discordId: string, avatarHash: string): string {
    return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png?size=256`;
  }

  /**
   * Get Discord default avatar URL
   */
  static getDefaultAvatarUrl(discriminator: string): string {
    const defaultAvatarIndex = parseInt(discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
  }

  /**
   * Generate random state for OAuth security
   */
  private static generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Check if Discord service is properly configured
   */
  static isConfigured(): boolean {
    return !!(this.CLIENT_ID && this.REDIRECT_URI && process.env.DISCORD_CLIENT_SECRET);
  }

  /**
   * Get Discord username with discriminator (for old format)
   */
  static formatUsername(username: string, discriminator: string): string {
    if (discriminator === "0") {
      return username; // New Discord username format
    }
    return `${username}#${discriminator}`;
  }
}

// Discord API endpoints for future features
export const DISCORD_ENDPOINTS = {
  USER: "/users/@me",
  GUILDS: "/users/@me/guilds",
  CONNECTIONS: "/users/@me/connections",
  OAUTH2_TOKEN: "/oauth2/token",
  OAUTH2_AUTHORIZE: "/oauth2/authorize",
} as const;

// Discord permissions for bot integration (future feature)
export const DISCORD_PERMISSIONS = {
  SEND_MESSAGES: "2048",
  MANAGE_MESSAGES: "8192",
  EMBED_LINKS: "16384",
  READ_MESSAGE_HISTORY: "65536",
  MENTION_EVERYONE: "131072",
} as const;
