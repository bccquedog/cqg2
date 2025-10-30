"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { discordClient } from '@/lib/discordClient';
import { DiscordProfile } from '@/types/player';
import { useToast } from '@/components/Toast';

interface DiscordLinkProps {
  currentDiscord?: DiscordProfile | null;
  onDiscordUpdate?: (discord: DiscordProfile | null) => void;
  className?: string;
}

export default function DiscordLink({ 
  currentDiscord, 
  onDiscordUpdate, 
  className = "" 
}: DiscordLinkProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const handleLinkDiscord = async () => {
    if (!user) {
      showToast('Please sign in to link your Discord account', 'error');
      return;
    }

    setIsLinking(true);
    try {
      // Generate state parameter for security
      const state = user.uid;
      const authUrl = discordClient.generateAuthUrl(state);
      
      // Redirect to Discord OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Discord link:', error);
      showToast('Failed to initiate Discord linking', 'error');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkDiscord = async () => {
    if (!user) {
      showToast('Please sign in to unlink your Discord account', 'error');
      return;
    }

    if (!confirm('Are you sure you want to unlink your Discord account? This will remove all connected gaming accounts.')) {
      return;
    }

    setIsUnlinking(true);
    try {
      await discordClient.unlinkDiscordAccount(user.uid);
      onDiscordUpdate?.(null);
      showToast('Discord account unlinked successfully', 'success');
    } catch (error) {
      console.error('Error unlinking Discord:', error);
      showToast('Failed to unlink Discord account', 'error');
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleSyncDiscord = async () => {
    if (!user || !currentDiscord) {
      showToast('No Discord account linked to sync', 'error');
      return;
    }

    setIsLinking(true);
    try {
      // This would require a stored access token or re-authentication
      // For now, we'll show a message to re-link for fresh data
      showToast('Please re-link your Discord account to sync the latest data', 'info');
    } catch (error) {
      console.error('Error syncing Discord:', error);
      showToast('Failed to sync Discord data', 'error');
    } finally {
      setIsLinking(false);
    }
  };

  if (currentDiscord) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-3">
          {currentDiscord.avatar && (
            <img
              src={currentDiscord.avatar}
              alt="Discord Avatar"
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {currentDiscord.global_name || currentDiscord.username}
              {currentDiscord.discriminator && currentDiscord.discriminator !== '0' && (
                <span className="text-gray-500">#{currentDiscord.discriminator}</span>
              )}
            </h3>
            <p className="text-sm text-gray-600">Linked {new Date(currentDiscord.linkedAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Linked Gaming Accounts */}
        {currentDiscord.linkedAccounts && Object.keys(currentDiscord.linkedAccounts).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Linked Gaming Accounts</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentDiscord.linkedAccounts.xbox && (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">X</span>
                  </div>
                  <span className="text-sm">{currentDiscord.linkedAccounts.xbox.gamertag}</span>
                </div>
              )}
              {currentDiscord.linkedAccounts.playstation && (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                  <span className="text-sm">{currentDiscord.linkedAccounts.playstation.username}</span>
                </div>
              )}
              {currentDiscord.linkedAccounts.steam && (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                  <span className="text-sm">{currentDiscord.linkedAccounts.steam.username}</span>
                </div>
              )}
              {currentDiscord.linkedAccounts.battleNet && (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">B</span>
                  </div>
                  <span className="text-sm">{currentDiscord.linkedAccounts.battleNet.battletag}</span>
                </div>
              )}
              {currentDiscord.linkedAccounts.epic && (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">E</span>
                  </div>
                  <span className="text-sm">{currentDiscord.linkedAccounts.epic.username}</span>
                </div>
              )}
              {currentDiscord.linkedAccounts.riot && (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">R</span>
                  </div>
                  <span className="text-sm">{currentDiscord.linkedAccounts.riot.username}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleSyncDiscord}
            disabled={isLinking}
            className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLinking ? 'Syncing...' : 'Sync Data'}
          </button>
          <button
            onClick={handleUnlinkDiscord}
            disabled={isUnlinking}
            className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUnlinking ? 'Unlinking...' : 'Unlink'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Link Your Discord Account</h3>
        <p className="text-gray-600 mb-4">
          Connect your Discord account to sync your gaming profiles and join our community servers.
        </p>
        <button
          onClick={handleLinkDiscord}
          disabled={isLinking}
          className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          <span>{isLinking ? 'Connecting...' : 'Connect Discord'}</span>
        </button>
      </div>
    </div>
  );
}
