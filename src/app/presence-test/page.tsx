"use client";

import { useState } from "react";
import { setPresence, setOffline, PresenceState } from "@/lib/realtimePresence";
import { usePresence } from "@/hooks/usePresence";

export default function PresenceTestPage() {
  const [userId, setUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const presence = usePresence(userId);

  const handlePresenceChange = async (state: PresenceState) => {
    if (!userId.trim()) {
      alert("Please enter a User ID first");
      return;
    }

    setIsLoading(true);
    try {
      if (state === "offline") {
        await setOffline(userId);
      } else {
        await setPresence(userId, state);
      }
    } catch (error) {
      console.error("Error updating presence:", error);
      alert("Failed to update presence. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  const getStateColor = (state: PresenceState) => {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🟢 CQG Presence System Test
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* User ID Input */}
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID (e.g., user123)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Presence Controls */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Presence Controls</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => handlePresenceChange("online")}
                disabled={isLoading || !userId.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Go Online
              </button>
              <button
                onClick={() => handlePresenceChange("idle")}
                disabled={isLoading || !userId.trim()}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Set Idle
              </button>
              <button
                onClick={() => handlePresenceChange("in_match")}
                disabled={isLoading || !userId.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                In Match
              </button>
              <button
                onClick={() => handlePresenceChange("offline")}
                disabled={isLoading || !userId.trim()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Go Offline
              </button>
            </div>
          </div>

          {/* Current Status Display */}
          {userId.trim() && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Current Status</h2>
              <div className="bg-gray-50 rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">User ID:</span>
                  <span className="text-sm text-gray-900 font-mono">{userId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">State:</span>
                  <span className={`text-sm px-2 py-1 rounded-full font-medium ${getStateColor(presence.state)}`}>
                    {presence.state}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Last Changed:</span>
                  <span className="text-sm text-gray-900">
                    {formatTimestamp(presence.lastChanged)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating presence...
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Enter a User ID in the input field</li>
              <li>2. Click any presence button to set the user&apos;s state</li>
              <li>3. The status will update in real-time below</li>
              <li>4. Try opening multiple tabs with the same User ID to test real-time sync</li>
              <li>5. Close the tab/browser to test automatic offline detection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
