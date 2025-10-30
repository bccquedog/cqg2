"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Tournament {
  id: string;
  name: string;
  game: string;
  startTime: any;
  status: string;
  lobbyEnabled: boolean;
  lobbySettings: {
    showMusic: boolean;
    showPoll: boolean;
    showClips: boolean;
    showCountdown: boolean;
    musicUrl?: string;
    pollQuestion?: string;
    pollOptions?: string[];
    featuredClips?: string[];
  };
}

interface PollVote {
  id: string;
  userId: string;
  option: string;
  timestamp: any;
}

interface PregameLobbyProps {
  tournamentId: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function PregameLobby({ tournamentId, isVisible, onClose }: PregameLobbyProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [pollVotes, setPollVotes] = useState<PollVote[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load tournament data
  useEffect(() => {
    if (!tournamentId) return;

    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const unsubscribe = onSnapshot(tournamentRef, (doc) => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() } as Tournament;
        setTournament(data);
      }
    });

    return () => unsubscribe();
  }, [tournamentId]);

  // Countdown timer
  useEffect(() => {
    if (!tournament?.startTime) return;

    const updateCountdown = () => {
      const startTime = tournament.startTime.toDate ? tournament.startTime.toDate() : new Date(tournament.startTime);
      const now = new Date();
      const diff = startTime.getTime() - now.getTime();

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [tournament?.startTime]);

  // Load poll votes
  useEffect(() => {
    if (!tournamentId) return;

    const votesQuery = query(
      collection(db, 'events', `${tournamentId}-pregame`, 'polls'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(votesQuery, (snapshot) => {
      const votes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PollVote[];
      setPollVotes(votes);
    });

    return () => unsubscribe();
  }, [tournamentId]);

  // Get current user ID (simplified for demo)
  useEffect(() => {
    // In a real app, this would come from auth context
    setCurrentUserId('demo-user');
  }, []);

  const handleVote = async (option: string) => {
    if (!currentUserId || !tournamentId) return;

    try {
      // Remove existing vote if any
      if (userVote) {
        const existingVote = pollVotes.find(vote => vote.userId === currentUserId);
        if (existingVote) {
          // In a real app, you'd delete the existing vote
          console.log('Would delete existing vote:', existingVote.id);
        }
      }

      // Add new vote
      await addDoc(collection(db, 'events', `${tournamentId}-pregame`, 'polls'), {
        userId: currentUserId,
        option,
        timestamp: serverTimestamp()
      });

      setUserVote(option);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const getPollResults = () => {
    if (!tournament?.lobbySettings?.pollOptions) return {};

    const results: { [key: string]: number } = {};
    tournament.lobbySettings.pollOptions.forEach(option => {
      results[option] = pollVotes.filter(vote => vote.option === option).length;
    });

    return results;
  };

  const formatTimeUnit = (value: number, unit: string) => {
    return (
      <div className="text-center">
        <div className="text-3xl font-bold text-white">{value.toString().padStart(2, '0')}</div>
        <div className="text-sm text-gray-300 uppercase">{unit}</div>
      </div>
    );
  };

  if (!isVisible || !tournament || !tournament.lobbyEnabled) {
    return null;
  }

  const pollResults = getPollResults();
  const totalVotes = Object.values(pollResults).reduce((sum, count) => sum + count, 0);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50">
      <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg shadow-2xl max-w-6xl w-full mx-4 relative">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
            <p className="text-lg text-gray-300">{tournament.game} • Pregame Lobby</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Countdown Timer */}
              {tournament.lobbySettings?.showCountdown && timeLeft && (
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-600">
                  <h2 className="text-xl font-bold text-white mb-4">⏰ Tournament Starts In</h2>
                  <div className="flex justify-center space-x-6">
                    {formatTimeUnit(timeLeft.days, 'days')}
                    {formatTimeUnit(timeLeft.hours, 'hours')}
                    {formatTimeUnit(timeLeft.minutes, 'minutes')}
                    {formatTimeUnit(timeLeft.seconds, 'seconds')}
                  </div>
                </div>
              )}

              {/* Music Section */}
              {tournament.lobbySettings?.showMusic && tournament.lobbySettings?.musicUrl && (
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-600">
                  <h2 className="text-xl font-bold text-white mb-4">🎵 Tournament Music</h2>
                  <div className="text-center">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      {isPlaying ? '⏸️ Pause' : '▶️ Play'} Tournament Playlist
                    </button>
                    <p className="text-sm text-gray-400 mt-2">Streaming live tournament music</p>
                  </div>
                </div>
              )}

              {/* Featured Clips */}
              {tournament.lobbySettings?.showClips && tournament.lobbySettings?.featuredClips && (
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-600">
                  <h2 className="text-xl font-bold text-white mb-4">🎬 Featured Clips</h2>
                  <div className="space-y-3">
                    {tournament.lobbySettings.featuredClips.map((clip, index) => (
                      <div key={index} className="bg-gray-700 rounded p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-8 bg-red-600 rounded flex items-center justify-center">
                            <span className="text-white text-xs">▶</span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">Highlight Reel #{index + 1}</p>
                            <p className="text-gray-400 text-xs">Previous tournament moments</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Over/Under Poll */}
              {tournament.lobbySettings?.showPoll && tournament.lobbySettings?.pollQuestion && (
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-600">
                  <h2 className="text-xl font-bold text-white mb-4">📊 Prediction Poll</h2>
                  <p className="text-gray-300 mb-4">{tournament.lobbySettings.pollQuestion}</p>
                  
                  <div className="space-y-3">
                    {tournament.lobbySettings.pollOptions?.map((option, index) => {
                      const voteCount = pollResults[option] || 0;
                      const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                      const isUserVote = userVote === option;

                      return (
                        <div key={index} className="relative">
                          <button
                            onClick={() => handleVote(option)}
                            className={`w-full p-3 rounded-lg text-left transition-all ${
                              isUserVote 
                                ? 'bg-green-600 border-2 border-green-400' 
                                : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-white font-medium">{option}</span>
                              <span className="text-sm text-gray-300">
                                {voteCount} votes ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="mt-2 bg-gray-600 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  isUserVote ? 'bg-green-400' : 'bg-blue-400'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </button>
                          {isUserVote && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              Your Vote
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 text-center text-sm text-gray-400">
                    {totalVotes} total votes
                  </div>
                </div>
              )}

              {/* Tournament Info */}
              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-600">
                <h2 className="text-xl font-bold text-white mb-4">ℹ️ Tournament Info</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-yellow-400 font-medium">{tournament.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Game:</span>
                    <span className="text-white">{tournament.game}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Start Time:</span>
                    <span className="text-white">
                      {tournament.startTime?.toDate ? 
                        tournament.startTime.toDate().toLocaleString() : 
                        'TBD'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Chat Placeholder */}
              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-600">
                <h2 className="text-xl font-bold text-white mb-4">💬 Live Chat</h2>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  <div className="text-sm text-gray-400 italic">Chat will be available when tournament starts</div>
                  <div className="text-sm text-gray-500">Viewer123: Can't wait for this tournament!</div>
                  <div className="text-sm text-gray-500">Player456: Good luck everyone!</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Tournament Status */}
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4">
              <h3 className="text-xl font-bold text-white mb-2">Tournament Starting Soon!</h3>
              <p className="text-blue-100">
                Get ready for an epic {tournament.game} tournament. 
                {timeLeft && ` Starting in ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


