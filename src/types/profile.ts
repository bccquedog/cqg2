export interface Profile {
  id: string; // userId
  username: string;
  email: string;
  avatarUrl?: string;
  tier: "Gamer" | "Mamba" | "King" | "Elite";
  wins: number;
  losses: number;
  tournamentsWon: number;
  leaguesWon: number;
  createdAt: number;
  updatedAt: number;
}


