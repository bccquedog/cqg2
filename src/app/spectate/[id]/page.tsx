"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import SpectatorOverlay from "@/components/SpectatorOverlay";
import BracketViewer from "@/components/BracketViewer";
import LeaderboardViewer from "@/components/LeaderboardViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Users, 
  Gamepad2,
  Clock,
  Target,
  RefreshCw,
  Eye,
  Volume2,
  VolumeX,
  Settings
} from "lucide-react";

interface Competition {
  id: string;
  name: string;
  type: "tournament" | "league";
  game: string;
  status: "upcoming" | "active" | "completed";
  startTime?: string;
  endTime?: string;
  participants: string[];
  description?: string;
}

export default function SpectatePage() {
  const params = useParams();
  const competitionId = params.id as string;
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    if (!competitionId) return;

    setLoading(true);
    setError(null);

    // In a real app, you'd fetch from the actual competition collection
    // For now, we'll simulate a competition
    const simulateCompetition = () => {
      setTimeout(() => {
        setCompetition({
          id: competitionId,
          name: competitionId === "soloCupS1" ? "Solo Cup Season 1" : "Competition",
          type: "tournament",
          game: "Madden NFL",
          status: "active",
          startTime: new Date().toISOString(),
          participants: ["user1", "user2", "user3", "user4"],
          description: "An exciting tournament featuring the best players in the league."
        });
        setLoading(false);
      }, 1000);
    };

    simulateCompetition();
  }, [competitionId]);

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

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading competition...</p>
        </div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Competition Not Found</h2>
            <p className="text-gray-600 mb-4">{error || "The competition you're looking for doesn't exist."}</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="h-6 w-6" />
              Spectating: {competition.name}
            </h1>
            <p className="text-gray-600">{competition.game} • {competition.type}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleMuteToggle}
              className="flex items-center gap-1"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {isMuted ? "Unmute" : "Mute"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowOverlay(!showOverlay)}
              className="flex items-center gap-1"
            >
              <Settings className="h-4 w-4" />
              {showOverlay ? "Hide" : "Show"} Overlay
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            {/* Competition Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Competition Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <div className="mt-1">{getStatusBadge(competition.status)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Game:</span>
                    <p className="text-gray-900">{competition.game}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Participants:</span>
                    <p className="text-gray-900">{competition.participants.length} players</p>
                  </div>
                </div>
                
                {competition.startTime && (
                  <div>
                    <span className="font-medium text-gray-600">Start Time:</span>
                    <p className="text-gray-900">{formatTime(competition.startTime)}</p>
                  </div>
                )}

                {competition.description && (
                  <div>
                    <span className="font-medium text-gray-600">Description:</span>
                    <p className="text-gray-900">{competition.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bracket */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Tournament Bracket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BracketViewer competitionId={competitionId} />
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Live Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LeaderboardViewer 
                  scope="league" 
                  filterId={competitionId}
                  limit={10}
                  showTiers={true}
                  showRefresh={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Spectator Overlay Sidebar */}
        {showOverlay && (
          <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Spectator Hub
              </h2>
              <p className="text-sm text-gray-600">Live updates and community features</p>
            </div>
            
            <SpectatorOverlay
              competitionId={competitionId}
              showStats={true}
              showChat={true}
              showSpotlight={true}
              showAlerts={true}
              autoRefresh={true}
              refreshInterval={5000}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>Competition ID: {competitionId}</span>
            <span>•</span>
            <span>Status: {competition.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Live Spectating</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}


