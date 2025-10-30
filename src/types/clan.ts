import { Timestamp } from "firebase/firestore";

export interface ClanStats {
  wins: number;
  losses: number;
  tournamentsWon: number;
}

export interface Clan {
  id?: string; // clanId (optional for creation)
  name: string;
  logo?: string;
  captainId: string;
  members: string[]; // userIds
  stats: ClanStats;
  createdAt: Timestamp;
}
