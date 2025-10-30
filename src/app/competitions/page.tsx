"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Users, 
  Gamepad2,
  Calendar,
  Target,
  Crown,
  RefreshCw
} from "lucide-react";

interface Competition {
  id: string;
  name: string;
  game: string;
  type: "solo" | "clan";
  status: "upcoming" | "active" | "completed" | "cancelled";
  season: string;
  participants: string[];
  createdAt: string;
  startDate?: string;
  endDate?: string;
}

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCompetitions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load tournaments
        const tournamentsSnapshot = await db.collection("tournaments").get();
        const tournaments = tournamentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Competition[];

        // Load leagues
        const leaguesSnapshot = await db.collection("leagues").get();
        const leagues = leaguesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Competition[];

        // Combine and sort by creation date
        const allCompetitions = [...tournaments, ...leagues].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setCompetitions(allCompetitions);
        setLoading(false);
      } catch (err) {
        console.error("Error loading competitions:", err);
        setError("Failed to load competitions");
        setLoading(false);
      }
    };

    loadCompetitions();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      "upcoming": "bg-blue-100 text-blue-800 border-blue-200",
      "active": "bg-green-100 text-green-800 border-green-200",
      "completed": "bg-gray-100 text-gray-800 border-gray-200",
      "cancelled": "bg-red-100 text-red-800 border-red-200"
    };

    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    return type === "solo" ? <Target className="h-4 w-4" /> : <Users className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading competitions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Competitions</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🏆 Competitions</h1>
          <p className="text-lg text-gray-600">Discover and join exciting tournaments and leagues</p>
        </div>

        {competitions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Competitions Found</h2>
              <p className="text-gray-600">Check back later for new tournaments and leagues!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((competition) => (
              <Card key={competition.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{competition.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Gamepad2 className="h-4 w-4" />
                        {competition.game}
                      </div>
                    </div>
                    {getStatusBadge(competition.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      {getTypeIcon(competition.type)}
                      <span className="capitalize">{competition.type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Crown className="h-4 w-4" />
                      {competition.season}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{competition.participants.length} participants</span>
                  </div>

                  {competition.startDate && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Starts {formatDate(competition.startDate)}</span>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    onClick={() => window.location.href = `/competitions/${competition.id}`}
                  >
                    View Competition
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>About Competitions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Tournaments
                </h3>
                <p className="text-sm text-gray-600">
                  Single-elimination tournaments with brackets. Compete for prizes and glory!
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Leagues
                </h3>
                <p className="text-sm text-gray-600">
                  Season-long competitions with multiple matches and ongoing rankings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


