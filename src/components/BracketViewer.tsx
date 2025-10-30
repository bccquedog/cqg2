"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface BracketMatch {
  matchId: string;
  players: string[];
  status: "pending" | "live" | "completed";
  winner: string | null;
  scores: Record<string, number | null>;
  ticketCodes?: Record<string, string>;
}

interface BracketRound {
  roundNumber: number;
  matches: BracketMatch[];
}

interface BracketData {
  rounds: BracketRound[];
  currentRound: number;
  bracketType: "singleElim" | "doubleElim" | "roundRobin";
  createdAt: string;
}

export default function BracketViewer({ competitionId }: { competitionId: string }) {
  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = db
      .collection("tournaments")
      .doc(competitionId)
      .collection("bracket")
      .doc("bracketDoc")
      .onSnapshot(
        (snap) => {
          if (snap.exists) {
            setBracket(snap.data() as BracketData);
            setError(null);
          } else {
            setError("No bracket found for this tournament");
          }
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching bracket:", err);
          setError("Failed to load bracket");
          setLoading(false);
        }
      );
    return () => unsubscribe();
  }, [competitionId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "live":
        return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case "live":
        return <Badge variant="default" className="bg-blue-100 text-blue-800 animate-pulse">Live</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getBracketTypeDisplay = (type: string) => {
    switch (type) {
      case "singleElim":
        return "Single Elimination";
      case "doubleElim":
        return "Double Elimination";
      case "roundRobin":
        return "Round Robin";
      default:
        return type;
    }
  };

  const formatPlayerName = (player: string) => {
    if (!player || player === "TBD") return "TBD";
    return player;
  };

  const getTotalMatches = () => {
    if (!bracket) return 0;
    return bracket.rounds.reduce((total, round) => total + round.matches.length, 0);
  };

  const getCompletedMatches = () => {
    if (!bracket) return 0;
    return bracket.rounds.reduce((total, round) => 
      total + round.matches.filter(match => match.status === "completed").length, 0
    );
  };

  const getActiveMatches = () => {
    if (!bracket) return 0;
    return bracket.rounds.reduce((total, round) => 
      total + round.matches.filter(match => match.status === "live").length, 0
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading bracket...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bracket Not Available</h3>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!bracket) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="p-6 text-center">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bracket Found</h3>
          <p className="text-gray-600">This tournament doesn&apos;t have a bracket yet.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bracket Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Tournament Bracket
            </h2>
            <p className="text-gray-600 mt-1">
              {getBracketTypeDisplay(bracket.bracketType)} • {competitionId}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{getTotalMatches()} matches</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>{getCompletedMatches()} completed</span>
              </div>
              {getActiveMatches() > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{getActiveMatches()} live</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bracket Display */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Bracket Progress</h3>
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Round {bracket.currentRound} of {bracket.rounds.length}</span>
              <span>{getCompletedMatches()}/{getTotalMatches()} matches completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(getCompletedMatches() / getTotalMatches()) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-8 overflow-x-auto pb-4">
            {bracket.rounds.map((round, rIdx) => (
              <div key={rIdx} className="space-y-4 min-w-[280px] flex-shrink-0">
                <div className="text-center">
                  <h3 className="font-semibold text-lg text-gray-900">
                    Round {round.roundNumber}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {round.matches.length} match{round.matches.length !== 1 ? 'es' : ''}
                  </p>
                </div>
                
                <div className="space-y-3">
                  {round.matches.map((match) => (
                    <Card key={match.matchId} className="p-4 border-2 hover:border-blue-200 transition-colors">
                      <div className="space-y-3">
                        {/* Match Header */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-700">
                            {match.matchId}
                          </span>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(match.status)}
                            {getStatusBadge(match.status)}
                          </div>
                        </div>

                        {/* Players */}
                        <div className="space-y-2">
                          {match.players.map((player, pIdx) => (
                            <div
                              key={pIdx}
                              className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                                match.winner === player
                                  ? "bg-green-50 border border-green-200"
                                  : match.status === "live"
                                  ? "bg-blue-50 border border-blue-200"
                                  : "bg-gray-50 border border-gray-200"
                              }`}
                            >
                              <span className={`font-medium ${
                                match.winner === player
                                  ? "text-green-800"
                                  : match.status === "live"
                                  ? "text-blue-800"
                                  : "text-gray-800"
                              }`}>
                                {formatPlayerName(player)}
                              </span>
                              {match.scores?.[player] !== null && match.scores?.[player] !== undefined && (
                                <span className={`text-lg font-bold ${
                                  match.winner === player
                                    ? "text-green-600"
                                    : match.status === "live"
                                    ? "text-blue-600"
                                    : "text-gray-600"
                                }`}>
                                  {match.scores[player]}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Winner Display */}
                        {match.winner && (
                          <div className="flex items-center justify-center gap-2 p-2 bg-green-100 rounded-md">
                            <Trophy className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-800">
                              Winner: {formatPlayerName(match.winner)}
                            </span>
                          </div>
                        )}

                        {/* Match Info */}
                        <div className="text-xs text-gray-500 text-center">
                          {match.status === "completed" && "Match completed"}
                          {match.status === "live" && "Match in progress"}
                          {match.status === "pending" && "Awaiting start"}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bracket Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>Bracket created on {new Date(bracket.createdAt).toLocaleDateString()}</p>
        <p className="mt-1">Updates in real-time • Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
