"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Play, ExternalLink, Star, Clock } from "lucide-react";

interface Clip {
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
  duration?: number;
  tags?: string[];
  isHighlight?: boolean;
}

interface ClipDisplayProps {
  competitionId: string;
  showClips?: boolean;
  maxClips?: number;
  showTrending?: boolean;
  showHighlights?: boolean;
  currentUserId?: string;
}

export default function ClipDisplay({
  competitionId,
  showClips = true,
  maxClips = 5,
  showTrending = true,
  showHighlights = true,
  currentUserId = "user123", // Temporary user ID for testing
}: ClipDisplayProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [trendingClips, setTrendingClips] = useState<Clip[]>([]);
  const [highlightClips, setHighlightClips] = useState<Clip[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!showClips) return;

    // Simulate Firestore subscription for clips
    const fetchClips = async () => {
      try {
        // In a real implementation, this would be a Firestore onSnapshot listener
        const response = await fetch(`/api/clips/${competitionId}`);
        const data = await response.json();
        
        setClips(data.clips || []);
        setTrendingClips(data.trending || []);
        setHighlightClips(data.highlights || []);
        
        // Initialize user votes
        const votes: Record<string, boolean> = {};
        data.clips?.forEach((clip: Clip) => {
          if (clip.votes[currentUserId] !== undefined) {
            votes[clip.id] = clip.votes[currentUserId];
          }
        });
        setUserVotes(votes);
        
      } catch (error) {
        console.error("Error fetching clips:", error);
        // Fallback to mock data for testing
        setClips(mockClips);
        setTrendingClips(mockClips.filter(clip => clip.surgeScore >= 80));
        setHighlightClips(mockClips.filter(clip => clip.isHighlight));
      } finally {
        setLoading(false);
      }
    };

    fetchClips();
  }, [competitionId, showClips, currentUserId]);

  const handleVote = async (clipId: string, vote: boolean) => {
    try {
      // Update local state immediately for better UX
      setUserVotes(prev => ({ ...prev, [clipId]: vote }));
      
      // In a real implementation, this would call the ClipService
      const response = await fetch(`/api/clips/${competitionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId,
          userId: currentUserId,
          vote,
        }),
      });

      if (!response.ok) {
        // Revert on error
        setUserVotes(prev => {
          const newVotes = { ...prev };
          delete newVotes[clipId];
          return newVotes;
        });
        throw new Error("Failed to vote");
      }

      // Refresh clips to get updated surge scores
      const updatedClips = clips.map(clip => {
        if (clip.id === clipId) {
          const newVotes = { ...clip.votes, [currentUserId]: vote };
          const upvotes = Object.values(newVotes).filter(v => v === true).length;
          const downvotes = Object.values(newVotes).filter(v => v === false).length;
          const newSurgeScore = Math.max(0, Math.min(100, upvotes * 10 - downvotes * 5));
          
          return { ...clip, votes: newVotes, surgeScore: newSurgeScore };
        }
        return clip;
      });
      
      setClips(updatedClips);
      
    } catch (error) {
      console.error("Error voting on clip:", error);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "twitch":
        return "🟣";
      case "youtube":
        return "🔴";
      case "kick":
        return "🟢";
      case "manual":
        return "📹";
      default:
        return "🎬";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "twitch":
        return "bg-purple-100 text-purple-800";
      case "youtube":
        return "bg-red-100 text-red-800";
      case "kick":
        return "bg-green-100 text-green-800";
      case "manual":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!showClips || loading) {
    return null;
  }

  const displayClips = clips.slice(0, maxClips);

  return (
    <div className="space-y-4">
      {/* Trending Clips Section */}
      {showTrending && trendingClips.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Trending Clips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {trendingClips.slice(0, 2).map((clip) => (
              <Card key={clip.id} className="relative overflow-hidden">
                {clip.isHighlight && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge className="bg-yellow-500 text-yellow-900">
                      <Star className="h-3 w-3 mr-1" />
                      Highlight
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm line-clamp-2">
                      {clip.description}
                    </CardTitle>
                    <Badge className={`ml-2 ${getSourceColor(clip.source)}`}>
                      {getSourceIcon(clip.source)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>Player: {clip.playerId}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(clip.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={userVotes[clip.id] === true ? "default" : "outline"}
                        onClick={() => handleVote(clip.id, true)}
                        className="h-6 px-2"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={userVotes[clip.id] === false ? "destructive" : "outline"}
                        onClick={() => handleVote(clip.id, false)}
                        className="h-6 px-2"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {clip.surgeScore}⭐
                      </Badge>
                      <Button size="sm" variant="outline" className="h-6 px-2">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Clips Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Play className="h-5 w-5 text-blue-500" />
          Recent Clips
        </h3>
        <div className="space-y-2">
          {displayClips.map((clip) => (
            <Card key={clip.id} className="relative">
              {clip.isHighlight && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="bg-yellow-500 text-yellow-900">
                    <Star className="h-3 w-3 mr-1" />
                    Highlight
                  </Badge>
                </div>
              )}
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1 mb-1">
                      {clip.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>{clip.playerId}</span>
                      <Badge className={`${getSourceColor(clip.source)} text-xs`}>
                        {getSourceIcon(clip.source)}
                      </Badge>
                      {clip.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(clip.duration)}
                        </span>
                      )}
                      <span>{formatTimeAgo(clip.createdAt)}</span>
                    </div>
                    {clip.tags && clip.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {clip.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant={userVotes[clip.id] === true ? "default" : "outline"}
                        onClick={() => handleVote(clip.id, true)}
                        className="h-6 w-6 p-0"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={userVotes[clip.id] === false ? "destructive" : "outline"}
                        onClick={() => handleVote(clip.id, false)}
                        className="h-6 w-6 p-0"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {clip.surgeScore}⭐
                    </Badge>
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Highlights Section */}
      {showHighlights && highlightClips.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Highlights
          </h3>
          <div className="space-y-2">
            {highlightClips.slice(0, 3).map((clip) => (
              <Card key={clip.id} className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1 mb-1">
                        {clip.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{clip.playerId}</span>
                        <Badge className={`${getSourceColor(clip.source)} text-xs`}>
                          {getSourceIcon(clip.source)}
                        </Badge>
                        <span>{formatTimeAgo(clip.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Badge className="bg-yellow-500 text-yellow-900 text-xs">
                        {clip.surgeScore}⭐
                      </Badge>
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data for testing
const mockClips: Clip[] = [
  {
    id: "1",
    playerId: "player123",
    url: "https://twitch.tv/clip/abc123",
    embedUrl: "https://clips.twitch.tv/embed?clip=abc123&parent=localhost",
    source: "twitch",
    description: "🔥 Insane 1v4 clutch in the finals",
    surgeScore: 95,
    votes: { user1: true, user2: true, user3: false },
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    thumbnailUrl: "https://clips-media-assets2.twitch.tv/abc123-preview.jpg",
    duration: 30,
    tags: ["clutch", "finals", "1v4"],
    isHighlight: true,
  },
  {
    id: "2",
    playerId: "player456",
    url: "https://youtube.com/watch?v=def456",
    embedUrl: "https://www.youtube.com/embed/def456",
    source: "youtube",
    description: "💀 Perfect headshot streak - 5 in a row!",
    surgeScore: 88,
    votes: { user1: true, user2: true, user3: true },
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    thumbnailUrl: "https://img.youtube.com/vi/def456/maxresdefault.jpg",
    duration: 45,
    tags: ["headshot", "streak", "accuracy"],
    isHighlight: true,
  },
  {
    id: "3",
    playerId: "player789",
    url: "https://kick.com/clip/ghi789",
    embedUrl: "https://player.kick.com/ghi789",
    source: "kick",
    description: "⚡ Lightning fast reaction time",
    surgeScore: 92,
    votes: {},
    createdAt: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
    thumbnailUrl: "https://kick.com/clip/ghi789/thumbnail.jpg",
    duration: 15,
    tags: ["reaction", "speed", "highlight"],
    isHighlight: false,
  },
  {
    id: "4",
    playerId: "player123",
    url: "https://youtube.com/watch?v=jkl012",
    embedUrl: "https://www.youtube.com/embed/jkl012",
    source: "youtube",
    description: "🏆 Championship winning play",
    surgeScore: 98,
    votes: { user1: true, user2: true, user3: true, user4: true },
    createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    thumbnailUrl: "https://img.youtube.com/vi/jkl012/maxresdefault.jpg",
    duration: 60,
    tags: ["championship", "winning", "epic"],
    isHighlight: false,
  },
  {
    id: "5",
    playerId: "player456",
    url: "https://twitch.tv/clip/mno345",
    embedUrl: "https://clips.twitch.tv/embed?clip=mno345&parent=localhost",
    source: "twitch",
    description: "🎯 Impossible shot from across the map",
    surgeScore: 85,
    votes: { user1: true, user2: false },
    createdAt: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
    thumbnailUrl: "https://clips-media-assets2.twitch.tv/mno345-preview.jpg",
    duration: 20,
    tags: ["impossible", "longshot", "amazing"],
    isHighlight: false,
  },
];
