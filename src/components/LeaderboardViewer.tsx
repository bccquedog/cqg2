"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Target, 
  Users, 
  Gamepad2,
  RefreshCw,
  Crown,
  Medal
} from "lucide-react";

interface LeaderboardPlayer {
  id: string;
  wins: number;
  losses: number;
  totalPoints: number;
  titles: number;
  gamesPlayed: number;
  lastUpdated?: string;
  tier?: string;
  badge?: string;
  rank?: number;
}

interface LeaderboardViewerProps {
  scope?: "global" | "game" | "league";
  filterId?: string;
  limit?: number;
  showTiers?: boolean;
  showRefresh?: boolean;
  className?: string;
}

export default function LeaderboardViewer({ 
  scope = "global", 
  filterId = "", 
  limit = 20,
  showTiers = true,
  showRefresh = true,
  className = ""
}: LeaderboardViewerProps) {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const getScopeIcon = () => {
    switch (scope) {
      case "global": return <Trophy className="h-5 w-5" />;
      case "game": return <Gamepad2 className="h-5 w-5" />;
      case "league": return <Users className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getScopeTitle = () => {
    switch (scope) {
      case "global": return "🌍 Global Leaderboard";
      case "game": return `🎮 ${filterId} Leaderboard`;
      case "league": return `🏆 ${filterId} Leaderboard`;
      default: return "📊 Leaderboard";
    }
  };

  const getTierBadge = (player: LeaderboardPlayer) => {
    if (!showTiers || !player.tier) return null;
    
    const tierColors: Record<string, string> = {
      "Grandmaster": "bg-purple-100 text-purple-800 border-purple-200",
      "Master": "bg-blue-100 text-blue-800 border-blue-200",
      "Diamond": "bg-cyan-100 text-cyan-800 border-cyan-200",
      "Platinum": "bg-gray-100 text-gray-800 border-gray-200",
      "Gold": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Silver": "bg-gray-100 text-gray-600 border-gray-200",
      "Bronze": "bg-orange-100 text-orange-800 border-orange-200"
    };

    return (
      <Badge className={tierColors[player.tier] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {player.tier}
      </Badge>
    );
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-orange-500" />;
    return <span className="font-bold text-lg">#{index + 1}</span>;
  };

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return "0%";
    return `${((wins / total) * 100).toFixed(1)}%`;
  };

  const refreshData = () => {
    setLoading(true);
    setError(null);
    // The useEffect will handle the refresh
  };

  useEffect(() => {
    let path = "leaderboards/global/players";
    if (scope !== "global" && filterId) {
      if (scope === "game") {
        path = `leaderboards/game-${filterId}/players`;
      } else if (scope === "league") {
        path = `leaderboards/league-${filterId}/players`;
      } else {
        path = `leaderboards/${filterId}/players`;
      }
    }

    setLoading(true);
    setError(null);

    const unsubscribe = db.collection(path)
      .orderBy("totalPoints", "desc")
      .orderBy("wins", "desc")
      .limit(limit)
      .onSnapshot(
        (snap) => {
          const data = snap.docs.map((d) => ({ 
            id: d.id, 
            ...d.data() 
          })) as LeaderboardPlayer[];
          
          // Add rank based on position
          const rankedData = data.map((player, index) => ({
            ...player,
            rank: index + 1
          }));

          setPlayers(rankedData);
          setLoading(false);
          setLastUpdated(new Date().toLocaleTimeString());
        },
        (err) => {
          console.error("Error fetching leaderboard data:", err);
          setError("Failed to load leaderboard data");
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [scope, filterId, limit]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            {showRefresh && (
              <Button onClick={refreshData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (players.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getScopeIcon()}
            {getScopeTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No leaderboard data available yet.</p>
            <p className="text-sm mt-2">Check back after some matches are played!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getScopeIcon()}
            {getScopeTitle()}
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdated}
              </span>
            )}
            {showRefresh && (
              <Button onClick={refreshData} variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2">
          {players.map((player, index) => (
            <div 
              key={player.id} 
              className={`p-4 border-b last:border-b-0 transition-colors ${
                index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 
                'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{player.id}</div>
                    {showTiers && getTierBadge(player)}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{player.wins || 0}</div>
                    <div className="text-xs text-muted-foreground">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-red-600">{player.losses || 0}</div>
                    <div className="text-xs text-muted-foreground">Losses</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">
                      {getWinRate(player.wins || 0, player.losses || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{player.totalPoints || 0}</div>
                    <div className="text-xs text-muted-foreground">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">{player.titles || 0}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Titles</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {players.length === limit && (
          <div className="p-4 text-center text-sm text-muted-foreground border-t">
            Showing top {limit} players
          </div>
        )}
      </CardContent>
    </Card>
  );
}