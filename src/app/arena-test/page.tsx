"use client";

import ArenaOverlay from "@/components/ArenaOverlay";

export default function ArenaTestPage() {
  const leftPlayer = {
    username: "PlayerOne",
    avatarUrl: "/default-avatar.png",
    stats: { wins: 12, losses: 5 },
    streamUrl: "https://twitch.tv/playerone"
  };

  const rightPlayer = {
    username: "PlayerTwo",
    avatarUrl: "/default-avatar.png",
    stats: { wins: 9, losses: 7 }
  };

  return (
    <div className="relative w-full h-screen bg-gray-900">
      {/* Test background */}
      <div className="absolute inset-0 flex items-center justify-center text-white text-3xl">
        🔴 Live Match Stream Placeholder
      </div>

      {/* Overlay */}
      <ArenaOverlay
        leftPlayer={leftPlayer}
        rightPlayer={rightPlayer}
        roundName="Quarterfinals"
        matchScore="1 - 0"
        sponsorLogo="/default-sponsor.png"
        theme="default"
      />
    </div>
  );
}
