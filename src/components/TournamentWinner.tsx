"use client";

import { useEffect, useState } from "react";
import { getTournamentWinner } from "@/lib/tournamentService";

export default function TournamentWinner({
  tournamentId
}: {
  tournamentId: string;
}) {
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    const fetchWinner = async () => {
      const w = await getTournamentWinner(tournamentId);
      setWinner(w);
    };
    fetchWinner();
  }, [tournamentId]);

  if (!winner) return null;

  return (
    <div className="p-6 border rounded-xl shadow-md bg-yellow-100 text-center mt-6">
      <h2 className="text-2xl font-bold mb-2">🏆 Champion!</h2>
      <p className="text-xl">{winner}</p>
    </div>
  );
}
