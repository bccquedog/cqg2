"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { 
  MessageSquare, 
  Users, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Crown,
  Trophy,
  Gamepad2
} from 'lucide-react';

interface DiscordCommunityProps {
  className?: string;
}

export default function DiscordCommunity({ className = "" }: DiscordCommunityProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isJoining, setIsJoining] = useState(false);

  const DISCORD_INVITE_URL = 'https://discord.gg/eY7QmDAeCy';

  const handleJoinDiscord = async () => {
    if (!user) {
      showToast('Please sign in to join the Discord community', 'error');
      return;
    }

    setIsJoining(true);
    try {
      // Open Discord invite in new tab
      window.open(DISCORD_INVITE_URL, '_blank');
      
      // Track community join (optional analytics)
      try {
        await fetch('/api/analytics/community-join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            platform: 'discord',
            timestamp: new Date().toISOString()
          }),
        });
      } catch (error) {
        console.log('Analytics tracking failed:', error);
      }

      showToast('Welcome to the CQG Discord community! 🎮', 'success');
    } catch (error) {
      console.error('Error joining Discord:', error);
      showToast('Failed to open Discord. Please try again.', 'error');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className={`bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Join Our Discord Community</h3>
            <div className="flex items-center space-x-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">
            Connect with fellow gamers, get tournament updates, and join exclusive community events.
          </p>

          {/* Community Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>Tournament Updates</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Player Networking</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <Crown className="w-4 h-4 text-purple-500" />
              <span>Exclusive Events</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <Gamepad2 className="w-4 h-4 text-green-500" />
              <span>Gaming Sessions</span>
            </div>
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoinDiscord}
            disabled={isJoining}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Joining...</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                <span>Join Discord Community</span>
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Discord Status */}
          <div className="mt-4 p-3 bg-white/50 rounded-lg border border-indigo-100">
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-700">
                <strong>Active Community:</strong> 24/7 gaming discussions and events
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
