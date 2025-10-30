import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Target, 
  Users, 
  Search, 
  RefreshCw,
  TrendingUp,
  Award,
  Gamepad2
} from "lucide-react";

interface LeaderboardPlayer {
  id: string;
  wins: number;
  losses: number;
  totalPoints: number;
  titles: number;
  gamesPlayed: number;
  lastUpdated?: string;
  rank?: number;
  tier?: string;
  badge?: string;
}

export default function LeaderboardPanel() {
  const [scope, setScope] = useState<"global" | "game" | "league">("global");
  const [filterId, setFilterId] = useState<string>("");
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let path = "leaderboards/global/players";
    if (scope === "game" && filterId) path = `leaderboards/game-${filterId}/players`;
    if (scope === "league" && filterId) path = `leaderboards/league-${filterId}/players`;

    setLoading(true);
    setError(null);

    const unsubscribe = db.collection(path).onSnapshot(
      (snap) => {
        const data = snap.docs.map((d) => ({ 
          id: d.id, 
          ...d.data() 
        })) as LeaderboardPlayer[];
        
        // Sort by total points descending, then by wins
        const sortedData = data.sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          return b.wins - a.wins;
        });

        // Add rank
        const rankedData = sortedData.map((player, index) => ({
          ...player,
          rank: index + 1
        }));

        setPlayers(rankedData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching leaderboard data:", err);
        setError("Failed to load leaderboard data");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [scope, filterId]);

  const filteredPlayers = players.filter((p) =>
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const getScopeIcon = () => {
    switch (scope) {
      case "global": return <Trophy className="h-4 w-4" />;
      case "game": return <Gamepad2 className="h-4 w-4" />;
      case "league": return <Users className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getTierBadge = (player: LeaderboardPlayer) => {
    if (!player.tier) return null;
    
    const tierColors: Record<string, string> = {
      "Grandmaster": "bg-purple-100 text-purple-800",
      "Master": "bg-blue-100 text-blue-800",
      "Diamond": "bg-cyan-100 text-cyan-800",
      "Platinum": "bg-gray-100 text-gray-800",
      "Gold": "bg-yellow-100 text-yellow-800",
      "Silver": "bg-gray-100 text-gray-600",
      "Bronze": "bg-orange-100 text-orange-800"
    };

    return (
      <Badge className={tierColors[player.tier] || "bg-gray-100 text-gray-800"}>
        {player.tier}
      </Badge>
    );
  };

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return "0%";
    return `${((wins / total) * 100).toFixed(1)}%`;
  };

  const refreshData = () => {
    setLoading(true);
    // The useEffect will handle the refresh
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getScopeIcon()}
          <h2 className="text-2xl font-bold">📊 Leaderboard Panel</h2>
        </div>
        <Button 
          onClick={refreshData} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Scope Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leaderboard Scope</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button
              variant={scope === "global" ? "default" : "outline"}
              onClick={() => setScope("global")}
              className="flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              Global
            </Button>
            <Button
              variant={scope === "game" ? "default" : "outline"}
              onClick={() => setScope("game")}
              className="flex items-center gap-2"
            >
              <Gamepad2 className="h-4 w-4" />
              Game
            </Button>
            <Button
              variant={scope === "league" ? "default" : "outline"}
              onClick={() => setScope("league")}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              League
            </Button>
            {scope !== "global" && (
              <Input
                placeholder={`Enter ${scope} ID`}
                value={filterId}
                onChange={(e) => setFilterId(e.target.value)}
                className="w-64"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search and Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search player ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Total Players: {players.length}</span>
              <span>Filtered: {filteredPlayers.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {scope === "global" ? "Global" : scope === "game" ? "Game" : "League"} Leaderboard
            {scope !== "global" && filterId && ` - ${filterId}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading leaderboard data...
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No players found matching your search." : "No players found in this leaderboard."}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-8 gap-4 font-bold border-b pb-2 text-sm">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Rank
                </div>
                <div>Player</div>
                <div>Wins</div>
                <div>Losses</div>
                <div>Win Rate</div>
                <div>Points</div>
                <div>Titles</div>
                <div>Tier</div>
              </div>

              {/* Table Rows */}
              {filteredPlayers.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`grid grid-cols-8 gap-4 py-3 px-2 rounded-lg transition-colors ${
                    index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 
                    'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {index < 3 && (
                      <span className="text-lg">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </span>
                    )}
                    <span className="font-mono text-sm">#{player.rank}</span>
                  </div>
                  <div className="font-medium truncate">{player.id}</div>
                  <div className="text-green-600 font-semibold">{player.wins || 0}</div>
                  <div className="text-red-600 font-semibold">{player.losses || 0}</div>
                  <div className="text-blue-600 font-semibold">
                    {getWinRate(player.wins || 0, player.losses || 0)}
                  </div>
                  <div className="font-bold text-lg">{player.totalPoints || 0}</div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{player.titles || 0}</span>
                  </div>
                  <div>
                    {getTierBadge(player)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {filteredPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leaderboard Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredPlayers.reduce((sum, p) => sum + (p.wins || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Wins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {filteredPlayers.reduce((sum, p) => sum + (p.losses || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Losses</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {filteredPlayers.reduce((sum, p) => sum + (p.totalPoints || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredPlayers.reduce((sum, p) => sum + (p.titles || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Titles</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}