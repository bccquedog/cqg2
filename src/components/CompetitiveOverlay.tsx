"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Match {
  id: string;
  playerA: string;
  playerB: string;
  playerAId: string;
  playerBId: string;
  scoreA: number;
  scoreB: number;
  status: 'pending' | 'live' | 'completed';
  round: number;
  roundNumber: number;
  winner?: string;
  startedAt?: any;
  durationSeconds?: number;
  streamLink?: string;
}

interface Player {
  id: string;
  displayName: string;
  tier: string;
  avatarUrl?: string;
  wins: number;
  losses: number;
  winRate: number;
}

interface Tournament {
  id: string;
  name: string;
  game: string;
  status: string;
  showOverlay: boolean;
  currentMatchId?: string;
}

interface CompetitiveOverlayProps {
  tournamentId: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function CompetitiveOverlay({ tournamentId, isVisible, onClose }: CompetitiveOverlayProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<{ [key: string]: Player }>({});
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [autoCycle, setAutoCycle] = useState(true);
  const [matchTimer, setMatchTimer] = useState(0);

  // Load tournament data
  useEffect(() => {
    if (!tournamentId) return;

    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const unsubscribe = onSnapshot(tournamentRef, (doc) => {
      if (doc.exists()) {
        setTournament({ id: doc.id, ...doc.data() } as Tournament);
      }
    });

    return () => unsubscribe();
  }, [tournamentId]);

  // Load matches data
  useEffect(() => {
    if (!tournamentId) return;

    const matchesQuery = query(
      collection(db, 'tournaments', tournamentId, 'matches'),
      orderBy('roundNumber', 'asc'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Match[];

      setMatches(matchesData);

      // Set current match based on tournament's currentMatchId or first live match
      if (matchesData.length > 0) {
        const liveMatch = matchesData.find(m => m.status === 'live');
        const currentMatchFromTournament = matchesData.find(m => m.id === tournament?.currentMatchId);
        
        if (currentMatchFromTournament) {
          setCurrentMatch(currentMatchFromTournament);
          setCurrentMatchIndex(matchesData.findIndex(m => m.id === currentMatchFromTournament.id));
        } else if (liveMatch) {
          setCurrentMatch(liveMatch);
          setCurrentMatchIndex(matchesData.findIndex(m => m.id === liveMatch.id));
        } else {
          // Find next pending match
          const nextMatch = matchesData.find(m => m.status === 'pending');
          if (nextMatch) {
            setCurrentMatch(nextMatch);
            setCurrentMatchIndex(matchesData.findIndex(m => m.id === nextMatch.id));
          }
        }
      }
    });

    return () => unsubscribe();
  }, [tournamentId, tournament?.currentMatchId]);

  // Load player data for current match
  useEffect(() => {
    if (!currentMatch) return;

    const loadPlayers = async () => {
      const playerPromises = [currentMatch.playerAId, currentMatch.playerBId].map(async (playerId) => {
        const playerDoc = await getDoc(doc(db, 'players', playerId));
        if (playerDoc.exists()) {
          return { [playerId]: { id: playerDoc.id, ...playerDoc.data() } as Player };
        }
        return {};
      });

      const playerResults = await Promise.all(playerPromises);
      const playersData = Object.assign({}, ...playerResults);
      setPlayers(playersData);
    };

    loadPlayers();
  }, [currentMatch]);

  // Match timer
  useEffect(() => {
    if (!currentMatch || currentMatch.status !== 'live') {
      setMatchTimer(0);
      return;
    }

    const interval = setInterval(() => {
      if (currentMatch.startedAt) {
        const startTime = currentMatch.startedAt.toDate ? currentMatch.startedAt.toDate() : new Date(currentMatch.startedAt);
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setMatchTimer(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentMatch]);

  // Auto-cycle through matches
  useEffect(() => {
    if (!autoCycle || matches.length === 0) return;

    const interval = setInterval(() => {
      setCurrentMatchIndex(prev => {
        const nextIndex = (prev + 1) % matches.length;
        setCurrentMatch(matches[nextIndex]);
        return nextIndex;
      });
    }, 10000); // Cycle every 10 seconds

    return () => clearInterval(interval);
  }, [autoCycle, matches]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'pro': return 'text-red-500 bg-red-100';
      case 'elite': return 'text-purple-500 bg-purple-100';
      case 'diamond': return 'text-blue-500 bg-blue-100';
      case 'platinum': return 'text-green-500 bg-green-100';
      case 'gold': return 'text-yellow-500 bg-yellow-100';
      case 'silver': return 'text-gray-500 bg-gray-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-red-500 bg-red-100 border-red-300';
      case 'completed': return 'text-green-500 bg-green-100 border-green-300';
      case 'pending': return 'text-yellow-500 bg-yellow-100 border-yellow-300';
      default: return 'text-gray-500 bg-gray-100 border-gray-300';
    }
  };

  const navigateMatch = useCallback((direction: 'prev' | 'next') => {
    if (matches.length === 0) return;

    setAutoCycle(false); // Disable auto-cycle when manually navigating
    
    setCurrentMatchIndex(prev => {
      let newIndex;
      if (direction === 'next') {
        newIndex = (prev + 1) % matches.length;
      } else {
        newIndex = prev === 0 ? matches.length - 1 : prev - 1;
      }
      setCurrentMatch(matches[newIndex]);
      return newIndex;
    });
  }, [matches]);

  if (!isVisible || !tournament || !currentMatch) {
    return null;
  }

  const playerA = players[currentMatch.playerAId];
  const playerB = players[currentMatch.playerBId];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 relative">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold">{tournament.name}</h2>
            <p className="text-sm text-gray-400">{tournament.game}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAutoCycle(!autoCycle)}
              className={`px-3 py-1 rounded text-sm ${
                autoCycle ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}
            >
              {autoCycle ? 'Auto-Cycle ON' : 'Auto-Cycle OFF'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Match Content */}
        <div className="p-6">
          {/* Match Status and Round */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(currentMatch.status)}`}>
                {currentMatch.status.toUpperCase()}
              </span>
              <span className="text-lg font-semibold">Round {currentMatch.round}</span>
            </div>
            <div className="text-sm text-gray-400">
              Match {currentMatchIndex + 1} of {matches.length}
            </div>
          </div>

          {/* Players */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            {/* Player A */}
            <div className={`text-center p-6 rounded-lg border-2 transition-all duration-300 ${
              currentMatch.status === 'live' 
                ? 'border-red-500 bg-red-900 bg-opacity-20 glow-soft' 
                : 'border-gray-600 bg-gray-800'
            }`}>
              <div className="flex items-center justify-center mb-4">
                {playerA?.avatarUrl && (
                  <img 
                    src={playerA.avatarUrl} 
                    alt={playerA.displayName}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold">{playerA?.displayName || currentMatch.playerA}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(playerA?.tier || '')}`}>
                    {playerA?.tier || 'Gamer'}
                  </span>
                </div>
              </div>
              <div className="text-4xl font-bold text-red-400 mb-2">
                {currentMatch.scoreA}
              </div>
              <div className="text-sm text-gray-400">
                {playerA ? `${playerA.wins}W - ${playerA.losses}L (${Math.round(playerA.winRate * 100)}%)` : ''}
              </div>
            </div>

            {/* VS */}
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400 mb-2">VS</div>
                {currentMatch.status === 'live' && (
                  <div className="text-lg font-mono text-red-400">
                    {formatTime(matchTimer)}
                  </div>
                )}
              </div>
            </div>

            {/* Player B */}
            <div className={`text-center p-6 rounded-lg border-2 transition-all duration-300 ${
              currentMatch.status === 'live' 
                ? 'border-red-500 bg-red-900 bg-opacity-20 glow-soft' 
                : 'border-gray-600 bg-gray-800'
            }`}>
              <div className="flex items-center justify-center mb-4">
                {playerB?.avatarUrl && (
                  <img 
                    src={playerB.avatarUrl} 
                    alt={playerB.displayName}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold">{playerB?.displayName || currentMatch.playerB}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(playerB?.tier || '')}`}>
                    {playerB?.tier || 'Gamer'}
                  </span>
                </div>
              </div>
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {currentMatch.scoreB}
              </div>
              <div className="text-sm text-gray-400">
                {playerB ? `${playerB.wins}W - ${playerB.losses}L (${Math.round(playerB.winRate * 100)}%)` : ''}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {currentMatch.status === 'live' && (
            <div className="mb-6">
              <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-2 bg-gradient-to-r from-red-500 to-blue-500 rounded-full animate-pulse"
                  style={{ 
                    width: `${Math.min((matchTimer / 300) * 100, 100)}%` // 5 minutes max
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Match Progress</span>
                <span>{formatTime(matchTimer)}</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigateMatch('prev')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              ← Previous Match
            </button>
            <div className="flex space-x-2">
              {matches.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentMatchIndex(index);
                    setCurrentMatch(matches[index]);
                    setAutoCycle(false);
                  }}
                  className={`w-3 h-3 rounded-full ${
                    index === currentMatchIndex ? 'bg-white' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => navigateMatch('next')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Next Match →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


