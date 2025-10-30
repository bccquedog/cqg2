"use client";

import { useState } from "react";
import { checkInPlayer } from "@/lib/tournamentService";

export default function TournamentCheckIn({
  tournamentId,
  playerId
}: {
  tournamentId: string;
  playerId: string;
}) {
  const [status, setStatus] = useState<string | null>(null);

  const handleCheckIn = async () => {
    try {
      await checkInPlayer(tournamentId, playerId);
      setStatus("✅ Checked in!");
    } catch (err: any) {
      setStatus("❌ " + err.message);
    }
  };

  return (
    <div className="p-4 border rounded-xl shadow-md max-w-md">
      <h2 className="text-xl font-bold mb-2">Tournament Check-In</h2>
      <button
        onClick={handleCheckIn}
        className="px-4 py-2 bg-green-600 text-white rounded-xl"
      >
        Check In
      </button>
      {status && <p className="mt-2">{status}</p>}
    </div>
  );
}
