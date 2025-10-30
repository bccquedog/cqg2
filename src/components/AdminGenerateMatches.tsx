"use client";

import { useState } from "react";
import { generateMatches } from "@/lib/tournamentService";

export default function AdminGenerateMatches({
  tournamentId
}: {
  tournamentId: string;
}) {
  const [status, setStatus] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      await generateMatches(tournamentId);
      setStatus("✅ Matches generated!");
    } catch (err: any) {
      setStatus("❌ " + err.message);
    }
  };

  return (
    <div className="p-4 border rounded-xl shadow-md max-w-md bg-gray-50">
      <h2 className="text-lg font-bold mb-2">Admin Tools</h2>
      <button
        onClick={handleGenerate}
        className="px-4 py-2 bg-purple-600 text-white rounded-xl"
      >
        Generate Matches
      </button>
      {status && <p className="mt-2">{status}</p>}
    </div>
  );
}
