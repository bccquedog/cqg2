"use client";

import { useState } from "react";
import { registerPlayer } from "@/lib/tournamentService";

export default function TournamentRegistration({
  tournamentId,
  playerId
}: {
  tournamentId: string;
  playerId: string;
}) {
  const [status, setStatus] = useState<string | null>(null);

  const handleRegister = async () => {
    try {
      await registerPlayer(tournamentId, playerId);
      setStatus("✅ Registered successfully!");
    } catch (err: any) {
      setStatus("❌ " + err.message);
    }
  };

  return (
    <div className="p-4 border rounded-xl shadow-md max-w-md">
      <h2 className="text-xl font-bold mb-2">Join Tournament</h2>
      <button
        onClick={handleRegister}
        className="px-4 py-2 bg-indigo-600 text-white rounded-xl"
      >
        Register
      </button>
      {status && <p className="mt-2">{status}</p>}
    </div>
  );
}
