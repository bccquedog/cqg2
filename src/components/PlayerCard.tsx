"use client";

import Image from "next/image";
import Link from "next/link";
import { formatLastActive } from "@/lib/timeUtils";

export default function PlayerCard({ player }: { player: any }) {
  return (
    <Link href={`/profile/${player.id}`}>
      <div className="flex items-center space-x-3 p-2 border rounded-lg bg-white shadow-sm hover:bg-gray-100 transition cursor-pointer">
        <Image
          src={player.avatarUrl || "/default-avatar.png"}
          alt={player.username}
          width={40}
          height={40}
          className="rounded-full"
        />
        <div className="flex flex-col">
          <p className="font-semibold flex items-center space-x-1">
            <span>{player.username}</span>
            {player.streamUrl && (
              <span className="text-xs text-indigo-600">🎥</span>
            )}
          </p>
          <p className="text-xs text-gray-500">
            {player.stats?.wins || 0}W – {player.stats?.losses || 0}L
          </p>
          {player.lastActive && (
            <p className="text-xs text-gray-400">
              Active {formatLastActive(player.lastActive)}
            </p>
          )}
        </div>
        <span
          className={`ml-auto w-3 h-3 rounded-full ${
            player.status === "online"
              ? "bg-green-500"
              : player.status === "in_match"
              ? "bg-yellow-500"
              : "bg-gray-400"
          }`}
        ></span>
      </div>
    </Link>
  );
}
