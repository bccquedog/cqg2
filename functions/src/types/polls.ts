export interface Poll {
  id: string;
  type: "prediction" | "overunder";
  question: string;
  options: string[];
  votes: Record<string, string>; // userId -> selectedOption
  createdAt: Date;
  closesAt: Date;
  isActive: boolean;
  results?: PollResults;
}

export interface PollResults {
  totalVotes: number;
  optionCounts: Record<string, number>;
  optionPercentages: Record<string, number>;
}

export interface CreatePollRequest {
  type: "prediction" | "overunder";
  question: string;
  options: string[];
  closesAt: Date;
}

export interface VoteRequest {
  pollId: string;
  userId: string;
  selectedOption: string;
}

export interface PollStats {
  totalPolls: number;
  activePolls: number;
  totalVotes: number;
  mostPopularType: "prediction" | "overunder";
}

// Sample poll data for seeding
export const SAMPLE_POLLS = [
  {
    type: "prediction" as const,
    question: "Will PlayerX score 30+ points?",
    options: ["Yes", "No"],
    closesAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  },
  {
    type: "overunder" as const,
    question: "Total kills in this match will be:",
    options: ["Over 50", "Under 50"],
    closesAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
  },
  {
    type: "prediction" as const,
    question: "Which team will win the championship?",
    options: ["Team Alpha", "Team Beta", "Team Gamma"],
    closesAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
  },
  {
    type: "overunder" as const,
    question: "PlayerY's accuracy will be:",
    options: ["Over 80%", "Under 80%"],
    closesAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
  },
  {
    type: "prediction" as const,
    question: "Will there be an overtime?",
    options: ["Yes", "No"],
    closesAt: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
  },
];


