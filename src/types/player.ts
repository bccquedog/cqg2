export type PlayerStatus = "online" | "offline" | "in_match";

export type PlayerSubscription = "gamer" | "mamba" | "king";

export interface PlayerStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
}

export interface DiscordProfile {
  id: string;
  username: string;
  discriminator?: string;
  global_name?: string;
  avatar?: string;
  verified?: boolean;
  linkedAt: Date;
  linkedAccounts?: {
    xbox?: {
      gamertag: string;
      id: string;
      verified: boolean;
    };
    playstation?: {
      username: string;
      id: string;
      verified: boolean;
    };
    steam?: {
      username: string;
      id: string;
      verified: boolean;
    };
    battleNet?: {
      battletag: string;
      id: string;
      verified: boolean;
    };
    epic?: {
      username: string;
      id: string;
      verified: boolean;
    };
    riot?: {
      username: string;
      id: string;
      verified: boolean;
    };
  };
  serverMemberships?: string[]; // Discord server IDs where user is a member
}

export interface PlayerProfile {
  username: string;
  avatarUrl?: string;
  status: PlayerStatus;
  bio?: string;
  stats?: PlayerStats;
  subscription?: PlayerSubscription;
  streamUrl?: string;
  discord?: DiscordProfile;
  createdAt?: Date;
}


