"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Star, 
  TrendingUp, 
  Trophy, 
  Clock,
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Settings,
  RefreshCw,
  Crown,
  Target,
  Gamepad2
} from "lucide-react";

interface Alert {
  id: string;
  message: string;
  type: "score" | "winner" | "milestone" | "highlight" | "system";
  timestamp: unknown;
  playerId?: string;
  matchId?: string;
  priority: "low" | "medium" | "high" | "critical";
}

interface Spotlight {
  id: string;
  playerId: string;
  title: string;
  description: string;
  type: "weekly" | "live" | "featured" | "rising";
  stats?: {
    wins: number;
    losses: number;
    winRate: number;
    currentStreak: number;
  };
  achievements?: string[];
  startTime?: unknown;
  endTime?: unknown;
}

interface SpectatorStats {
  totalViewers: number;
  peakViewers: number;
  chatMessages: number;
  reactions: number;
  shares: number;
}

interface Poll {
  id: string;
  type: "prediction" | "overunder";
  question: string;
  options: string[];
  votes: Record<string, string>;
  createdAt: any;
  closesAt: any;
  isActive: boolean;
}

interface SpectatorOverlayProps {
  competitionId: string;
  className?: string;
  showStats?: boolean;
  showChat?: boolean;
  showSpotlight?: boolean;
  showAlerts?: boolean;
  showPolls?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function SpectatorOverlay({ 
  competitionId,
  className = "",
  showStats = true,
  showChat = true,
  showSpotlight = true,
  showAlerts = true,
  showPolls = true,
  autoRefresh = true,
  refreshInterval = 5000
}: SpectatorOverlayProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
  const [stats, setStats] = useState<SpectatorStats | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; user: string; message: string; timestamp: unknown; type: "user" | "system" }>>([]);
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId] = useState(() => `user_${crypto.randomUUID().slice(0, 8)}`);

  useEffect(() => {
    if (!competitionId) return;

    setLoading(true);
    setError(null);

    const unsubscribes: (() => void)[] = [];

    try {
      // Listen to live alerts feed
      if (showAlerts) {
        const alertsUnsubscribe = db
          .collection("tournaments")
          .doc(competitionId)
          .collection("alerts")
          .orderBy("timestamp", "desc")
          .limit(10)
          .onSnapshot(
            (snap) => {
              const alertsData = snap.docs.map((d) => ({
                id: d.id,
                ...d.data()
              })) as Alert[];
              setAlerts(alertsData);
            },
            (err) => {
              console.error("Error fetching alerts:", err);
              setError("Failed to load live alerts");
            }
          );
        unsubscribes.push(alertsUnsubscribe);
      }

      // Spotlight (could be weekly or live event)
      if (showSpotlight) {
        const spotlightUnsubscribe = db
          .collection("tournaments")
          .doc(competitionId)
          .collection("spotlights")
          .doc("current")
          .onSnapshot(
            (snap) => {
              if (snap.exists()) {
                setSpotlight({ id: snap.id, ...snap.data() } as Spotlight);
              } else {
                setSpotlight(null);
              }
            },
            (err) => {
              console.error("Error fetching spotlight:", err);
              setError("Failed to load player spotlight");
            }
          );
        unsubscribes.push(spotlightUnsubscribe);
      }

      // Spectator stats
      if (showStats) {
        const statsUnsubscribe = db
          .collection("tournaments")
          .doc(competitionId)
          .collection("spectatorStats")
          .doc("live")
          .onSnapshot(
            (snap) => {
              if (snap.exists()) {
                setStats(snap.data() as SpectatorStats);
              }
            },
            (err) => {
              console.error("Error fetching stats:", err);
              setError("Failed to load spectator stats");
            }
          );
        unsubscribes.push(statsUnsubscribe);
      }

      // Chat messages
      if (showChat) {
        const chatUnsubscribe = db
          .collection("tournaments")
          .doc(competitionId)
          .collection("chat")
          .orderBy("timestamp", "desc")
          .limit(20)
          .onSnapshot(
            (snap) => {
              const chatData = snap.docs.map((d) => ({
                id: d.id,
                ...d.data()
              })) as Array<{ id: string; user: string; message: string; timestamp: unknown; type: "user" | "system" }>;
              setChatMessages(chatData.reverse()); // Show oldest first
            },
            (err) => {
              console.error("Error fetching chat:", err);
              setError("Failed to load chat messages");
            }
          );
        unsubscribes.push(chatUnsubscribe);
      }

      // Active Polls
      if (showPolls) {
        const pollsUnsubscribe = db
          .collection("tournaments")
          .doc(competitionId)
          .collection("polls")
          .where("isActive", "==", true)
          .onSnapshot(
            (snap) => {
              const pollsData = snap.docs
                .map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                  createdAt: doc.data().createdAt,
                  closesAt: doc.data().closesAt,
                })) as Poll[];

              // Filter out expired polls and sort by closing time
              const now = new Date();
              const activePollsData = pollsData
                .filter(poll => poll.closesAt.toDate() > now)
                .sort((a, b) => a.closesAt.toDate().getTime() - b.closesAt.toDate().getTime());

              setActivePolls(activePollsData);

              // Track user votes
              const votes: Record<string, string> = {};
              activePollsData.forEach(poll => {
                if (poll.votes[currentUserId]) {
                  votes[poll.id] = poll.votes[currentUserId];
                }
              });
              setUserVotes(votes);
            },
            (err) => {
              console.error("Error fetching polls:", err);
              setError("Failed to load polls");
            }
          );
        unsubscribes.push(pollsUnsubscribe);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error setting up spectator overlay:", err);
      setError("Failed to initialize spectator features");
      setLoading(false);
    }

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [competitionId, showAlerts, showSpotlight, showStats, showChat, showPolls, currentUserId]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "score": return <Target className="h-4 w-4" />;
      case "winner": return <Trophy className="h-4 w-4" />;
      case "milestone": return <Star className="h-4 w-4" />;
      case "highlight": return <Zap className="h-4 w-4" />;
      case "system": return <Settings className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 border-red-300 text-red-800";
      case "high": return "bg-orange-100 border-orange-300 text-orange-800";
      case "medium": return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "low": return "bg-blue-100 border-blue-300 text-blue-800";
      default: return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getSpotlightTypeColor = (type: string) => {
    switch (type) {
      case "weekly": return "bg-purple-100 border-purple-300 text-purple-800";
      case "live": return "bg-green-100 border-green-300 text-green-800";
      case "featured": return "bg-gold-100 border-gold-300 text-gold-800";
      case "rising": return "bg-blue-100 border-blue-300 text-blue-800";
      default: return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const formatTimestamp = (timestamp: unknown) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleRefresh = () => {
    setLoading(true);
    // Force refresh by re-running useEffect
    window.location.reload();
  };

  const castVote = async (pollId: string, option: string) => {
    try {
      await db
        .collection("tournaments")
        .doc(competitionId)
        .collection("polls")
        .doc(pollId)
        .update({
          [`votes.${currentUserId}`]: option,
        });
    } catch (error) {
      console.error("Error casting vote:", error);
    }
  };

  const formatTimeRemaining = (closesAt: any): string => {
    const now = new Date();
    const closeTime = closesAt.toDate();
    const timeLeft = closeTime.getTime() - now.getTime();
    
    if (timeLeft <= 0) return "Closed";
    
    const minutes = Math.floor(timeLeft / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const calculatePollResults = (poll: Poll) => {
    const totalVotes = Object.keys(poll.votes).length;
    const optionCounts: Record<string, number> = {};
    const optionPercentages: Record<string, number> = {};

    // Initialize counts
    poll.options.forEach(option => {
      optionCounts[option] = 0;
    });

    // Count votes
    Object.values(poll.votes).forEach(vote => {
      optionCounts[vote] = (optionCounts[vote] || 0) + 1;
    });

    // Calculate percentages
    poll.options.forEach(option => {
      optionPercentages[option] = totalVotes > 0 
        ? Math.round((optionCounts[option] / totalVotes) * 100) 
        : 0;
    });

    return { totalVotes, optionCounts, optionPercentages };
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading spectator features...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-800">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Error: {error}</span>
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Gamepad2 className="h-5 w-5" />
          Spectator Hub
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleMuteToggle}
            className="flex items-center gap-1"
          >
            {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            {isMuted ? "Unmute" : "Mute"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </div>

      {/* Spectator Stats */}
      {showStats && stats && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Live Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalViewers}</div>
                <div className="text-xs text-blue-600">Viewers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.peakViewers}</div>
                <div className="text-xs text-purple-600">Peak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.chatMessages}</div>
                <div className="text-xs text-green-600">Messages</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.reactions}</div>
                <div className="text-xs text-orange-600">Reactions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Alerts */}
      {showAlerts && alerts.length > 0 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Live Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {alerts.slice(0, isExpanded ? alerts.length : 3).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-2 rounded border text-xs ${getAlertColor(alert.priority)}`}
                >
                  <div className="flex items-start gap-2">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-xs opacity-75">{formatTimestamp(alert.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {alerts.length > 3 && !isExpanded && (
              <p className="text-xs text-yellow-600 mt-2">
                +{alerts.length - 3} more alerts
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Player Spotlight */}
      {showSpotlight && spotlight && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Player Spotlight
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={getSpotlightTypeColor(spotlight.type)}>
                  {spotlight.type.toUpperCase()}
                </Badge>
                <span className="font-semibold text-purple-900">{spotlight.playerId}</span>
              </div>
              
              <div>
                <h4 className="font-medium text-purple-900">{spotlight.title}</h4>
                <p className="text-sm text-purple-700">{spotlight.description}</p>
              </div>

              {spotlight.stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded border">
                    <div className="text-lg font-bold text-green-600">{spotlight.stats.wins}</div>
                    <div className="text-xs text-gray-600">Wins</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-lg font-bold text-red-600">{spotlight.stats.losses}</div>
                    <div className="text-xs text-gray-600">Losses</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-lg font-bold text-blue-600">{spotlight.stats.winRate}%</div>
                    <div className="text-xs text-gray-600">Win Rate</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-lg font-bold text-orange-600">{spotlight.stats.currentStreak}</div>
                    <div className="text-xs text-gray-600">Streak</div>
                  </div>
                </div>
              )}

              {spotlight.achievements && spotlight.achievements.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-purple-800 mb-1">Recent Achievements:</p>
                  <div className="flex flex-wrap gap-1">
                    {spotlight.achievements.slice(0, 3).map((achievement, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {achievement}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Chat */}
      {showChat && chatMessages.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Live Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {chatMessages.slice(0, isExpanded ? chatMessages.length : 5).map((msg) => (
                <div key={msg.id} className="flex items-start gap-2 text-xs">
                  <span className="font-medium text-green-700 min-w-0 flex-shrink-0">
                    {msg.type === "system" ? "🤖" : "👤"} {msg.user}:
                  </span>
                  <span className="text-gray-700 flex-1">{msg.message}</span>
                  <span className="text-gray-500 text-xs flex-shrink-0">
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>
              ))}
            </div>
            {chatMessages.length > 5 && !isExpanded && (
              <p className="text-xs text-green-600 mt-2">
                +{chatMessages.length - 5} more messages
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Live Polls */}
      {showPolls && activePolls.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Live Polls
              <Badge variant="secondary" className="bg-blue-200 text-blue-800 text-xs">
                {activePolls.length} active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {activePolls.slice(0, isExpanded ? activePolls.length : 2).map((poll) => {
                const results = calculatePollResults(poll);
                const timeRemaining = formatTimeRemaining(poll.closesAt);
                const userVote = userVotes[poll.id];
                const isExpired = timeRemaining === "Closed";

                return (
                  <div key={poll.id} className="p-3 bg-white/50 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-blue-800 text-sm">{poll.question}</h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              poll.type === 'prediction' 
                                ? 'border-green-300 text-green-700' 
                                : 'border-orange-300 text-orange-700'
                            }`}
                          >
                            {poll.type.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>⏰ {timeRemaining}</span>
                          <span>•</span>
                          <span>👥 {results.totalVotes} votes</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {poll.options.map((option) => {
                        const count = results.optionCounts[option];
                        const percentage = results.optionPercentages[option];
                        const isUserChoice = userVote === option;

                        return (
                          <div key={option} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <Button
                                onClick={() => castVote(poll.id, option)}
                                disabled={!!userVote || isExpired}
                                variant={isUserChoice ? "default" : "outline"}
                                size="sm"
                                className={`flex-1 mr-2 text-xs ${
                                  isUserChoice 
                                    ? 'bg-blue-600 hover:bg-blue-700' 
                                    : 'hover:bg-blue-50'
                                }`}
                              >
                                {option}
                                {isUserChoice && <span className="ml-1">✓</span>}
                              </Button>
                              <div className="text-xs font-medium text-gray-700 min-w-[50px] text-right">
                                {percentage}% ({count})
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {userVote && (
                      <div className="mt-2 text-xs text-green-600 font-medium">
                        ✓ You voted: {userVote}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {activePolls.length > 2 && !isExpanded && (
              <div className="mt-3 text-center">
                <Badge variant="outline" className="text-xs">
                  +{activePolls.length - 2} more polls
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showPolls && activePolls.length === 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center text-gray-500">
              <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No active polls at the moment</p>
              <p className="text-xs mt-1">Check back during live matches!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="flex items-center gap-1">
          <Heart className="h-3 w-3" />
          React
        </Button>
        <Button size="sm" variant="outline" className="flex items-center gap-1">
          <Share2 className="h-3 w-3" />
          Share
        </Button>
        <Button size="sm" variant="outline" className="flex items-center gap-1">
          <Crown className="h-3 w-3" />
          Follow
        </Button>
      </div>

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <div className="text-xs text-gray-500 text-center">
          <Clock className="h-3 w-3 inline mr-1" />
          Auto-refreshing every {refreshInterval / 1000}s
        </div>
      )}
    </div>
  );
}
