"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { advanceWinner } from "@/lib/advanceWinner";

interface MatchReportFormProps {
  tournamentId: string;
  matchId: string;
  playerA: any;
  playerB: any;
}

export default function MatchReportForm({
  tournamentId,
  matchId,
  playerA,
  playerB
}: MatchReportFormProps) {
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

    const winner = scoreA > scoreB ? playerA?.id : playerB?.id;

    try {
      const matchRef = doc(db, "tournaments", tournamentId, "matches", matchId);
      await updateDoc(matchRef, {
        score: `${scoreA} - ${scoreB}`,
        winner,
        status: "completed",
        locked: true,
        reporting: {
          submittedAt: serverTimestamp(),
          verifiedByAdmin: false
        }
      });

      // Advance winner to next round
      if (winner) {
        const winnerName = winner === playerA?.id ? playerA?.username : playerB?.username;
        await advanceWinner(tournamentId, matchId, { id: winner, name: winnerName });
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Error reporting match:", err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return <p className="text-green-500 font-semibold mt-4">✅ Match reported!</p>;
  }

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg mt-6 w-80">
      <h3 className="font-bold text-lg mb-3">Report Match Result</h3>

      <div className="flex justify-between mb-2">
        <label>{playerA?.username || "Player A"}</label>
        <input
          type="number"
          value={scoreA}
          onChange={(e) => setScoreA(Number(e.target.value))}
          className="w-16 text-black px-2 py-1 rounded"
        />
      </div>

      <div className="flex justify-between mb-4">
        <label>{playerB?.username || "Player B"}</label>
        <input
          type="number"
          value={scoreB}
          onChange={(e) => setScoreB(Number(e.target.value))}
          className="w-16 text-black px-2 py-1 rounded"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-indigo-600 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-600"
      >
        {loading ? "Submitting..." : "Submit Result"}
      </button>
    </div>
  );
}
