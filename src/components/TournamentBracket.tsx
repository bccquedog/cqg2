"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, getDocs, query, where, documentId } from "firebase/firestore";
import { getMatches } from "@/lib/tournamentService";
import { Crown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import PlayerProfileModal from "@/components/PlayerProfileModal";
import confetti from "canvas-confetti";

export default function TournamentBracket({
  tournamentId
}: {
  tournamentId: string;
}) {
  const [matches, setMatches] = useState<any[]>([]);
  const [grouped, setGrouped] = useState<{ [round: number]: any[] }>({});
  const [champion, setChampion] = useState<string | null>(null);
  const [finalRound, setFinalRound] = useState<number>(1);
  const [themeConfig, setThemeConfig] = useState<any>({
    theme: "default",
    effectsEnabled: true,
    brandingEnabled: false,
    locked: false,
    playerClickMode: "modal"
  });
  const [playerStreams, setPlayerStreams] = useState<Record<string, string>>({});

  // Modal state
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 🎨 Theme styles
  const themeStyles: Record<string, string> = {
    default: "bg-white border-yellow-500 text-yellow-700",
    halloween: "bg-gray-900 border-orange-600 text-orange-400",
    holiday: "bg-blue-50 border-blue-400 text-blue-700",
    summer: "bg-yellow-50 border-pink-400 text-pink-600",
    cod: "bg-green-900 border-green-600 text-green-200",
    fortnite: "bg-purple-100 border-purple-500 text-purple-700",
    gta: "bg-pink-900 border-pink-600 text-pink-200",
    sponsor: "bg-gray-100 border-gray-500 text-gray-700"
  };

  // Normalize click mode for readability
  const playerClickMode: "modal" | "navigation" | "external" = themeConfig.playerClickMode || "modal";

  const renderPlayerLabel = (player: any) => (
    <span className="inline-flex items-center gap-2">
      <Image
        src={player.avatarUrl || "/default-avatar.png"}
        alt={player.username || player.id}
        width={18}
        height={18}
        className="rounded-full"
      />
      <span className="truncate max-w-[150px]">{player.username || player.id}</span>
    </span>
  );

  // 🎯 Subscribe to themeConfig
  useEffect(() => {
    const configRef = doc(db, "tournaments", tournamentId);
    const unsub = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data().themeConfig || {};
        setThemeConfig({
          theme: data.theme || "default",
          effectsEnabled: data.effectsEnabled ?? true,
          brandingEnabled: data.brandingEnabled ?? false,
          locked: data.locked ?? false,
          playerClickMode: data.playerClickMode || "modal"
        });
      }
    });
    return () => unsub();
  }, [tournamentId]);

  // 🏆 Subscribe to matches
  useEffect(() => {
    const fetchMatches = async () => {
      const data = await getMatches(tournamentId);
      setMatches(data);

      // Group by round
      const byRound: { [round: number]: any[] } = {};
      data.forEach((m: any) => {
        const r = m.round || 1;
        if (!byRound[r]) byRound[r] = [];
        byRound[r].push(m);
      });
      setGrouped(byRound);

      // Find champion
      const maxRound = Math.max(...data.map((m: any) => m.round || 1));
      setFinalRound(maxRound);
      const finalMatch = data.find((m: any) => m.round === maxRound && m.winner);

      if (finalMatch && finalMatch.winner !== champion) {
        setChampion(finalMatch.winner);
        if (themeConfig.effectsEnabled) runConfetti();
      }
    };
    fetchMatches();
  }, [tournamentId, themeConfig.effectsEnabled]);

  // Load player stream URLs for all players present in matches
  useEffect(() => {
    const loadStreams = async () => {
      const playerIds = new Set<string>();
      matches.forEach((m: any) => {
        if (m.playerA) playerIds.add(m.playerA);
        if (m.playerB) playerIds.add(m.playerB);
      });
      const ids = Array.from(playerIds);
      if (ids.length === 0) return;

      const playersRef = collection(db, "players");
      const chunkSize = 10;
      const streamMap: Record<string, string> = {};
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const q = query(playersRef, where(documentId(), "in", chunk));
        const snap = await getDocs(q);
        snap.forEach((d) => {
          const data = d.data() as any;
          if (data.streamUrl) streamMap[d.id] = data.streamUrl as string;
        });
      }
      setPlayerStreams(streamMap);
    };
    loadStreams();
  }, [matches]);

  // 🎆 Confetti
  const runConfetti = () => {
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const roundNames: { [key: number]: string } = {
    1: "Round 1",
    2: "Round 2",
    3: "Quarterfinals",
    4: "Semifinals",
    5: "Finals"
  };

  return (
    <div className="p-4 border rounded-xl shadow-md bg-white overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">Tournament Bracket</h2>

      {/* Player Profile Modal */}
      <PlayerProfileModal
        playerId={selectedPlayer}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {Object.keys(grouped).length === 0 ? (
        <p className="text-gray-500">No matches yet.</p>
      ) : (
        <div className="flex space-x-16 relative">
          {Object.keys(grouped)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((roundKey, roundIndex, allRounds) => {
              const round = parseInt(roundKey);
              const matchesInRound = grouped[round];
              const nextRoundKey = allRounds[roundIndex + 1];
              const nextMatches = nextRoundKey ? grouped[parseInt(nextRoundKey)] : [];

              return (
                <div key={round} className="flex flex-col items-center min-w-[220px] relative">
                  <h3 className="text-lg font-semibold mb-4">
                    {roundNames[round] || `Round ${round}`}
                  </h3>
                  <div className="flex flex-col space-y-16">
                    {matchesInRound.map((m: any, i: number) => {
                      const isChampionPath = champion && m.winner === champion;
                      const isFinalMatch = round === finalRound && m.winner === champion;
                      const isEven = i % 2 === 0;

                      return (
                        <div key={m.id} className="relative flex items-center">
                          <div
                            className={`p-3 border rounded-lg w-56 shadow-sm ${
                              isChampionPath
                                ? "bg-yellow-100 border-yellow-500"
                                : themeStyles[themeConfig.theme] || "bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col space-y-1">
                                {/* Player A */}
                                {m.playerAData ? (
                                  playerClickMode === "modal" ? (
                                    <button
                                      onClick={() => {
                                        setSelectedPlayer(m.playerAData.id);
                                        setModalOpen(true);
                                      }}
                                      className="text-left hover:underline"
                                    >
                                      {renderPlayerLabel(m.playerAData)}
                                    </button>
                                  ) : playerClickMode === "navigation" ? (
                                    <Link href={`/profile/${m.playerAData.id}`} className="text-blue-600 hover:underline">
                                      {renderPlayerLabel(m.playerAData)}
                                    </Link>
                                  ) : (
                                    <a
                                      href={m.playerAData.streamUrl || `/profile/${m.playerAData.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline text-indigo-600"
                                    >
                                      {renderPlayerLabel(m.playerAData)}
                                    </a>
                                  )
                                ) : (
                                  m.playerA ? <span>{m.playerA}</span> : <span>TBD</span>
                                )}

                                {/* Player B */}
                                {m.playerBData ? (
                                  playerClickMode === "modal" ? (
                                    <button
                                      onClick={() => {
                                        setSelectedPlayer(m.playerBData.id);
                                        setModalOpen(true);
                                      }}
                                      className="text-left hover:underline"
                                    >
                                      {renderPlayerLabel(m.playerBData)}
                                    </button>
                                  ) : playerClickMode === "navigation" ? (
                                    <Link href={`/profile/${m.playerBData.id}`} className="text-blue-600 hover:underline">
                                      {renderPlayerLabel(m.playerBData)}
                                    </Link>
                                  ) : (
                                    <a
                                      href={m.playerBData.streamUrl || `/profile/${m.playerBData.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline text-indigo-600"
                                    >
                                      {renderPlayerLabel(m.playerBData)}
                                    </a>
                                  )
                                ) : (
                                  m.playerB ? <span>{m.playerB}</span> : <span>TBD</span>
                                )}
                              </div>
                              {isFinalMatch && (
                                <Crown className="w-5 h-5 text-yellow-600 ml-2" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600">Status: {m.status}</p>
                            {m.winner && (
                              <p
                                className={`font-bold text-xs ${
                                  isChampionPath ? "text-yellow-600" : "text-green-600"
                                }`}
                              >
                                Winner: {m.winner}
                              </p>
                            )}
                          </div>

                          {/* Connector lines */}
                          {nextMatches.length > 0 && (
                            <>
                              <div
                                className={`absolute right-[-40px] top-1/2 w-10 h-0.5 ${
                                  isChampionPath
                                    ? "bg-yellow-500"
                                    : themeConfig.theme === "default"
                                    ? "bg-black"
                                    : "bg-current"
                                }`}
                              ></div>
                              {isEven && (
                                <div className="absolute right-[-40px] top-1/2 w-10">
                                  <div
                                    className={`absolute left-10 top-1/2 h-[160px] w-0.5 ${
                                      isChampionPath
                                        ? "bg-yellow-500"
                                        : themeConfig.theme === "default"
                                        ? "bg-black"
                                        : "bg-current"
                                    }`}
                                  ></div>
                                </div>
                              )}
                              {!isEven && (
                                <div className="absolute right-[-40px] top-1/2 w-10">
                                  <div
                                    className={`absolute left-10 -top-[80px] h-[160px] w-0.5 ${
                                      isChampionPath
                                        ? "bg-yellow-500"
                                        : themeConfig.theme === "default"
                                        ? "bg-black"
                                        : "bg-current"
                                    }`}
                                  ></div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
