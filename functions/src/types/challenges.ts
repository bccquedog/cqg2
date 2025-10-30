export type ChallengeType = "admin" | "community" | "sponsored" | "launch";
export type ChallengeStatus = "draft" | "active" | "completed" | "archived";

export interface ChallengeRules {
  description: string;
  start: FirebaseFirestore.Timestamp;
  end: FirebaseFirestore.Timestamp;
  submissionType: "clip" | "stat" | "screenshot";
  validation?: "manual" | "auto";
}

export interface ChallengeSubmission {
  playerId: string;
  clipUrl: string;
  votes: number;
  surgeScoreBonus?: number;
  status: "pending" | "approved" | "featured";
}

export interface ChallengeRewards {
  winner: { coins: number; xp: number; badgeId?: string };
  participants?: { xp: number };
}

export interface ChallengeAudit {
  createdBy: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface ChallengeDoc {
  id?: string;
  title: string;
  game: string;
  type: ChallengeType;
  status: ChallengeStatus;

  rules: ChallengeRules;
  submissions?: ChallengeSubmission[];
  rewards?: ChallengeRewards;
  audit: ChallengeAudit;

  archived?: boolean;
  pruneAt?: string;
  createdAt?: string;
  updatedAt?: string;
}




