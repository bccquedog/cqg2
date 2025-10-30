"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { discordClient } from '@/lib/discordClient';
import { useToast } from '@/components/Toast';

export default function DiscordCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const handleDiscordCallback = async () => {
      const discordLinked = searchParams.get('discord_linked');
      const discordError = searchParams.get('discord_error');
      const discordId = searchParams.get('discord_id');
      const discordUsername = searchParams.get('discord_username');
      const state = searchParams.get('state');

      if (discordError) {
        console.error('Discord OAuth error:', discordError);
        showToast(`Discord linking failed: ${discordError}`, 'error');
        return;
      }

      if (discordLinked === 'true' && discordId && discordUsername && user) {
        try {
          // Get the authorization code from the URL
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');

          if (!code) {
            showToast('Discord authorization failed - no code received', 'error');
            return;
          }

          // Exchange code for token and sync Discord data
          const tokenData = await discordClient.exchangeCodeForToken(code);
          const discordProfile = await discordClient.syncDiscordData(tokenData.access_token, user.uid);

          showToast(`Discord account linked successfully! Welcome ${discordUsername}`, 'success');

          // Handle tournament auto-join if state contains tournament info
          if (state && state !== 'default') {
            const storedTournament = sessionStorage.getItem('pendingTournament');
            if (storedTournament) {
              const tournament = JSON.parse(storedTournament);
              showToast(`You've been added to ${tournament.name}!`, 'success');
              sessionStorage.removeItem('pendingTournament');
            }
          }

          // Redirect to profile page to show linked Discord data
          router.push(`/profile/${user.uid}`);
        } catch (error) {
          console.error('Error processing Discord callback:', error);
          showToast('Failed to sync Discord data. Please try again.', 'error');
        }
      }
    };

    handleDiscordCallback();
  }, [searchParams, user, showToast, router]);

  return null; // This component doesn't render anything
}
