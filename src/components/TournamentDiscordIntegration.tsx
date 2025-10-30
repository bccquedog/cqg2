"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { 
  MessageSquare, 
  Users, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Trophy,
  Clock,
  Shield
} from 'lucide-react';

interface TournamentDiscordIntegrationProps {
  tournamentId: string;
  tournamentName: string;
  playerCount?: number;
  className?: string;
}

export default function TournamentDiscordIntegration({ 
  tournamentId, 
  tournamentName, 
  playerCount = 0,
  className = "" 
}: TournamentDiscordIntegrationProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isJoining, setIsJoining] = useState(false);
  const [discordChannel, setDiscordChannel] = useState<string | null>(null);

  const DISCORD_INVITE_URL = 'https://discord.gg/eY7QmDAeCy';

  useEffect(() => {
    // Generate tournament-specific channel name
    const channelName = `tournament-${tournamentId.slice(0, 8)}`;
    setDiscordChannel(channelName);
  }, [tournamentId]);

  const handleJoinTournamentDiscord = async () => {
    if (!user) {
      showToast('Please sign in to join the tournament Discord channel', 'error');
      return;
    }

    setIsJoining(true);
    try {
      // Open Discord invite with tournament context
      const discordUrl = `${DISCORD_INVITE_URL}?tournament=${tournamentId}&channel=${discordChannel}`;
      window.open(discordUrl, '_blank');
      
      // Track tournament Discord join
      try {
        await fetch('/api/analytics/tournament-discord-join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            tournamentId,
            tournamentName,
            channelName: discordChannel,
            timestamp: new Date().toISOString()
          }),
        });
      } catch (error) {
        console.log('Analytics tracking failed:', error);
      }

      showToast(`Welcome to ${tournamentName} Discord channel! 🏆`, 'success');
    } catch (error) {
      console.error('Error joining tournament Discord:', error);
      showToast('Failed to open Discord. Please try again.', 'error');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Tournament Discord Channel</h3>
            <div className="flex items-center space-x-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              <Users className="w-3 h-3" />
              <span>{playerCount} players</span>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">
            Join the dedicated Discord channel for {tournamentName} to coordinate with other players, 
            get real-time updates, and participate in tournament discussions.
          </p>

          {/* Tournament Discord Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>Match Scheduling</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Tournament Rules</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>Bracket Updates</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span>Player Chat</span>
            </div>
          </div>

          {/* Channel Info */}
          {discordChannel && (
            <div className="mb-4 p-3 bg-white/50 rounded-lg border border-blue-100">
              <div className="flex items-center space-x-2 text-sm">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span className="text-gray-700">
                  <strong>Channel:</strong> #{discordChannel}
                </span>
              </div>
            </div>
          )}

          {/* Join Button */}
          <button
            onClick={handleJoinTournamentDiscord}
            disabled={isJoining}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Joining...</span>
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                <span>Join Tournament Discord</span>
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Tournament Discord Benefits */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>Tournament Benefits:</strong> Get instant notifications for your matches, 
                coordinate with opponents, and stay updated on bracket changes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
