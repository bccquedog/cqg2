"use client";

import { useState } from "react";
import { validateMatchResult } from "@/lib/tournamentService";

export default function AdminMatchValidation({
  tournamentId,
  matchId,
  playerA,
  playerB
}: {
  tournamentId: string;
  matchId: string;
  playerA: string;
  playerB: string;
}) {
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [status, setStatus] = useState<string | null>(null);

  const handleValidate = async () => {
    const winner = scoreA > scoreB ? playerA : playerB;
    try {
      await validateMatchResult(tournamentId, matchId, winner, {
        [playerA]: scoreA,
        [playerB]: scoreB
      });
      setStatus("✅ Match validated!");
    } catch (err: any) {
      setStatus("❌ " + err.message);
    }
  };

  return (
    <div className="p-4 border rounded-xl shadow-md max-w-md bg-gray-50">
      <h2 className="text-lg font-bold mb-2">Admin Match Validation</h2>
      <div className="flex gap-2 mb-2">
        <input
          type="number"
          value={scoreA}
          onChange={(e) => setScoreA(parseInt(e.target.value))}
          className="border p-2 rounded-md"
          placeholder={`${playerA} score`}
        />
        <input
          type="number"
          value={scoreB}
          onChange={(e) => setScoreB(parseInt(e.target.value))}
          className="border p-2 rounded-md"
          placeholder={`${playerB} score`}
        />
      </div>
      <button
        onClick={handleValidate}
        className="px-4 py-2 bg-red-600 text-white rounded-xl"
      >
        Validate Match
      </button>
      {status && <p className="mt-2">{status}</p>}
    </div>
  );
}
