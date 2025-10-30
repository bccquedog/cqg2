"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ScoreSubmitter from "@/components/ScoreSubmitter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Users, 
  Clock,
  Target,
  RefreshCw
} from "lucide-react";

interface Match {
  id: string;
  competitionId: string;
  players: string[];
  status: "upcoming" | "active" | "completed";
  startTime?: string;
  endTime?: string;
  scores?: Record<string, number>;
  winner?: string;
}

export default function MatchPage() {
  const params = useParams();
  const matchId = params.id as string;
  
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId] = useState("user1"); // In real app, get from auth

  useEffect(() => {
    if (!matchId) return;

    setLoading(true);
    setError(null);

    // In a real app, you'd fetch from the actual match collection
    // For now, we'll simulate a match
    const simulateMatch = () => {
      setTimeout(() => {
        setMatch({
          id: matchId,
          competitionId: "soloCupS1",
          players: ["user1", "user2"],
          status: "active",
          startTime: new Date().toISOString(),
          scores: {}
        });
        setLoading(false);
      }, 1000);
    };

    simulateMatch();
  }, [matchId]);

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      "upcoming": "bg-blue-100 text-blue-800 border-blue-200",
      "active": "bg-green-100 text-green-800 border-green-200",
      "completed": "bg-gray-100 text-gray-800 border-gray-200"
    };

    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading match...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Match Not Found</h2>
            <p className="text-gray-600 mb-4">{error || "The match you're looking for doesn't exist."}</p>
            <button 
              onClick={() => window.history.back()} 
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Go Back
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        {/* Match Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏆 Match {match.id}</h1>
          <p className="text-lg text-gray-600">Competition: {match.competitionId}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Match Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Match Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-600">Status:</span>
                {getStatusBadge(match.status)}
              </div>
              
              <div>
                <span className="font-medium text-gray-600">Players:</span>
                <div className="mt-2 space-y-2">
                  {match.players.map((player) => (
                    <div key={player} className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900">{player}</span>
                      {match.scores && match.scores[player] !== undefined && (
                        <Badge variant="outline">
                          Score: {match.scores[player]}
                        </Badge>
                      )}
                      {match.winner === player && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Winner
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {match.startTime && (
                <div>
                  <span className="font-medium text-gray-600">Start Time:</span>
                  <p className="text-gray-900">{formatTime(match.startTime)}</p>
                </div>
              )}

              {match.endTime && (
                <div>
                  <span className="font-medium text-gray-600">End Time:</span>
                  <p className="text-gray-900">{formatTime(match.endTime)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score Submission */}
          {match.status === "active" && (
            <div>
              <ScoreSubmitter
                competitionId={match.competitionId}
                matchId={match.id}
                userId={currentUserId}
                maxScore={100}
                minScore={0}
                allowDecimal={false}
              />
            </div>
          )}

          {/* Match Results */}
          {match.status === "completed" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Match Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {match.winner ? (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 mb-2">
                      🏆 {match.winner} Wins!
                    </div>
                    <div className="space-y-2">
                      {match.players.map((player) => (
                        <div key={player} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>{player}</span>
                          <span className="font-semibold">
                            {match.scores?.[player] || 0} points
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 text-center">Match completed - results pending</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Match */}
          {match.status === "upcoming" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Match Not Started
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  This match hasn&apos;t started yet. Check back when the match begins to submit your score.
                </p>
                {match.startTime && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Starts at: {formatTime(match.startTime)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation */}
        <div className="text-center">
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            Back to Competition
          </button>
        </div>
      </div>
    </div>
  );
}
