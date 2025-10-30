"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

type Props = {
  tournamentId: string;
  matchId: string;
};

export default function MatchOverlay({ tournamentId, matchId }: Props) {
  const [match, setMatch] = useState<any | null>(null);
  const [glow, setGlow] = useState(false);

  useEffect(() => {
    if (!tournamentId || !matchId) return;
    const ref = doc(db, "tournaments", tournamentId, "matches", matchId);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = { id: snap.id, ...snap.data() } as any;
      // trigger a short glow when match turns live
      if ((match?.status || "").toLowerCase() !== "live" && (data.status || "").toLowerCase() === "live") {
        setGlow(true);
        const t = setTimeout(() => setGlow(false), 3000);
        return () => clearTimeout(t);
      }
      setMatch(data);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, matchId]);

  if (!match) return null;

  const playerA = match.playerA || "Player A";
  const playerB = match.playerB || "Player B";
  const roundName =
    match.roundNumber === 1 || match.round === 1
      ? "Round 1"
      : match.roundNumber === 2 || match.round === 2
      ? "Quarterfinals"
      : match.roundNumber === 3 || match.round === 3
      ? "Semifinals"
      : "Finals";

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50">
      <div
        className={`px-4 py-3 bg-black/70 text-white rounded-xl shadow-lg backdrop-blur-sm border ${
          glow ? "glow-soft" : "border-gray-700"
        }`}
      >
        <div className="text-center text-xs uppercase tracking-wider mb-2 text-gray-300">{roundName}</div>
        <div className="flex items-center gap-6">
          <PlayerChip username={playerA} align="right" />
          <div className="text-lg font-bold">VS</div>
          <PlayerChip username={playerB} align="left" />
        </div>
      </div>
    </div>
  );
}

function PlayerChip({ username, align }: { username: string; align: "left" | "right" }) {
  return (
    <div className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`}
        alt={username}
        className="w-10 h-10 rounded-full border border-white/30 shadow"
      />
      <div className="font-semibold max-w-[180px] truncate">{username}</div>
    </div>
  );
}




