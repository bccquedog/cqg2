"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

type MatchFeedItem = {
  matchId: string;
  playerAName: string;
  playerBName: string;
  roundNumber: number;
  status: "live" | "pending" | "completed";
};

interface NowPlayingFeedProps {
  tournamentId: string;
  maxItems?: number;
}

export default function NowPlayingFeed({ tournamentId, maxItems = 5 }: NowPlayingFeedProps) {
  const [nowPlaying, setNowPlaying] = useState<MatchFeedItem[]>([]);
  const [nextUp, setNextUp] = useState<MatchFeedItem[]>([]);

  useEffect(() => {
    // Subscribe to live matches
    const matchesCol = collection(db, "tournaments", tournamentId, "matches");
    const liveQuery = query(
      matchesCol,
      where("status", "==", "live"),
      orderBy("roundNumber", "desc"),
      limit(maxItems)
    );

    const liveUnsub = onSnapshot(liveQuery, (snap) => {
      const items: MatchFeedItem[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        items.push({
          matchId: doc.id,
          playerAName: data.playerAName || "Player A",
          playerBName: data.playerBName || "Player B",
          roundNumber: data.roundNumber || 1,
          status: "live",
        });
      });
      setNowPlaying(items);
    });

    // Subscribe to pending matches
    const pendingQuery = query(
      matchesCol,
      where("status", "==", "pending"),
      orderBy("roundNumber", "asc"),
      limit(maxItems)
    );

    const pendingUnsub = onSnapshot(pendingQuery, (snap) => {
      const items: MatchFeedItem[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        items.push({
          matchId: doc.id,
          playerAName: data.playerAName || "Player A",
          playerBName: data.playerBName || "Player B",
          roundNumber: data.roundNumber || 1,
          status: "pending",
        });
      });
      setNextUp(items);
    });

    return () => {
      liveUnsub();
      pendingUnsub();
    };
  }, [tournamentId, maxItems]);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-amber-500/30 rounded-xl p-6 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-4">📺 Match Feed</h2>

      {/* Now Playing */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-sm font-bold text-green-400">NOW PLAYING</div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        
        {nowPlaying.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-4">
            No active matches
          </div>
        ) : (
          <div className="space-y-2">
            {nowPlaying.map((match) => (
              <div
                key={match.matchId}
                className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 hover:bg-green-900/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white font-medium">
                    {match.playerAName} <span className="text-gray-500">vs</span> {match.playerBName}
                  </div>
                  <div className="text-xs text-green-400">
                    R{match.roundNumber}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next Up */}
      <div>
        <div className="text-sm font-bold text-amber-400 mb-3">NEXT UP</div>
        
        {nextUp.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-4">
            No pending matches
          </div>
        ) : (
          <div className="space-y-2">
            {nextUp.map((match, index) => (
              <div
                key={match.matchId}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-300">
                    <span className="text-amber-400 font-bold mr-2">#{index + 1}</span>
                    {match.playerAName} <span className="text-gray-600">vs</span> {match.playerBName}
                  </div>
                  <div className="text-xs text-gray-500">
                    R{match.roundNumber}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



