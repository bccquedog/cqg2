"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, orderBy, onSnapshot, updateDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import MatchResultForm from "@/components/MatchResultForm";
import AdminMatchOverrideForm from "@/components/AdminMatchOverrideForm";
import CompetitiveOverlay from "@/components/CompetitiveOverlay";
import PregameLobby from "@/components/PregameLobby";
import AutoProgressionStatus from "@/components/AutoProgressionStatus";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { advanceWinner } from "@/lib/advanceWinner";
import { useCompetitiveOverlay } from "@/hooks/useCompetitiveOverlay";
import { usePregameLobby } from "@/hooks/usePregameLobby";

// Helper to format dates
function formatStartDate(timestamp: any): string {
  if (!timestamp) return "TBD";
  
  const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

// Interactive Bracket Viewer Component
function BracketViewer({ matches, tournamentId, watchMode = false, currentUserId, onSubmitClick }: { matches: any[], tournamentId: string, watchMode?: boolean, currentUserId?: string | null, onSubmitClick: (m: any) => void }) {
  // Filter matches based on watch mode
  const displayMatches = watchMode 
    ? matches.filter(match => match.status === "Live" || match.status === "live")
    : matches;

  // Group matches by round
  const matchesByRound: { [round: number]: any[] } = {};
  displayMatches.forEach(match => {
    const round = match.roundNumber || match.round || 1;
    if (!matchesByRound[round]) {
      matchesByRound[round] = [];
    }
    matchesByRound[round].push(match);
  });

  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  const maxRounds = Math.max(...rounds, 1);
  
  // Check if we have any live matches for watch mode
  const liveMatchCount = matches.filter(match => match.status === "Live" || match.status === "live").length;

  // Round names mapping
  const getRoundName = (round: number, totalRounds: number) => {
    if (totalRounds === 1) return "Final";
    if (round === totalRounds) return "Final";
    if (round === totalRounds - 1) return "Semifinals";
    if (round === totalRounds - 2) return "Quarterfinals";
    return `Round ${round}`;
  };

  // Watch Mode: Show live matches prominently with full bracket below
  if (watchMode && liveMatchCount > 0) {
    const liveMatches = displayMatches.filter(match => match.status === "Live" || match.status === "live");
    
    return (
      <div className="space-y-8">
        {/* Live Matches Section */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <span className="text-2xl">🔴</span>
            <div className="text-center">
              <h3 className="text-xl font-bold text-red-800">LIVE NOW – {liveMatchCount} {liveMatchCount === 1 ? "Match" : "Matches"}</h3>
              <p className="text-red-600 text-sm">RedZone Mode • Live matches in progress</p>
            </div>
            <span className="text-2xl">🔥</span>
          </div>

          {/* Live Matches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
            {liveMatches.map((match: any) => (
              <LiveMatchCard 
                key={match.id} 
                match={match} 
                tournamentId={tournamentId}
                currentUserId={currentUserId}
                onSubmitClick={onSubmitClick}
              />
            ))}
          </div>
        </div>

        {/* Full Bracket Below (Dimmed) */}
        <div className="opacity-60">
          <h3 className="text-lg font-semibold text-gray-600 mb-4">Full Tournament Bracket</h3>
          <div className="overflow-x-auto">
            <div className={`grid gap-x-8 min-w-max ${
              maxRounds === 1 ? "grid-cols-1" :
              maxRounds === 2 ? "grid-cols-2" :
              maxRounds === 3 ? "grid-cols-3" :
              maxRounds === 4 ? "grid-cols-4" :
              "grid-cols-5"
            }`} style={{ gridTemplateColumns: `repeat(${maxRounds}, minmax(250px, 1fr))` }}>
              {rounds.map((round) => (
                <div key={round} className="space-y-4">
                  <div className="text-center">
                    <h4 className="text-md font-medium text-gray-600 mb-4">
                      {getRoundName(round, maxRounds)}
                    </h4>
                  </div>
                  <div className="space-y-6">
                    {matchesByRound[round].map((match: any) => (
                      <MatchCard 
                        key={match.id} 
                        match={match} 
                        tournamentId={tournamentId}
                        currentUserId={currentUserId}
                        onSubmitClick={onSubmitClick}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal bracket view
  return (
    <div className="overflow-x-auto">
      <div className={`grid gap-x-8 min-w-max ${
        maxRounds === 1 ? "grid-cols-1" :
        maxRounds === 2 ? "grid-cols-2" :
        maxRounds === 3 ? "grid-cols-3" :
        maxRounds === 4 ? "grid-cols-4" :
        "grid-cols-5"
      }`} style={{ gridTemplateColumns: `repeat(${maxRounds}, minmax(250px, 1fr))` }}>
        {rounds.map((round) => (
          <div key={round} className="space-y-4">
            {/* Round Header */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {getRoundName(round, maxRounds)}
              </h3>
            </div>
            
            {/* Matches in this round */}
            <div className="space-y-6">
              {matchesByRound[round].map((match: any) => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  tournamentId={tournamentId}
                  currentUserId={currentUserId}
                  onSubmitClick={onSubmitClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Enhanced Live Match Card Component for Watch Mode
function LiveMatchCard({ match, tournamentId, currentUserId, onSubmitClick }: { match: any, tournamentId: string, currentUserId?: string | null, onSubmitClick: (m: any) => void }) {
  const playerA = match.playerA || match.player1 || "TBD";
  const playerB = match.playerB || match.player2 || "TBD";
  const scoreA = match.scoreA || match.score?.[playerA] || 0;
  const scoreB = match.scoreB || match.score?.[playerB] || 0;
  const roundName = match.roundNumber === 1 ? "Round 1" : 
                   match.roundNumber === 2 ? "Quarterfinals" :
                   match.roundNumber === 3 ? "Semifinals" : "Finals";

  // Calculate Hype Level
  const calculateHype = () => {
    if (scoreA === 0 && scoreB === 0) return 0; // No scores yet
    
    const diff = Math.abs(scoreA - scoreB);
    const maxScore = Math.max(scoreA, scoreB);
    
    if (maxScore === 0) return 0;
    
    const hypeLevel = 1 - (diff / maxScore);
    return Math.max(0, Math.min(1, hypeLevel)); // Clamp between 0 and 1
  };

  const hypeLevel = calculateHype();
  
  // Get hype display info
  const getHypeInfo = () => {
    if (hypeLevel < 0.3) return { label: "Hype: Low", color: "bg-gray-400" };
    if (hypeLevel <= 0.7) return { label: "Hype: Moderate", color: "bg-yellow-400" };
    return { label: "Hype: High", color: "bg-red-500 animate-pulse" };
  };

  const hypeInfo = getHypeInfo();

  return (
    <Link href={`/tournaments/${tournamentId}/matches/${match.id}`}>
      <div className="rounded-lg border shadow-md bg-white p-4 w-full max-w-md mx-auto hover:shadow-lg transition-all cursor-pointer border-2 border-red-500 relative">
        {/* Match Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="font-bold text-gray-800">{match.matchNumber || "Match"}</h4>
            <p className="text-xs text-gray-600">{roundName}</p>
          </div>
          <div className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
            LIVE
          </div>
        </div>

        {/* Players Section */}
        <div className="space-y-3">
          {/* Player A */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${playerA}`}
                alt={playerA}
                className="w-10 h-10 rounded-full border-2 border-white shadow"
              />
              <div>
                <Link href={`/profile/${playerA}`} className="font-semibold text-blue-600 hover:underline">
                  {playerA}
                </Link>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                  GAMER
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-700">
              {scoreA}
            </div>
          </div>

          {/* VS Divider */}
          <div className="text-center">
            <span className="text-sm font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">
              VS
            </span>
          </div>

          {/* Player B */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${playerB}`}
                alt={playerB}
                className="w-10 h-10 rounded-full border-2 border-white shadow"
              />
              <div>
                <Link href={`/profile/${playerB}`} className="font-semibold text-blue-600 hover:underline">
                  {playerB}
                </Link>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                  GAMER
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-700">
              {scoreB}
            </div>
          </div>
        </div>

        {/* Live Status */}
        <div className="mt-4 p-2 bg-red-100 rounded-lg text-center">
          <p className="text-red-800 font-medium text-sm">
            🔴 Match in Progress
          </p>
        </div>

        {/* Submit Result CTA (only for participants) */}
        {(currentUserId && (currentUserId === match.playerA || currentUserId === match.playerB)) && (
          <div className="mt-3 flex justify-between items-center">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setDisputeModal({ open: true, match }); setDisputeForm({ description: "" }); }}
              className="text-xs px-3 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50"
            >
              Dispute Match
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onSubmitClick(match); }}
              className="text-xs px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Submit Result
            </button>
          </div>
        )}

        {/* Hype Meter */}
        {match.status === "Live" || match.status === "live" ? (
          <div className="mt-3">
            {/* Hype Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${hypeInfo.color}`}
                style={{ width: `${hypeLevel * 100}%` }}
              ></div>
            </div>
            
            {/* Hype Label */}
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">{hypeInfo.label}</span>
              <span className="text-xs text-gray-400">
                {scoreA !== scoreB ? `${Math.abs(scoreA - scoreB)} pt difference` : "Tied!"}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

// Individual Match Card Component
function MatchCard({ match, tournamentId, isWatchMode = false, currentUserId, onSubmitClick }: { match: any, tournamentId: string, isWatchMode?: boolean, currentUserId?: string | null, onSubmitClick: (m: any) => void }) {
  const playerA = match.playerA || match.player1 || "TBD";
  const playerB = match.playerB || match.player2 || "TBD";
  const winner = match.winner;
  const hasWinner = winner !== null && winner !== undefined && winner !== "";
  const isScheduled = match.status === "Scheduled" || match.status === "scheduled";
  const isLive = match.status === "Live" || match.status === "live";
  const glowLevel = isLive ? (match._liveCount && match._liveCount >= 4 ? "glow-strong" : match._liveCount && match._liveCount >= 2 ? "glow-medium" : "glow-soft") : "";

  return (
    <Link href={`/tournaments/${tournamentId}/matches/${match.id}`}>
      <div className={`border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer ${
        isWatchMode && isLive ? "border-2 border-red-500 bg-red-50" : ""
      } ${isLive ? glowLevel : ""}`}>
        {/* Match Header */}
        <div className="px-4 py-2 border-b bg-gray-100 rounded-t-lg">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-600">
              {match.matchNumber || `Match ${match.id.slice(-4)}`}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              hasWinner ? "bg-green-100 text-green-800" : 
              isLive ? "bg-red-100 text-red-800" :
              isScheduled ? "bg-blue-100 text-blue-800" :
              "bg-yellow-100 text-yellow-800"
            }`}>
              {hasWinner ? "Completed" : 
               isLive ? "LIVE" :
               isScheduled ? "Scheduled" : 
               "Pending"}
            </span>
          </div>
        </div>
        
        {/* Players */}
        <div className="p-4 space-y-3">
          {/* Player A */}
          <div className={`flex justify-between items-center p-2 rounded ${
            winner === playerA ? "bg-green-100 font-bold" : "bg-white"
          }`}>
            <Link href={`/profile/${playerA}`} className={`text-sm ${
              winner === playerA ? "text-green-800" : "text-blue-600"
            } hover:underline`}>
              {playerA}
            </Link>
            {winner === playerA && (
              <span className="text-green-600 text-xs">✓</span>
            )}
          </div>
          
          {/* VS Divider */}
          <div className="text-center">
            <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">VS</span>
          </div>
          
          {/* Player B */}
          <div className={`flex justify-between items-center p-2 rounded ${
            winner === playerB ? "bg-green-100 font-bold" : "bg-white"
          }`}>
            <Link href={`/profile/${playerB}`} className={`text-sm ${
              winner === playerB ? "text-green-800" : "text-blue-600"
            } hover:underline`}>
              {playerB}
            </Link>
            {winner === playerB && (
              <span className="text-green-600 text-xs">✓</span>
            )}
          </div>
        </div>
        
        {/* Winner Display or Submission Form */}
        <div className="px-4 py-2 border-t bg-white">
          {hasWinner ? (
            <div className="space-y-2">
              <p className="text-xs text-green-700 text-center font-medium">Winner: {winner}</p>
              {/* Highlights (Phase 1 dormant: render only if exists) */}
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-700">Highlights</summary>
                {Array.isArray((match as any).highlights) && (match as any).highlights.length > 0 ? (
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {(match as any).highlights.map((h: any, idx: number) => (
                      <li key={idx}>
                        <a className="text-blue-600 hover:underline" href={h.clipUrl} target="_blank" rel="noreferrer">
                          Clip {idx + 1}
                        </a>
                        <span className="text-xs text-gray-500 ml-2">by {h.uploader}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 mt-1">No clips submitted yet</p>
                )}
              </details>
            </div>
          ) : (
            <MatchResultForm tournamentId={tournamentId} match={match} tournament={tournament} />
          )}
          {/* Admin override panel */}
          <AdminMatchOverrideForm tournamentId={tournamentId} match={match} />
        </div>
      </div>
    </Link>
  );
}

export default function TournamentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const [champion, setChampion] = useState<string | null>(null);
  const [hasLiveMatches, setHasLiveMatches] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [watchMode, setWatchMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [submitModal, setSubmitModal] = useState<{ open: boolean, match: any | null }>({ open: false, match: null });
  const [formState, setFormState] = useState<{ scoreA: number | "", scoreB: number | "", winnerId: string, streamLink: string }>({ scoreA: "", scoreB: "", winnerId: "", streamLink: "" });
  const [disputeModal, setDisputeModal] = useState<{ open: boolean, match: any | null }>({ open: false, match: null });
  const [disputeForm, setDisputeForm] = useState<{ description: string }>({ description: "" });
  const [report, setReport] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [countdown, setCountdown] = useState<string | null>(null);
  
  // Competitive Overlay
  const { tournament: overlayTournament, isOverlayVisible, toggleOverlay } = useCompetitiveOverlay(id);
  
  // Pregame Lobby
  const { tournament: lobbyTournament, isLobbyVisible, toggleLobby } = usePregameLobby(id);
  
  // Auto-enable Watch Mode for live tournaments
  useEffect(() => {
    if (tournament && hasLiveMatches && tournament.status === "live") {
      setWatchMode(true);
    } else if (tournament && (tournament.status === "completed" || !hasLiveMatches)) {
      setWatchMode(false);
    }
  }, [tournament, hasLiveMatches]);

  // Track auth user
  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user ? user.uid : null);
    });
  }, []);

  // Calculate progress from matches
  const calculateProgress = (matchesData: any[]) => {
    const total = matchesData.length;
    const completed = matchesData.filter(match => match.winner).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Check for live matches
    const liveMatches = matchesData.filter(match => 
      match.status === "Live" || match.status === "live"
    );
    setHasLiveMatches(liveMatches.length > 0);
    
    // Previous progress for comparison
    const prevPercentage = progress.percentage;
    setProgress({ completed, total, percentage });
    
    // Check if tournament is completed and find champion
    if (completed === total && total > 0) {
      // Find the final match (highest round) to get champion
      const finalMatch = matchesData
        .filter(match => match.winner)
        .sort((a, b) => (b.roundNumber || b.round || 1) - (a.roundNumber || a.round || 1))[0];
      
      if (finalMatch) {
        setChampion(finalMatch.winner);
        
        // Trigger confetti on first completion
        if (prevPercentage < 100 && percentage === 100) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }
    }
  };

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        // Fetch tournament document
        const tournamentDoc = await getDoc(doc(db, "tournaments", id));
        if (tournamentDoc.exists()) {
          const tournamentData = { id: tournamentDoc.id, ...tournamentDoc.data() } as any;
          setTournament(tournamentData);
          if (tournamentData.report) setReport(tournamentData.report);
        }

        // Fetch players from subcollection
        const playersQuery = query(
          collection(db, "tournaments", id, "players"),
          orderBy("seed", "asc")
        );
        const playersSnapshot = await getDocs(playersQuery);
        const playersData = playersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPlayers(playersData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching tournament data:", error);
        setLoading(false);
      }
    };

    if (id) {
      fetchTournamentData();
    }
  }, [id]);

  // Countdown updater
  useEffect(() => {
    if (!tournament?.startTime) { setCountdown(null); return; }
    const start = typeof tournament.startTime?.toDate === 'function' ? tournament.startTime.toDate() : new Date(tournament.startTime);
    const tick = () => {
      const now = new Date().getTime();
      const diff = start.getTime() - now;
      if (diff <= 0) { setCountdown(null); return; }
      const s = Math.floor(diff / 1000);
      const hh = String(Math.floor(s / 3600)).padStart(2, '0');
      const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      setCountdown(`${hh}:${mm}:${ss}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [tournament?.startTime]);

  // Timeline listener
  useEffect(() => {
    if (!id) return;
    const ref = collection(db, 'tournaments', id, 'timeline');
    const unsub = onSnapshot(ref, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // sort by timestamp ascending
      items.sort((a: any, b: any) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));
      setTimeline(items);
    });
    return () => unsub();
  }, [id]);

  // Set up real-time listener for matches
  useEffect(() => {
    if (!id) return;

    const matchesQuery = query(
      collection(db, "tournaments", id, "matches"),
      orderBy("round", "asc")
    );

    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
      const raw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const liveCount = raw.filter(m => m.status === "Live" || m.status === "live").length;
      const matchesData = raw.map(m => ({ ...m, _liveCount: liveCount }));
      
      setMatches(matchesData);
      calculateProgress(matchesData);
    }, (error) => {
      console.error("Error listening to matches:", error);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading tournament...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Tournament not found.</p>
        <Link href="/tournaments" className="text-blue-600 hover:underline">
          ← Back to Tournaments
        </Link>
      </div>
    );
  }

  // Group matches by round
  const matchesByRound: { [round: number]: any[] } = {};
  matches.forEach(match => {
    const round = match.round || 1;
    if (!matchesByRound[round]) {
      matchesByRound[round] = [];
    }
    matchesByRound[round].push(match);
  });

  const currentRound = matches.length > 0 ? Math.max(...matches.map(m => m.round || 1)) : 0;
  
  // Determine eliminated players
  const eliminatedPlayers = new Set();
  matches.forEach(match => {
    if (match.status === "completed" && match.winner) {
      const loser = match.winner === match.playerA ? match.playerB : match.playerA;
      if (loser) eliminatedPlayers.add(loser);
    }
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Back Navigation */}
      <Link href="/tournaments" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Tournaments
      </Link>

      {/* Tournament Completion Banner */}
      {champion && progress.completed === progress.total && progress.total > 0 && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-lg shadow-lg mb-6">
          <div className="flex items-center justify-center space-x-3">
            <span className="text-3xl">🏆</span>
            <div className="text-center">
              <h2 className="text-2xl font-bold">Tournament Completed!</h2>
              <p className="text-lg">Champion: {champion}</p>
            </div>
            <span className="text-3xl">🎉</span>
          </div>
        </div>
      )}

      {/* Tournament Header */}
      <div className="border p-6 rounded-md shadow-sm bg-white mb-6 relative">
        
        {/* LIVE NOW Badge on Detail Page */}
        {hasLiveMatches && tournament.status === "live" && progress.completed < progress.total && (
          <div className="absolute top-4 right-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse shadow-lg">
            LIVE NOW – {matches.filter(m => m.status === "Live" || m.status === "live").length} {matches.filter(m => m.status === "Live" || m.status === "live").length === 1 ? "Match" : "Matches"}
          </div>
        )}
        
        {/* TOURNAMENT COMPLETED Badge */}
        {progress.completed === progress.total && progress.total > 0 && (
          <div className="absolute top-4 right-4 bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
            TOURNAMENT COMPLETED
          </div>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">{tournament.name}</h1>
          
          <div className="flex items-center space-x-3">
            {/* Countdown / Live / Completed indicators */}
            {countdown && progress.percentage < 100 && (
              <span className="px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800 animate-pulse">
                ⏳ Starts in {countdown}
              </span>
            )}
            {!countdown && (hasLiveMatches || tournament.status === 'live') && progress.percentage < 100 && (
              <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                🔴 Live Now
              </span>
            )}
            {progress.percentage === 100 && (
              <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                ✅ Completed
              </span>
            )}
            {/* Watch Mode Toggle */}
            {tournament.status === "live" && progress.completed < progress.total && (
              <button
                onClick={() => setWatchMode(!watchMode)}
                disabled={!hasLiveMatches}
                className={`text-white text-sm px-3 py-1 rounded-lg font-semibold shadow transition-colors ${
                  hasLiveMatches 
                    ? watchMode 
                      ? "bg-indigo-700 hover:bg-indigo-800" 
                      : "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {watchMode ? "Exit Watch Mode" : "Watch Mode"}
                {hasLiveMatches && (
                  <span className="ml-1 text-xs opacity-75">
                    ({matches.filter(m => m.status === "Live" || m.status === "live").length})
                  </span>
                )}
              </button>
            )}

            {/* Pregame Lobby Toggle */}
            {tournament.status === "upcoming" && (
              <button
                onClick={() => toggleLobby(!isLobbyVisible)}
                className={`text-white text-sm px-3 py-1 rounded-lg font-semibold shadow transition-colors ${
                  isLobbyVisible 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isLobbyVisible ? "Hide Lobby" : "Show Lobby"}
                <span className="ml-1 text-xs opacity-75">🎮</span>
              </button>
            )}

            {/* Competitive Overlay Toggle */}
            {tournament.status === "live" && (
              <button
                onClick={() => toggleOverlay(!isOverlayVisible)}
                className={`text-white text-sm px-3 py-1 rounded-lg font-semibold shadow transition-colors ${
                  isOverlayVisible 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {isOverlayVisible ? "Hide Overlay" : "Show Overlay"}
                <span className="ml-1 text-xs opacity-75">📺</span>
              </button>
            )}
            
            {/* Tournament Status */}
            <span className={`px-3 py-1 rounded text-sm ${
              tournament.status === "upcoming" ? "bg-blue-100 text-blue-800" :
              tournament.status === "live" ? "bg-green-100 text-green-800" :
              tournament.status === "completed" ? "bg-gray-100 text-gray-800" :
              "bg-yellow-100 text-yellow-800"
            }`}>
              {tournament.status?.toUpperCase()}
            </span>

            {/* Auto-Progression Status */}
            <AutoProgressionStatus tournamentId={id} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <p className="text-gray-700">
            <span className="font-medium">Game:</span> {tournament.game}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Start Date:</span> {formatStartDate(tournament.startDate)}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Players:</span> {players.length} registered
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Type:</span> {tournament.settings?.format || "Single Elimination"}
          </p>
        </div>

        {/* Enhanced Progress Bar with Glow Effects */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Tournament Progress</span>
            <span className="text-sm text-gray-600 font-medium">
              {progress.completed} of {progress.total} matches completed
            </span>
          </div>
          
          <div className="bg-gray-200 rounded-lg h-4 overflow-hidden relative">
            <div 
              className={`h-4 rounded-lg transition-all duration-500 ${
                progress.percentage === 100 
                  ? "victory-shine bg-green-600" 
                  : hasLiveMatches || tournament.status === "live"
                    ? (progress.total === 1 || (matches.length > 0 && Math.max(...matches.map(m => m.round || 1)) === (matches[0]?.totalRounds || 4))
                        ? "bg-green-500 glow-final"
                        : "bg-green-500 " )
                    : "bg-green-500"
              }`}
              style={{ width: `${progress.percentage}%` }}
            ></div>
            
            {/* Live indicator pulse overlay with intensity */}
            {(hasLiveMatches || tournament.status === "live") && progress.percentage < 100 && (
              <div className={`absolute inset-0 rounded-lg ${
                matches.filter(m => m.status === "Live" || m.status === "live").length === 1
                  ? "glow-soft"
                  : matches.filter(m => m.status === "Live" || m.status === "live").length <= 3
                    ? "glow-medium"
                    : "glow-strong"
              }`}></div>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-600">
              {progress.percentage === 100 ? (
                <span className="text-green-700 font-bold">🏆 Tournament Completed!</span>
              ) : (
                <span>{progress.percentage}% Complete</span>
              )}
            </p>
            
            <div className="flex items-center space-x-2">
              {(hasLiveMatches || tournament.status === "live") && progress.percentage < 100 && (
                <span className="flex items-center text-red-600 text-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></span>
                  Live Updates
                </span>
              )}
              
              {champion && progress.percentage === 100 && (
                <span className="text-yellow-600 font-bold text-sm">
                  👑 Champion: {champion}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Confetti Effect */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][Math.floor(Math.random() * 5)]
                }}
              ></div>
            ))}
          </div>
        )}

        {/* Status-specific information */}
        {tournament.status === "upcoming" && (
          <p className="text-blue-600 font-medium">🚀 Tournament starts soon!</p>
        )}
        
        {tournament.status === "live" && (
          <p className="text-green-600 font-medium">
            🔴 LIVE - {progress.completed} finished / {progress.total - progress.completed} pending
          </p>
        )}
        
        {tournament.status === "completed" && tournament.champion && (
          <p className="text-yellow-600 font-medium text-lg">
            🏆 Champion: {tournament.champion}
          </p>
        )}
      </div>

      {/* Players Section */}
      <div className="border p-6 rounded-md shadow-sm bg-white mb-6">
        <h2 className="text-2xl font-bold mb-4">Players ({players.length})</h2>
        
        {players.length === 0 ? (
          <p className="text-gray-500">No players registered yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {players.map((player: any) => {
              const isEliminated = eliminatedPlayers.has(player.id);
              const isCheckedIn = tournament.checkIns?.includes(player.id);
              
              return (
                <div key={player.id} className={`p-3 border rounded-lg flex items-center justify-between ${
                  isEliminated ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${
                      player.status === "active" ? "bg-green-500" :
                      player.status === "eliminated" ? "bg-red-500" :
                      "bg-gray-400"
                    }`}></span>
                    <Link href={`/profile/${player.id}`} className={`${isEliminated ? "line-through text-red-500" : "text-blue-600 hover:underline"}`}>
                      {player.name} (Seed #{player.seed})
                    </Link>
                  </div>
                  
                  <div className="flex space-x-1">
                    {isCheckedIn && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        ✓
                      </span>
                    )}
                    {isEliminated && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        OUT
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Bracket Viewer */}
      <div className="border p-6 rounded-md shadow-sm bg-white mb-6">
        <h2 className="text-2xl font-bold mb-6">Tournament Bracket</h2>
        
        {matches.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No matches scheduled yet.</p>
        ) : (
          <BracketViewer 
            matches={matches} 
            tournamentId={id} 
            watchMode={watchMode} 
            currentUserId={currentUserId}
            onSubmitClick={(m) => {
              setSubmitModal({ open: true, match: m });
              setFormState({
                scoreA: "",
                scoreB: "",
                winnerId: "",
                streamLink: ""
              });
            }}
          />
        )}
      </div>

      {/* Tournament Report */}
      <div className="border p-6 rounded-md shadow-sm bg-white mb-6">
        <h2 className="text-2xl font-bold mb-4">🏆 Tournament Report</h2>
        {tournament.status !== "completed" && !report && (
          <p className="text-gray-500">Report will be available once the tournament finishes.</p>
        )}
        {report && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {(report.rounds || []).map((r: any) => (
              <details key={r.round} className="border rounded-lg">
                <summary className="cursor-pointer px-3 py-2 font-medium bg-gray-50">Round {r.round}</summary>
                <div className="p-3 space-y-1">
                  {(r.matches || []).map((m: any) => (
                    <div key={m.id} className="text-sm text-gray-700">
                      Match {m.index}: {m.playerA} {m.winner ? 'def.' : 'vs'} {m.playerB} ({m.scoreA ?? 0}–{m.scoreB ?? 0})
                    </div>
                  ))}
                </div>
              </details>
            ))}
            {report.champion && (
              <div className="p-4 rounded-lg bg-yellow-100 border border-yellow-300 text-yellow-900 font-semibold flex items-center gap-2">
                <span>👑 Champion:</span>
                <span>{report.champion}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="border p-6 rounded-md shadow-sm bg-white mb-6">
        <h2 className="text-2xl font-bold mb-4">📜 Timeline</h2>
        {timeline.length === 0 ? (
          <p className="text-gray-500">No timeline events yet.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {timeline.map((t: any) => (
              <div key={t.id} className="flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-blue-500"></div>
                <div>
                  <div className="text-sm text-gray-800">{t.action}</div>
                  <div className="text-xs text-gray-500">by {t.actor || 'system'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player Roster Footer */}
      {players.length > 0 && (
        <div className="border p-6 rounded-md shadow-sm bg-white">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Player Roster ({players.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {players.map((player: any) => {
              const isEliminated = eliminatedPlayers.has(player.id);
              
              return (
                <div key={player.id} className={`p-3 rounded-lg text-center text-sm ${
                  isEliminated ? "bg-red-50 border border-red-200" : "bg-gray-50 border border-gray-200"
                }`}>
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <span className={`w-2 h-2 rounded-full ${
                      player.status === "active" ? "bg-green-500" :
                      player.status === "eliminated" ? "bg-red-500" :
                      "bg-gray-400"
                    }`}></span>
                    <Link href={`/profile/${player.id}`} className={`font-medium ${
                      isEliminated ? "line-through text-red-500" : "text-blue-600 hover:underline"
                    }`}>
                      {player.name}
                    </Link>
                  </div>
                  <div className="text-xs text-gray-500">
                    Seed #{player.seed}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submit Result Modal */}
      {submitModal.open && submitModal.match && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Submit Match Result</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Player A Score ({submitModal.match.playerA || "TBD"})</label>
                <input type="number" min="0" className="w-full border rounded p-2"
                  value={formState.scoreA}
                  onChange={(e) => setFormState(s => ({ ...s, scoreA: e.target.value === "" ? "" : Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Player B Score ({submitModal.match.playerB || "TBD"})</label>
                <input type="number" min="0" className="w-full border rounded p-2"
                  value={formState.scoreB}
                  onChange={(e) => setFormState(s => ({ ...s, scoreB: e.target.value === "" ? "" : Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Winner</label>
                <select className="w-full border rounded p-2"
                  value={formState.winnerId}
                  onChange={(e) => setFormState(s => ({ ...s, winnerId: e.target.value }))}>
                  <option value="">Select winner</option>
                  <option value={submitModal.match.playerA || ""}>{submitModal.match.playerA || "Player A"}</option>
                  <option value={submitModal.match.playerB || ""}>{submitModal.match.playerB || "Player B"}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Stream / Recording Link (optional)</label>
                <input type="url" className="w-full border rounded p-2"
                  value={formState.streamLink}
                  onChange={(e) => setFormState(s => ({ ...s, streamLink: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button className="px-3 py-1 rounded border" onClick={() => setSubmitModal({ open: false, match: null })}>Cancel</button>
              <button
                className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-50"
                disabled={
                  !currentUserId || !submitModal.match || submitModal.match.status?.toLowerCase() !== "live" ||
                  formState.scoreA === "" || formState.scoreB === "" || !formState.winnerId
                }
                onClick={async () => {
                  if (!currentUserId || !submitModal.match) return;
                  const match = submitModal.match;
                  // permissions: must be playerA or playerB
                  if (currentUserId !== match.playerA && currentUserId !== match.playerB) return;
                  try {
                    const matchRef = doc(db, "tournaments", id, "matches", match.id);
                  await updateDoc(matchRef, {
                    scoreA: formState.scoreA,
                    scoreB: formState.scoreB,
                    winner: formState.winnerId,
                    reportedBy: currentUserId,
                    submittedAt: serverTimestamp(),
                    status: "completed"
                  });
                    // advance winner
                    await advanceWinner(id, match.id, formState.winnerId);
                    setSubmitModal({ open: false, match: null });
                  } catch (e) {
                    console.error("Failed to submit result", e);
                  }
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

  {/* Dispute Modal */}
  {disputeModal.open && disputeModal.match && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Dispute Match</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Description</label>
            <input type="text" className="w-full border rounded p-2"
              value={disputeForm.description}
              onChange={(e) => setDisputeForm(s => ({ ...s, description: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Screenshot / Proof (URL)</label>
            <input type="url" className="w-full border rounded p-2" placeholder="https://..."
              onChange={(e) => {/* optional future upload */}} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="px-3 py-1 rounded border" onClick={() => setDisputeModal({ open: false, match: null })}>Cancel</button>
          <button
            className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50"
            disabled={!currentUserId || !disputeModal.match || !disputeForm.description}
            onClick={async () => {
              if (!currentUserId || !disputeModal.match) return;
              const match = disputeModal.match;
              try {
                await addDoc(collection(db, 'tournaments', id, 'matches', match.id, 'disputes'), {
                  description: disputeForm.description,
                  createdBy: currentUserId,
                  timestamp: serverTimestamp()
                });
                await updateDoc(doc(db, 'tournaments', id, 'matches', match.id), { status: 'disputed' });
                setDisputeModal({ open: false, match: null });
              } catch (e) {
                console.error('Failed to submit dispute', e);
              }
            }}
          >
            Submit Dispute
          </button>
        </div>
      </div>
    </div>
  )}

      {/* Competitive Overlay */}
      <CompetitiveOverlay
        tournamentId={id}
        isVisible={isOverlayVisible}
        onClose={() => toggleOverlay(false)}
      />

      {/* Pregame Lobby */}
      <PregameLobby
        tournamentId={id}
        isVisible={isLobbyVisible}
        onClose={() => toggleLobby(false)}
      />
    </div>
  );
}
