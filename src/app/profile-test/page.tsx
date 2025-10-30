"use client";

import { useState } from "react";
import { createProfile, getProfile, updateProfile, deleteProfile } from "@/lib/firestoreProfiles";
import { setPresence, setOffline, PresenceState } from "@/lib/realtimePresence";
import { usePresence } from "@/hooks/usePresence";
import { Profile } from "@/types/profile";

export default function ProfileTestPage() {
  const [userId, setUserId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [tier, setTier] = useState<"Gamer" | "Mamba" | "King" | "Elite">("Gamer");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const presence = usePresence(userId);

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleCreateProfile = async () => {
    if (!userId.trim() || !username.trim() || !email.trim()) {
      showMessage("Please fill in User ID, Username, and Email", true);
      return;
    }

    setIsLoading(true);
    try {
      await createProfile(userId, {
        username,
        email,
        tier,
      });
      showMessage("Profile created successfully!");
      await handleFetchProfile();
    } catch (error) {
      console.error("Error creating profile:", error);
      showMessage("Failed to create profile", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userId.trim()) {
      showMessage("Please enter a User ID", true);
      return;
    }

    setIsLoading(true);
    try {
      const updateData: Partial<Profile> = {};
      if (username.trim()) updateData.username = username;
      if (email.trim()) updateData.email = email;
      updateData.tier = tier;

      await updateProfile(userId, updateData);
      showMessage("Profile updated successfully!");
      await handleFetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      showMessage("Failed to update profile", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchProfile = async () => {
    if (!userId.trim()) {
      showMessage("Please enter a User ID", true);
      return;
    }

    setIsLoading(true);
    try {
      const fetchedProfile = await getProfile(userId);
      setProfile(fetchedProfile);
      
      if (fetchedProfile) {
        setUsername(fetchedProfile.username);
        setEmail(fetchedProfile.email);
        setTier(fetchedProfile.tier);
        showMessage("Profile fetched successfully!");
      } else {
        showMessage("Profile not found", true);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      showMessage("Failed to fetch profile", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!userId.trim()) {
      showMessage("Please enter a User ID", true);
      return;
    }

    if (!confirm("Are you sure you want to delete this profile?")) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteProfile(userId);
      setProfile(null);
      setUsername("");
      setEmail("");
      setTier("Gamer");
      showMessage("Profile deleted successfully!");
    } catch (error) {
      console.error("Error deleting profile:", error);
      showMessage("Failed to delete profile", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresenceChange = async (state: PresenceState) => {
    if (!userId.trim()) {
      showMessage("Please enter a User ID first", true);
      return;
    }

    try {
      if (state === "offline") {
        await setOffline(userId);
      } else {
        await setPresence(userId, state);
      }
      showMessage(`Presence set to ${state}`);
    } catch (error) {
      console.error("Error updating presence:", error);
      showMessage("Failed to update presence", true);
    }
  };

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  const getPresenceColor = (state: PresenceState) => {
    switch (state) {
      case "online":
        return "text-green-600 bg-green-100";
      case "idle":
        return "text-yellow-600 bg-yellow-100";
      case "in_match":
        return "text-blue-600 bg-blue-100";
      case "offline":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Elite":
        return "text-purple-600 bg-purple-100";
      case "King":
        return "text-red-600 bg-red-100";
      case "Mamba":
        return "text-blue-600 bg-blue-100";
      case "Gamer":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🎮 CQG Profile + Presence System Test
        </h1>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${message.includes("Failed") || message.includes("Please") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">👤 Profile Management</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                  User ID *
                </label>
                <input
                  type="text"
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user ID (e.g., user123)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="tier" className="block text-sm font-medium text-gray-700 mb-2">
                  Tier
                </label>
                <select
                  id="tier"
                  value={tier}
                  onChange={(e) => setTier(e.target.value as "Gamer" | "Mamba" | "King" | "Elite")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Gamer">Gamer</option>
                  <option value="Mamba">Mamba</option>
                  <option value="King">King</option>
                  <option value="Elite">Elite</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCreateProfile}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={handleUpdateProfile}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                >
                  Update
                </button>
                <button
                  onClick={handleFetchProfile}
                  disabled={isLoading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-300 transition-colors"
                >
                  Fetch
                </button>
                <button
                  onClick={handleDeleteProfile}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Presence Control */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🟢 Presence Control</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePresenceChange("online")}
                  disabled={!userId.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                >
                  Go Online
                </button>
                <button
                  onClick={() => handlePresenceChange("idle")}
                  disabled={!userId.trim()}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-300 transition-colors"
                >
                  Set Idle
                </button>
                <button
                  onClick={() => handlePresenceChange("in_match")}
                  disabled={!userId.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                >
                  In Match
                </button>
                <button
                  onClick={() => handlePresenceChange("offline")}
                  disabled={!userId.trim()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 transition-colors"
                >
                  Go Offline
                </button>
              </div>

              {/* Live Presence Status */}
              {userId.trim() && (
                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Live Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Presence:</span>
                      <span className={`text-sm px-2 py-1 rounded-full font-medium ${getPresenceColor(presence.state)}`}>
                        {presence.state}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Last Changed:</span>
                      <span className="text-sm text-gray-900">
                        {formatTimestamp(presence.lastChanged)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Combined Profile + Presence Display */}
        {profile && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 Player Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Info */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Profile Information</h3>
                <div className="bg-gray-50 rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Username:</span>
                    <span className="text-sm text-gray-900 font-medium">{profile.username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Email:</span>
                    <span className="text-sm text-gray-900">{profile.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Tier:</span>
                    <span className={`text-sm px-2 py-1 rounded-full font-medium ${getTierColor(profile.tier)}`}>
                      {profile.tier}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Record:</span>
                    <span className="text-sm text-gray-900">{profile.wins}W - {profile.losses}L</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Tournaments:</span>
                    <span className="text-sm text-gray-900">{profile.tournamentsWon}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Leagues:</span>
                    <span className="text-sm text-gray-900">{profile.leaguesWon}</span>
                  </div>
                </div>
              </div>

              {/* Live Status */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Live Status</h3>
                <div className="bg-gray-50 rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Current Status:</span>
                    <span className={`text-sm px-2 py-1 rounded-full font-medium ${getPresenceColor(presence.state)}`}>
                      {presence.state}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Last Active:</span>
                    <span className="text-sm text-gray-900">
                      {formatTimestamp(presence.lastChanged)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Profile Created:</span>
                    <span className="text-sm text-gray-900">
                      {formatTimestamp(profile.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Last Updated:</span>
                    <span className="text-sm text-gray-900">
                      {formatTimestamp(profile.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Raw JSON Output */}
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">Raw Profile Data</h3>
              <pre className="bg-gray-100 rounded-md p-4 text-sm overflow-x-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
              <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-900">Processing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
