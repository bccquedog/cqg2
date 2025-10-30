"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/enhanced-card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/enhanced-badge";
import { 
  MessageSquare, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Unlink, 
  User,
  Shield,
  Clock
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { discordClient } from "@/lib/discordClient";
import type { DiscordProfile } from "@/types/player";

interface DiscordSettingsProps {
  userId: string;
  discordProfile?: DiscordProfile;
  onDiscordUpdate: (discord: DiscordProfile | null) => void;
}

export default function DiscordSettings({ 
  userId, 
  discordProfile, 
  onDiscordUpdate 
}: DiscordSettingsProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [discordId, setDiscordId] = useState(discordProfile?.id || "");

  const isLinked = discordProfile?.id && discordProfile?.username;

  const handleLinkDiscord = async () => {
    if (!discordId.trim()) {
      showToast("Please enter a valid Discord ID", "error");
      return;
    }

    // Validate Discord ID format (should be a numeric string)
    if (!/^\d{17,19}$/.test(discordId)) {
      showToast("Discord ID must be a valid 17-19 digit number", "error");
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, you would:
      // 1. Validate the Discord ID with Discord API
      // 2. Fetch Discord user information
      // 3. Store the linked Discord profile
      
      const discordProfile: DiscordProfile = {
        id: discordId,
        username: "DiscordUser", // This would come from Discord API
        global_name: "Discord User",
        verified: true,
        linkedAt: new Date()
      };

      await updateDoc(doc(db, "players", userId), {
        discord: discordProfile,
        updatedAt: serverTimestamp()
      });

      onDiscordUpdate(discordProfile);
      showToast("Discord account linked successfully!", "success");
    } catch (error) {
      console.error("Error linking Discord:", error);
      showToast("Failed to link Discord account. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkDiscord = async () => {
    if (!confirm('Are you sure you want to unlink your Discord account? This will remove all connected gaming accounts.')) {
      return;
    }

    setLoading(true);
    try {
      await discordClient.unlinkDiscordAccount(userId);
      onDiscordUpdate(null);
      setDiscordId("");
      showToast("Discord account unlinked successfully!", "success");
    } catch (error) {
      console.error("Error unlinking Discord:", error);
      showToast("Failed to unlink Discord account. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordOAuth = async () => {
    setLoading(true);
    try {
      // Generate state parameter for security
      const state = userId;
      const authUrl = discordClient.generateAuthUrl(state);
      
      // Redirect to Discord OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Discord OAuth:', error);
      showToast('Failed to initiate Discord linking', 'error');
      setLoading(false);
    }
  };

  const formatDiscordUsername = (discord: DiscordProfile) => {
    if (discord.global_name) {
      return discord.global_name;
    }
    if (discord.username && discord.discriminator && discord.discriminator !== "0") {
      return `${discord.username}#${discord.discriminator}`;
    }
    return discord.username || "Unknown User";
  };

  return (
    <Card variant="elevated" size="md" className="w-full">
      <CardHeader spacing="normal">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle level="h3" className="text-lg font-semibold text-neutral-900">
              Discord Integration
            </CardTitle>
            <p className="text-sm text-neutral-600">
              Link your Discord account for better community features
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent spacing="normal">
        {isLinked ? (
          <div className="space-y-4">
            {/* Linked Discord Profile */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-green-800">
                      {formatDiscordUsername(discordProfile!)}
                    </span>
                    {discordProfile?.verified && (
                      <Badge variant="success" size="sm">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-green-700">
                    <span>ID: {discordProfile?.id}</span>
                    {discordProfile?.linkedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Linked {new Date(discordProfile.linkedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Discord Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => window.open("https://discord.com/channels/@me", "_blank")}
                variant="outline"
                size="sm"
                leftIcon={<ExternalLink className="h-4 w-4" />}
                className="flex-1"
              >
                Open Discord
              </Button>
              <Button
                onClick={handleUnlinkDiscord}
                disabled={loading}
                variant="destructive"
                size="sm"
                leftIcon={<Unlink className="h-4 w-4" />}
              >
                {loading ? "Unlinking..." : "Unlink"}
              </Button>
            </div>

            {/* Linked Gaming Accounts */}
            {discordProfile?.linkedAccounts && Object.keys(discordProfile.linkedAccounts).length > 0 && (
              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <h4 className="text-sm font-semibold text-indigo-800 mb-2">Linked Gaming Accounts</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {discordProfile.linkedAccounts.xbox && (
                    <div className="flex items-center space-x-2 p-2 bg-white rounded">
                      <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">X</span>
                      </div>
                      <span className="text-sm">{discordProfile.linkedAccounts.xbox.gamertag}</span>
                    </div>
                  )}
                  {discordProfile.linkedAccounts.playstation && (
                    <div className="flex items-center space-x-2 p-2 bg-white rounded">
                      <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">P</span>
                      </div>
                      <span className="text-sm">{discordProfile.linkedAccounts.playstation.username}</span>
                    </div>
                  )}
                  {discordProfile.linkedAccounts.steam && (
                    <div className="flex items-center space-x-2 p-2 bg-white rounded">
                      <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>
                      <span className="text-sm">{discordProfile.linkedAccounts.steam.username}</span>
                    </div>
                  )}
                  {discordProfile.linkedAccounts.battleNet && (
                    <div className="flex items-center space-x-2 p-2 bg-white rounded">
                      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">B</span>
                      </div>
                      <span className="text-sm">{discordProfile.linkedAccounts.battleNet.battletag}</span>
                    </div>
                  )}
                  {discordProfile.linkedAccounts.epic && (
                    <div className="flex items-center space-x-2 p-2 bg-white rounded">
                      <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">E</span>
                      </div>
                      <span className="text-sm">{discordProfile.linkedAccounts.epic.username}</span>
                    </div>
                  )}
                  {discordProfile.linkedAccounts.riot && (
                    <div className="flex items-center space-x-2 p-2 bg-white rounded">
                      <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">R</span>
                      </div>
                      <span className="text-sm">{discordProfile.linkedAccounts.riot.username}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Discord Benefits */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Discord Benefits</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Join tournament-specific Discord channels</li>
                <li>• Get notifications for your matches</li>
                <li>• Connect with other players easily</li>
                <li>• Access exclusive community features</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Link Discord Options */}
            <div className="space-y-3">
              <Button
                onClick={handleDiscordOAuth}
                variant="default"
                size="lg"
                className="w-full"
                leftIcon={<MessageSquare className="h-5 w-5" />}
              >
                Link with Discord OAuth
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-neutral-500">or</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-neutral-700">
                    Enter Discord ID Manually
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      value={discordId}
                      onChange={(e) => setDiscordId(e.target.value)}
                      placeholder="Your Discord ID (17-19 digits)"
                      className="w-full pl-10 pr-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200"
                      maxLength={19}
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Find your Discord ID: Settings → Advanced → Developer Mode → Right-click your username
                  </p>
                </div>

                <Button
                  onClick={handleLinkDiscord}
                  disabled={loading || !discordId.trim()}
                  loading={loading}
                  variant="success"
                  size="lg"
                  className="w-full"
                  leftIcon={<CheckCircle className="h-5 w-5" />}
                >
                  {loading ? "Linking..." : "Link Discord ID"}
                </Button>
              </div>
            </div>

            {/* Discord Benefits */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Why Link Discord?</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Join tournament-specific Discord channels</li>
                <li>• Get real-time match notifications</li>
                <li>• Connect with other players easily</li>
                <li>• Access exclusive community features</li>
                <li>• Participate in Discord-only events</li>
              </ul>
            </div>

            {/* Privacy Notice */}
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-neutral-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-neutral-800 mb-1">Privacy Notice</h4>
                  <p className="text-xs text-neutral-600">
                    We only store your Discord ID and username. We don&apos;t access your messages, 
                    servers, or any other Discord data. You can unlink your account at any time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
