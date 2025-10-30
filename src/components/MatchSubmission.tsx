"use client";

import { useState } from "react";
import { submitMatchResult } from "@/lib/tournamentService";

export default function MatchSubmission({
  tournamentId,
  matchId,
  playerId
}: {
  tournamentId: string;
  matchId: string;
  playerId: string;
}) {
  const [score, setScore] = useState<number>(0);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      await submitMatchResult(tournamentId, matchId, playerId, score);
      setStatus("✅ Score submitted!");
    } catch (err: any) {
      setStatus("❌ " + err.message);
    }
  };

  return (
    <div className="p-4 border rounded-xl shadow-md max-w-md">
      <h2 className="text-lg font-bold mb-2">Submit Match Result</h2>
      <input
        type="number"
        value={score}
        onChange={(e) => setScore(parseInt(e.target.value))}
        className="border p-2 rounded-md mr-2"
        placeholder="Your score"
      />
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-600 text-white rounded-xl"
      >
        Submit
      </button>
      {status && <p className="mt-2">{status}</p>}
    </div>
  );
}
