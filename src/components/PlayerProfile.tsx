"use client";

import Image from "next/image";
import { formatLastActive } from "@/lib/timeUtils";

export default function PlayerProfile({ player }: { player: any }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Image
          src={player.avatarUrl || "/default-avatar.png"}
          alt={player.username}
          width={80}
          height={80}
          className="rounded-full"
        />
        <div>
          <h2 className="text-2xl font-bold">{player.username}</h2>
          <p className="text-sm text-gray-500">{player.bio || "No bio yet"}</p>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                player.status === "online"
                  ? "bg-green-500"
                  : player.status === "in_match"
                  ? "bg-yellow-500"
                  : "bg-gray-400"
              }`}
            ></span>
            {player.lastActive && (
              <span className="text-xs text-gray-400">
                Active {formatLastActive(player.lastActive)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xl font-bold">{player.stats?.matchesPlayed || 0}</p>
          <p className="text-xs text-gray-500">Matches</p>
        </div>
        <div>
          <p className="text-xl font-bold text-green-600">{player.stats?.wins || 0}</p>
          <p className="text-xs text-gray-500">Wins</p>
        </div>
        <div>
          <p className="text-xl font-bold text-red-600">{player.stats?.losses || 0}</p>
          <p className="text-xs text-gray-500">Losses</p>
        </div>
      </div>

      {/* Stream link */}
      {player.streamUrl && (
        <p className="text-sm mt-2">
          <a
            href={player.streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline"
          >
            🎥 Watch Stream
          </a>
        </p>
      )}
    </div>
  );
}
