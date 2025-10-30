"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, onSnapshot, collection, getDocs, query, orderBy, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const matchId = params.matchId as string;
  
  const [match, setMatch] = useState<any>(null);
  const [tournament, setTournament] = useState<any>(null);
  const [playerAProfile, setPlayerAProfile] = useState<any>(null);
  const [playerBProfile, setPlayerBProfile] = useState<any>(null);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);
  const [clips, setClips] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [pollData, setPollData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Admin controls state
  const [isAdmin, setIsAdmin] = useState(true); // Mock admin mode for testing
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [adminScoreA, setAdminScoreA] = useState<string>("");
  const [adminScoreB, setAdminScoreB] = useState<string>("");
  const [adminStatus, setAdminStatus] = useState<string>("scheduled");
  const [adminWinner, setAdminWinner] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  // Get round name helper
  const getRoundName = (roundNumber: number, totalRounds: number = 4) => {
    if (roundNumber === totalRounds) return "Final";
    if (roundNumber === totalRounds - 1) return "Semifinal";
    if (roundNumber === totalRounds - 2) return "Quarterfinals";
    return `Round ${roundNumber}`;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch tournament data
        const tournamentDoc = await getDoc(doc(db, "tournaments", tournamentId));
        if (tournamentDoc.exists()) {
          setTournament({ id: tournamentDoc.id, ...tournamentDoc.data() });
        }

        // Fetch all matches for navigation
        const matchesQuery = query(
          collection(db, "tournaments", tournamentId, "matches"),
          orderBy("round", "asc")
        );
        const matchesSnapshot = await getDocs(matchesQuery);
        const matchesData = matchesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllMatches(matchesData);
        
        // Find current match index
        const currentIndex = matchesData.findIndex(m => m.id === matchId);
        setCurrentMatchIndex(currentIndex);

        // Mock clips data (future-ready)
        setClips([
          {
            id: "clip1",
            title: "Amazing Headshot",
            thumbnail: "https://via.placeholder.com/120x68",
            uploader: "ClipMaster",
            upvotes: 42,
            duration: "0:15"
          },
          {
            id: "clip2", 
            title: "Epic Comeback",
            thumbnail: "https://via.placeholder.com/120x68",
            uploader: "HighlightHero",
            upvotes: 28,
            duration: "0:23"
          }
        ]);

        // Mock chat messages
        setChatMessages([
          { id: 1, user: "Fan123", message: "This match is intense!", timestamp: "2m ago" },
          { id: 2, user: "ProGamer", message: "Player 1 looking strong", timestamp: "1m ago" },
          { id: 3, user: "Spectator", message: "Great plays from both!", timestamp: "30s ago" }
        ]);

        // Mock poll data will be set after match data is loaded

      } catch (error) {
        console.error("Error fetching tournament data:", error);
      }
    };

    if (tournamentId) {
      fetchInitialData();
    }
  }, [tournamentId, matchId]);

  // Real-time match listener
  useEffect(() => {
    if (!tournamentId || !matchId) return;

    const matchRef = doc(db, "tournaments", tournamentId, "matches", matchId);
    
    const unsubscribe = onSnapshot(matchRef, async (snapshot) => {
      if (snapshot.exists()) {
        const matchData = { id: snapshot.id, ...snapshot.data() };
        setMatch(matchData);

        // Fetch player profiles
        const playerA = matchData.playerA || matchData.player1;
        const playerB = matchData.playerB || matchData.player2;

        if (playerA && playerA !== "TBD") {
          try {
            const playerADoc = await getDoc(doc(db, "players", playerA));
            if (playerADoc.exists()) {
              setPlayerAProfile({ id: playerADoc.id, ...playerADoc.data() });
            }
          } catch (error) {
            console.log("Player A profile not found, using name only");
          }
        }

        if (playerB && playerB !== "TBD") {
          try {
            const playerBDoc = await getDoc(doc(db, "players", playerB));
            if (playerBDoc.exists()) {
              setPlayerBProfile({ id: playerBDoc.id, ...playerBDoc.data() });
            }
          } catch (error) {
            console.log("Player B profile not found, using name only");
          }
        }

        // Set poll data after we have player names
        setPollData({
          question: "Who will win?",
          options: {
            [playerA]: { votes: 156, percentage: 62 },
            [playerB]: { votes: 95, percentage: 38 }
          },
          totalVotes: 251
        });

        // Initialize admin controls with current match data
        setAdminScoreA(String(matchData.score?.[playerA] || matchData.scoreA || 0));
        setAdminScoreB(String(matchData.score?.[playerB] || matchData.scoreB || 0));
        setAdminStatus(matchData.status || "scheduled");
        setAdminWinner(matchData.winner || "");

        setLoading(false);
      } else {
        setLoading(false);
      }
    }, (error) => {
      console.error("Error listening to match:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tournamentId, matchId]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading match...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Match not found.</p>
          <Link href={`/tournaments/${tournamentId}`} className="text-blue-600 hover:underline">
            ← Back to Tournament
          </Link>
        </div>
      </div>
    );
  }

  const playerA = match.playerA || match.player1 || "TBD";
  const playerB = match.playerB || match.player2 || "TBD";
  const winner = match.winner;
  const hasWinner = winner !== null && winner !== undefined && winner !== "";
  const roundNumber = match.round || match.roundNumber || 1;
  const roundName = getRoundName(roundNumber, tournament?.totalRounds || 4);
  
  // Get player display names, avatars, and tier info
  const playerAName = playerAProfile?.username || playerAProfile?.gamerTag || playerA;
  const playerBName = playerBProfile?.username || playerBProfile?.gamerTag || playerB;
  const playerAAvatar = playerAProfile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerA}`;
  const playerBAvatar = playerBProfile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerB}`;
  const playerATier = playerAProfile?.subscription || "gamer";
  const playerBTier = playerBProfile?.subscription || "gamer";

  // Get match status
  const getMatchStatus = () => {
    if (hasWinner) return "Completed";
    if (match.status === "live") return "Live";
    return "Scheduled";
  };

  const matchStatus = getMatchStatus();
  
  // Navigation helpers
  const prevMatch = currentMatchIndex > 0 ? allMatches[currentMatchIndex - 1] : null;
  const nextMatch = currentMatchIndex < allMatches.length - 1 ? allMatches[currentMatchIndex + 1] : null;

  // Get tier badge color
  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "premium": return "bg-purple-100 text-purple-800";
      case "elite": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Admin update function
  const handleAdminUpdate = async () => {
    if (!match || updating) return;
    
    setUpdating(true);
    try {
      const matchRef = doc(db, "tournaments", tournamentId, "matches", matchId);
      
      const scoreA = parseInt(adminScoreA) || 0;
      const scoreB = parseInt(adminScoreB) || 0;
      
      // Auto-determine winner based on scores if not explicitly set
      let finalWinner = adminWinner;
      if (!finalWinner && (scoreA !== scoreB)) {
        finalWinner = scoreA > scoreB ? playerA : playerB;
      }
      
      const updateData: any = {
        status: adminStatus,
        scoreA: scoreA,
        scoreB: scoreB,
        score: {
          [playerA]: scoreA,
          [playerB]: scoreB
        },
        updatedAt: new Date()
      };
      
      if (finalWinner) {
        updateData.winner = finalWinner;
      }
      
      await updateDoc(matchRef, updateData);
      
      console.log("✅ Match updated successfully");
    } catch (error) {
      console.error("❌ Error updating match:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header with Navigation */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Match {match.matchNumber || matchId.slice(-4)}
            </h1>
            <p className="text-gray-600 text-lg">
              {roundName} • {tournament?.name}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            matchStatus === "Completed" ? "bg-green-100 text-green-800" :
            matchStatus === "Live" ? "bg-red-100 text-red-800" :
            "bg-yellow-100 text-yellow-800"
          }`}>
            {matchStatus}
          </span>
        </div>
        
        {/* Navigation Controls */}
        <div className="flex justify-between items-center">
          <Link href={`/tournaments/${tournamentId}`} className="text-blue-600 hover:underline text-sm">
            ← Back to Tournament
        </Link>

          <div className="flex space-x-2">
            {prevMatch ? (
              <Link href={`/tournaments/${tournamentId}/matches/${prevMatch.id}`}>
                <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                  ← Previous
                </button>
              </Link>
            ) : (
              <button className="px-3 py-1 bg-gray-100 text-gray-400 rounded text-sm" disabled>
                ← Previous
              </button>
            )}
            
            {nextMatch ? (
              <Link href={`/tournaments/${tournamentId}/matches/${nextMatch.id}`}>
                <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                  Next →
          </button>
              </Link>
            ) : (
              <button className="px-3 py-1 bg-gray-100 text-gray-400 rounded text-sm" disabled>
            Next →
          </button>
            )}
          </div>
        </div>
      </div>

      {/* Player Matchup Section */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold mb-6 text-center">Player Matchup</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Player A */}
          <div className={`rounded-lg border-2 p-6 text-center transition-all ${
            winner === playerA ? "bg-green-100 border-green-300" : "bg-gray-50 border-gray-200"
          }`}>
            <img 
              src={playerAAvatar} 
              alt={playerAName}
              className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-white shadow-lg"
            />
            <h3 className={`text-xl font-bold mb-2 ${
              winner === playerA ? "text-green-800" : "text-gray-800"
            }`}>
              {playerAName}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${getTierBadge(playerATier)}`}>
              {playerATier.toUpperCase()}
            </span>
            
            {match.score && (
              <div className="mt-3">
                <div className="text-3xl font-bold text-gray-700">
                  {match.score[playerA] || match.scoreA || 0}
                </div>
                <p className="text-xs text-gray-500">Score</p>
              </div>
            )}
            
            {winner === playerA && (
              <div className="mt-3">
                <span className="text-green-600 text-3xl">👑</span>
                <p className="text-green-700 font-bold text-sm">WINNER</p>
              </div>
            )}
          </div>

          {/* VS Divider with Score */}
          <div className="text-center">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-gray-500">VS</span>
            </div>
            {match.score && (
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-lg font-bold text-gray-700">
                  {match.score[playerA] || match.scoreA || 0} – {match.score[playerB] || match.scoreB || 0}
                </p>
                <p className="text-xs text-gray-500">Final Score</p>
              </div>
            )}
          </div>

          {/* Player B */}
          <div className={`rounded-lg border-2 p-6 text-center transition-all ${
            winner === playerB ? "bg-green-100 border-green-300" : "bg-gray-50 border-gray-200"
          }`}>
            <img 
              src={playerBAvatar} 
              alt={playerBName}
              className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-white shadow-lg"
            />
            <h3 className={`text-xl font-bold mb-2 ${
              winner === playerB ? "text-green-800" : "text-gray-800"
            }`}>
              {playerBName}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${getTierBadge(playerBTier)}`}>
              {playerBTier.toUpperCase()}
            </span>
            
            {match.score && (
              <div className="mt-3">
                <div className="text-3xl font-bold text-gray-700">
                  {match.score[playerB] || match.scoreB || 0}
                </div>
                <p className="text-xs text-gray-500">Score</p>
              </div>
            )}
            
            {winner === playerB && (
              <div className="mt-3">
                <span className="text-green-600 text-3xl">👑</span>
                <p className="text-green-700 font-bold text-sm">WINNER</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Streaming & Stats */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Streaming Section */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">🎥 Live Stream</h2>
            {match.streamLink ? (
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-4xl mb-2">📺</div>
                  <p>Stream Embed Here</p>
                  <p className="text-sm opacity-75">Twitch/YouTube/Kick Integration</p>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-gray-500 text-center">
                  <div className="text-4xl mb-2">📺</div>
                  <p className="font-medium">Stream starting soon...</p>
                  <p className="text-sm">Multiple stream support ready</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">📊 Match Statistics</h2>
            
            {/* Scoreboard */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-3 text-center">Scoreboard</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-700">
                    {match.score?.[playerA] || match.scoreA || 0}
                  </p>
                  <p className="text-sm text-gray-600">{playerAName}</p>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-gray-400">–</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-700">
                    {match.score?.[playerB] || match.scoreB || 0}
                  </p>
                  <p className="text-sm text-gray-600">{playerBName}</p>
                </div>
              </div>
            </div>

            {/* Advanced Stats Placeholder */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-gray-700">--</p>
                <p className="text-xs text-gray-500">Kills</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-gray-700">--</p>
                <p className="text-xs text-gray-500">Assists</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-gray-700">--</p>
                <p className="text-xs text-gray-500">Deaths</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-gray-700">--</p>
                <p className="text-xs text-gray-500">Damage</p>
              </div>
            </div>
          </div>

          {/* Clips Section */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">🎬 Top Clips</h2>
              <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                Upload Clip
              </button>
            </div>
            
            <div className="space-y-3">
              {clips.map((clip) => (
                <div key={clip.id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <img 
                    src={clip.thumbnail} 
                    alt={clip.title}
                    className="w-20 h-12 rounded object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{clip.title}</h4>
                    <p className="text-xs text-gray-500">by {clip.uploader} • {clip.duration}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-red-500">❤️ {clip.upvotes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Community */}
        <div className="space-y-6">
          
          {/* Match Completion */}
          {hasWinner && (
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">🏆 Match Complete</h2>
              <div className="text-center">
                <div className="text-4xl mb-2">👑</div>
                <p className="text-xl font-bold text-green-800 mb-3">
                  Winner: {winner}
                </p>
                <Link href={`/tournaments/${tournamentId}`}>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    View Bracket Path
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Community Poll */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">📊 Who Wins?</h2>
            {pollData && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{playerAName}</span>
                    <span className="text-sm text-gray-600">{pollData.options[playerA]?.percentage}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${pollData.options[playerA]?.percentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{playerBName}</span>
                    <span className="text-sm text-gray-600">{pollData.options[playerB]?.percentage}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${pollData.options[playerB]?.percentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  {pollData.totalVotes} votes
                </p>
              </div>
            )}
          </div>

          {/* Emoji Reactions */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">⚡ Reactions</h2>
            <div className="grid grid-cols-3 gap-2">
              <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors">
                <div className="text-2xl mb-1">🔥</div>
                <div className="text-xs text-gray-600">Fire</div>
                <div className="text-xs font-bold">89</div>
              </button>
              <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors">
                <div className="text-2xl mb-1">👑</div>
                <div className="text-xs text-gray-600">King</div>
                <div className="text-xs font-bold">56</div>
              </button>
              <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors">
                <div className="text-2xl mb-1">😱</div>
                <div className="text-xs text-gray-600">Shocked</div>
                <div className="text-xs font-bold">23</div>
              </button>
            </div>
          </div>

          {/* Match Chat */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">💬 Match Chat</h2>
            
            {/* Chat Messages */}
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className="font-medium text-blue-600">{msg.user}:</span>
                  <span className="text-gray-700 ml-1">{msg.message}</span>
                  <span className="text-xs text-gray-400 ml-2">{msg.timestamp}</span>
                </div>
              ))}
      </div>

            {/* Chat Input */}
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Controls Panel (Temporary for Testing) */}
      {isAdmin && (
        <div className="bg-white rounded-lg border shadow-sm mt-6">
          <div className="p-4 border-b">
            <button
              onClick={() => setShowAdminControls(!showAdminControls)}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-lg font-bold text-gray-800">🔧 Admin Controls (Testing)</h2>
              <span className="text-gray-500">
                {showAdminControls ? "▼" : "▶"}
              </span>
            </button>
          </div>
          
          {showAdminControls && (
            <div className="p-6 bg-gray-100 rounded-b-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Score Controls */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Match Scores</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        {playerAName} Score
                      </label>
                      <input
                        type="number"
                        value={adminScoreA}
                        onChange={(e) => setAdminScoreA(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        {playerBName} Score
                      </label>
                      <input
                        type="number"
                        value={adminScoreB}
                        onChange={(e) => setAdminScoreB(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Status & Winner Controls */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Match Status</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Status
                      </label>
                      <select
                        value={adminStatus}
                        onChange={(e) => setAdminStatus(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="live">Live</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Assign Winner
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setAdminWinner(playerA)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            adminWinner === playerA 
                              ? "bg-green-600 text-white" 
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {playerAName}
                        </button>
                        <button
                          onClick={() => setAdminWinner("")}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            adminWinner === "" 
                              ? "bg-gray-600 text-white" 
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          None
                        </button>
                        <button
                          onClick={() => setAdminWinner(playerB)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            adminWinner === playerB 
                              ? "bg-green-600 text-white" 
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {playerBName}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Controls */}
              <div className="mt-6 pt-4 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <p>⚠️ Temporary admin controls for testing</p>
                    <p>Will be moved to Bugatti Admin Panel later</p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        // Reset to current match values
                        setAdminScoreA(String(match.score?.[playerA] || match.scoreA || 0));
                        setAdminScoreB(String(match.score?.[playerB] || match.scoreB || 0));
                        setAdminStatus(match.status || "scheduled");
                        setAdminWinner(match.winner || "");
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                    >
                      Reset
                    </button>
                    
                    <button
                      onClick={handleAdminUpdate}
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                    >
                      {updating ? "Updating..." : "Update Match"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}