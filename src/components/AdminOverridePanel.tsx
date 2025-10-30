"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface AdminOverridePanelProps {
  tournamentId: string;
  matchId: string;
  playerA: any;
  playerB: any;
}

export default function AdminOverridePanel({
  tournamentId,
  matchId,
  playerA,
  playerB
}: AdminOverridePanelProps) {
  const [winner, setWinner] = useState<string | null>(null);
  const [score, setScore] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleOverride = async () => {
    if (!winner) return;
    setLoading(true);
    try {
      const matchRef = doc(db, "tournaments", tournamentId, "matches", matchId);
      await updateDoc(matchRef, {
        score: score || "0 - 0",
        winner,
        status: "completed",
        "reporting.verifiedByAdmin": true
      });
      setMessage("✅ Override applied successfully.");
    } catch (err) {
      console.error("Error overriding match:", err);
      setMessage("❌ Failed to override match.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const matchRef = doc(db, "tournaments", tournamentId, "matches", matchId);
      await updateDoc(matchRef, {
        score: "",
        winner: null,
        status: "pending",
        reporting: {}
      });
      setMessage("🔄 Match reset successfully.");
    } catch (err) {
      console.error("Error resetting match:", err);
      setMessage("❌ Failed to reset match.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-red-900 text-white p-4 rounded-lg mt-6 w-96 border border-red-500">
      <h3 className="font-bold text-lg mb-3">⚠️ Admin Override</h3>

      <div className="flex justify-between mb-2">
        <button
          onClick={() => setWinner(playerA?.id)}
          className={`px-3 py-1 rounded ${
            winner === playerA?.id ? "bg-green-600" : "bg-gray-700"
          }`}
        >
          {playerA?.username || "Player A"}
        </button>
        <button
          onClick={() => setWinner(playerB?.id)}
          className={`px-3 py-1 rounded ${
            winner === playerB?.id ? "bg-green-600" : "bg-gray-700"
          }`}
        >
          {playerB?.username || "Player B"}
        </button>
      </div>

      <input
        type="text"
        placeholder="Final Score (e.g. 2 - 1)"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        className="w-full text-black px-2 py-1 rounded mb-3"
      />

      <div className="flex space-x-2">
        <button
          onClick={handleOverride}
          disabled={loading || !winner}
          className="flex-1 bg-yellow-500 py-2 rounded hover:bg-yellow-600 disabled:bg-gray-600"
        >
          {loading ? "Saving..." : "Apply Override"}
        </button>
        <button
          onClick={handleReset}
          disabled={loading}
          className="flex-1 bg-gray-500 py-2 rounded hover:bg-gray-600 disabled:bg-gray-600"
        >
          Reset Match
        </button>
      </div>

      {message && <p className="mt-3 text-sm">{message}</p>}
    </div>
  );
}
