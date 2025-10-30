export interface Clip {
  id: string;
  playerId: string;
  url: string; // external link
  embedUrl: string; // for iframe
  source: "twitch" | "youtube" | "kick" | "manual";
  description: string;
  surgeScore: number;
  votes: Record<string, boolean>; // userId -> true (upvote) | false (downvote)
  createdAt: Date;
  thumbnailUrl?: string;
  duration?: number; // in seconds
  tags?: string[];
  isHighlight?: boolean;
}

export interface CreateClipRequest {
  playerId: string;
  url: string; // external link
  embedUrl: string; // for iframe
  source: "twitch" | "youtube" | "kick" | "manual";
  description: string;
  surgeScore?: number;
  thumbnailUrl?: string;
  duration?: number;
  tags?: string[];
}

export interface VoteClipRequest {
  clipId: string;
  userId: string;
  vote: boolean; // true for upvote, false for downvote
}

export interface ClipStats {
  totalClips: number;
  totalVotes: number;
  averageSurgeScore: number;
  topSource: "twitch" | "youtube" | "kick" | "manual";
  mostActivePlayer: string;
}

export interface ClipFilters {
  playerId?: string;
  source?: "twitch" | "youtube" | "kick" | "manual";
  minSurgeScore?: number;
  isHighlight?: boolean;
  tags?: string[];
}

// Sample clip data for seeding
export const SAMPLE_CLIPS = [
  {
    playerId: "player123",
    url: "https://twitch.tv/clip/abc123",
    embedUrl: "https://clips.twitch.tv/embed?clip=abc123&parent=localhost",
    source: "twitch" as const,
    description: "🔥 Insane 1v4 clutch in the finals",
    surgeScore: 95,
    thumbnailUrl: "https://clips-media-assets2.twitch.tv/abc123-preview.jpg",
    duration: 30,
    tags: ["clutch", "finals", "1v4"],
    isHighlight: true,
  },
  {
    playerId: "player456",
    url: "https://youtube.com/watch?v=def456",
    embedUrl: "https://www.youtube.com/embed/def456",
    source: "youtube" as const,
    description: "💀 Perfect headshot streak - 5 in a row!",
    surgeScore: 88,
    thumbnailUrl: "https://img.youtube.com/vi/def456/maxresdefault.jpg",
    duration: 45,
    tags: ["headshot", "streak", "accuracy"],
    isHighlight: true,
  },
  {
    playerId: "player789",
    url: "https://kick.com/clip/ghi789",
    embedUrl: "https://player.kick.com/ghi789",
    source: "kick" as const,
    description: "⚡ Lightning fast reaction time",
    surgeScore: 92,
    thumbnailUrl: "https://kick.com/clip/ghi789/thumbnail.jpg",
    duration: 15,
    tags: ["reaction", "speed", "highlight"],
    isHighlight: false,
  },
  {
    playerId: "player123",
    url: "https://youtube.com/watch?v=jkl012",
    embedUrl: "https://www.youtube.com/embed/jkl012",
    source: "youtube" as const,
    description: "🏆 Championship winning play",
    surgeScore: 98,
    thumbnailUrl: "https://img.youtube.com/vi/jkl012/maxresdefault.jpg",
    duration: 60,
    tags: ["championship", "winning", "epic"],
    isHighlight: true,
  },
  {
    playerId: "player456",
    url: "https://twitch.tv/clip/mno345",
    embedUrl: "https://clips.twitch.tv/embed?clip=mno345&parent=localhost",
    source: "twitch" as const,
    description: "🎯 Impossible shot from across the map",
    surgeScore: 85,
    thumbnailUrl: "https://clips-media-assets2.twitch.tv/mno345-preview.jpg",
    duration: 20,
    tags: ["impossible", "longshot", "amazing"],
    isHighlight: false,
  },
];
