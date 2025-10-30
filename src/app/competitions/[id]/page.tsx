"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import BracketViewer from "@/components/BracketViewer";
import LeaderboardViewer from "@/components/LeaderboardViewer";
import ScheduleViewer from "@/components/ScheduleViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Trophy, 
  Calendar, 
  Users, 
  Gamepad2,
  DollarSign,
  Crown,
  Target,
  RefreshCw
} from "lucide-react";

interface Competition {
  id: string;
  name: string;
  game: string;
  type: "solo" | "clan";
  status: "upcoming" | "active" | "completed" | "cancelled";
  season: string;
  description?: string;
  maxParticipants?: number;
  participants: string[];
  createdAt: string;
  startDate?: string;
  endDate?: string;
  buyIn?: {
    enabled: boolean;
    amount: number;
    currency: string;
  };
  membershipRules?: {
    requiredFeatures: string[];
    hostRequired: string[];
  };
  createdBy?: string;
}

export default function CompetitionPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "bracket" | "schedule" | "leaderboard">("overview");
  const [scope, setScope] = useState<"global" | "game" | "league">("league");
  const [filterId, setFilterId] = useState("");

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    // Try to find the competition in tournaments first, then leagues
    const checkCompetition = async () => {
      try {
        // Check tournaments
        const tournamentDoc = await db.collection("tournaments").doc(id).get();
        if (tournamentDoc.exists) {
          const data = tournamentDoc.data();
          setCompetition({
            id: tournamentDoc.id,
            ...data
          } as Competition);
          setLoading(false);
          return;
        }

        // Check leagues
        const leagueDoc = await db.collection("leagues").doc(id).get();
        if (leagueDoc.exists) {
          const data = leagueDoc.data();
          setCompetition({
            id: leagueDoc.id,
            ...data
          } as Competition);
          setLoading(false);
          return;
        }

        // Competition not found
        setError("Competition not found");
        setLoading(false);
      } catch (err) {
        console.error("Error fetching competition:", err);
        setError("Failed to load competition data");
        setLoading(false);
      }
    };

    checkCompetition();
  }, [id]);

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
    return type === "solo" ? <Target className="h-5 w-5" /> : <Users className="h-5 w-5" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
            <Button onClick={() => window.history.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🏆 {competition.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Gamepad2 className="h-4 w-4" />
                  {competition.game}
                </div>
                <div className="flex items-center gap-1">
                  {getTypeIcon(competition.type)}
                  {competition.type === "solo" ? "Solo" : "Clan"}
                </div>
                <div className="flex items-center gap-1">
                  <Crown className="h-4 w-4" />
                  {competition.season}
                </div>
                {getStatusBadge(competition.status)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {competition.participants.length} participants
              </div>
              {competition.maxParticipants && (
                <div className="text-sm text-gray-600">
                  Max: {competition.maxParticipants}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: Trophy },
              { id: "bracket", label: "Bracket", icon: Target },
              { id: "schedule", label: "Schedule", icon: Calendar },
              { id: "leaderboard", label: "Leaderboard", icon: Crown }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "overview" | "bracket" | "schedule" | "leaderboard")}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Competition Details */}
            <Card>
              <CardHeader>
                <CardTitle>Competition Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {competition.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-600">{competition.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Game</h3>
                    <p className="text-gray-600">{competition.game}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Type</h3>
                    <p className="text-gray-600 capitalize">{competition.type}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Season</h3>
                    <p className="text-gray-600">{competition.season}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Status</h3>
                    {getStatusBadge(competition.status)}
                  </div>
                  {competition.startDate && (
                    <div>
                      <h3 className="font-semibold mb-2">Start Date</h3>
                      <p className="text-gray-600">{formatDate(competition.startDate)}</p>
                    </div>
                  )}
                  {competition.endDate && (
                    <div>
                      <h3 className="font-semibold mb-2">End Date</h3>
                      <p className="text-gray-600">{formatDate(competition.endDate)}</p>
                    </div>
                  )}
                </div>

                {competition.buyIn && (
                  <div>
                    <h3 className="font-semibold mb-2">Entry Fee</h3>
                    {competition.buyIn.enabled ? (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>{competition.buyIn.amount} {competition.buyIn.currency.toUpperCase()}</span>
                      </div>
                    ) : (
                      <span className="text-green-600">Free Entry</span>
                    )}
                  </div>
                )}

                {competition.membershipRules && (
                  <div>
                    <h3 className="font-semibold mb-2">Membership Requirements</h3>
                    <div className="space-y-2">
                      {competition.membershipRules.requiredFeatures.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600">Required to Join:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {competition.membershipRules.requiredFeatures.map((feature) => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {competition.membershipRules.hostRequired.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600">Required to Host:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {competition.membershipRules.hostRequired.map((feature) => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants ({competition.participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {competition.participants.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {competition.participants.map((participant) => (
                      <div key={participant} className="p-2 bg-gray-50 rounded text-sm">
                        {participant}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No participants yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "bracket" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Tournament Bracket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BracketViewer competitionId={id} />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Competition Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScheduleViewer 
                  competitionId={id} 
                  competitionType={competition.type === "solo" ? "tournament" : "league"}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Competition Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Scope Controls */}
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button
                    variant={scope === "global" ? "default" : "outline"}
                    onClick={() => {
                      setScope("global");
                      setFilterId("");
                    }}
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

                <LeaderboardViewer 
                  scope={scope} 
                  filterId={scope === "league" && !filterId ? id : filterId}
                  limit={20}
                  showTiers={true}
                  showRefresh={true}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
