"use client";

import LeaderboardPanel from "@/admin/LeaderboardPanel";

export default function TestLeaderboardPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Test Leaderboard Panel</h1>
        <LeaderboardPanel />
      </div>
    </div>
  );
}


