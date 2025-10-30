"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/hooks/useAuth";
import GamerTagEditor from "@/components/GamerTagEditor";
import DiscordSettings from "@/components/DiscordSettings";
import type { DiscordProfile } from "@/types/player";

interface Player {
  id: string;
  gamerTag?: string;
  displayName?: string;
  email?: string;
  status?: string;
  wallet?: number;
  stats?: {
    tournamentsJoined?: number;
    matchesPlayed?: number;
    wins?: number;
  };
  discord?: DiscordProfile;
  createdAt?: {
    seconds: number;
  };
}

export default function ProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const playerId = params.playerId as string;
  const { user } = useAuth();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [gamerTag, setGamerTag] = useState("");
  const [discordProfile, setDiscordProfile] = useState<DiscordProfile | null>(null);

  const isOwnProfile = user?.uid === playerId;

  useEffect(() => {
    const loadPlayer = async () => {
      try {
        const playerRef = doc(db, "players", playerId);
        const playerSnap = await getDoc(playerRef);
        
        if (playerSnap.exists()) {
          const playerData = { id: playerSnap.id, ...playerSnap.data() };
          setPlayer(playerData);
          setGamerTag(playerData.gamerTag || playerData.displayName || "Unknown");
          setDiscordProfile(playerData.discord || null);
        }
      } catch (error) {
        console.error("Error loading player:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayer();
  }, [playerId]);

  const handleGamerTagUpdate = (newGamerTag: string) => {
    setGamerTag(newGamerTag);
    setPlayer(prev => prev ? { ...prev, gamerTag: newGamerTag, displayName: newGamerTag } : null);
  };

  const handleDiscordUpdate = (discord: DiscordProfile | null) => {
    setDiscordProfile(discord);
    setPlayer(prev => prev ? { ...prev, discord } : null);
  };

  // Handle Discord OAuth callback
  useEffect(() => {
    const discordLinked = searchParams.get("discord_linked");
    if (discordLinked === "true") {
      // Handle successful Discord linking
      const discordId = searchParams.get("discord_id");
      const discordUsername = searchParams.get("discord_username");
      if (discordId && discordUsername) {
        // You could show a success message here
        console.log(`Discord linked: ${discordUsername} (${discordId})`);
      }
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Player not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Player Profile</h1>
          {isOwnProfile && (
            <div className="text-sm text-gray-500">
              Your Profile
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Basic Info</h2>
              
              {isOwnProfile ? (
                <GamerTagEditor
                  currentGamerTag={gamerTag}
                  userId={playerId}
                  onUpdate={handleGamerTagUpdate}
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gamer Tag</label>
                  <div className="text-lg font-mono bg-gray-100 px-3 py-2 rounded-lg">
                    {gamerTag}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="text-gray-600 px-3 py-2 bg-gray-50 rounded-lg">
                  {isOwnProfile ? player.email : "Hidden"}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Member Since</label>
                <div className="text-gray-600 px-3 py-2 bg-gray-50 rounded-lg">
                  {player.createdAt ? new Date(player.createdAt.seconds * 1000).toLocaleDateString() : "Unknown"}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="px-3 py-2 bg-green-50 text-green-800 rounded-lg">
                  {player.status || "Active"}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">CQG Coins</label>
                <div className="px-3 py-2 bg-yellow-50 text-yellow-800 rounded-lg font-mono">
                  {player.wallet || 0} CQG Coins
                </div>
              </div>

              {discordProfile && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Discord</label>
                  <div className="px-3 py-2 bg-indigo-50 text-indigo-800 rounded-lg flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    <span className="font-medium">
                      {discordProfile.global_name || discordProfile.username}
                      {discordProfile.discriminator && discordProfile.discriminator !== "0" && `#${discordProfile.discriminator}`}
                    </span>
                    {discordProfile.verified && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Statistics</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Tournaments Joined</span>
                  <span className="text-lg font-bold text-blue-600">
                    {player.stats?.tournamentsJoined || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Matches Played</span>
                  <span className="text-lg font-bold text-green-600">
                    {player.stats?.matchesPlayed || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Wins</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {player.stats?.wins || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Win Rate</span>
                  <span className="text-lg font-bold text-purple-600">
                    {player.stats?.matchesPlayed > 0 
                      ? Math.round((player.stats.wins / player.stats.matchesPlayed) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isOwnProfile && (
          <div className="mt-8 space-y-6">
            {/* Discord Settings */}
            <DiscordSettings
              userId={playerId}
              discordProfile={discordProfile}
              onDiscordUpdate={handleDiscordUpdate}
            />
            
            {/* Profile Management Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Profile Management</h3>
              <p className="text-sm text-blue-700">
                You can change your gamer tag anytime using the edit button above. 
                Your gamer tag is how other players will see you in tournaments and matches.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}