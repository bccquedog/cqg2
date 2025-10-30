import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BracketPanel({ competitionId }: { competitionId: string }) {
  const [bracket, setBracket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = db
      .collection("tournaments")
      .doc(competitionId)
      .collection("bracket")
      .doc("bracketDoc")
      .onSnapshot((snap) => {
        if (snap.exists) {
          setBracket(snap.data());
          setLoading(false);
        }
      });
    return () => unsubscribe();
  }, [competitionId]);

  function runHealthCheck() {
    if (!bracket) return;
    let issues: string[] = [];

    bracket.rounds.forEach((round: any, rIdx: number) => {
      round.matches.forEach((m: any, mIdx: number) => {
        if (m.status === "completed" && !m.winner) {
          issues.push(`⚠️ Round ${rIdx + 1}, Match ${m.matchId}: Completed without winner`);
        }
        if (m.players.length !== 2) {
          issues.push(`⚠️ Round ${rIdx + 1}, Match ${m.matchId}: Invalid player count`);
        }
        if (m.status === "pending" && (m.scores?.[m.players[0]] || m.scores?.[m.players[1]])) {
          issues.push(`⚠️ Round ${rIdx + 1}, Match ${m.matchId}: Scores exist but status is pending`);
        }
      });
    });

    setHealth(issues.length ? issues : ["✅ No bracket issues detected"]);
  }

  async function forceAdvance(roundIdx: number, matchIdx: number, winnerId: string) {
    const updatedBracket = { ...bracket };
    const match = updatedBracket.rounds[roundIdx].matches[matchIdx];
    match.winner = winnerId;
    match.status = "completed";

    // Advance winner to next round if available
    const nextRoundIdx = roundIdx + 1;
    if (updatedBracket.rounds[nextRoundIdx]) {
      const openMatch = updatedBracket.rounds[nextRoundIdx].matches.find((m: any) => m.players.length < 2);
      if (openMatch) openMatch.players.push(winnerId);
    }

    await db
      .collection("tournaments")
      .doc(competitionId)
      .collection("bracket")
      .doc("bracketDoc")
      .set(updatedBracket);

    setBracket(updatedBracket);
  }

  if (loading) return <p>Loading bracket...</p>;
  if (!bracket) return <p>No bracket found</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">🏆 Bracket for {competitionId}</h2>
        <Button onClick={runHealthCheck} variant="secondary">Run Health Check</Button>
      </div>

      {health.length > 0 && (
        <Card className="p-4 bg-gray-100">
          <h3 className="font-bold mb-2">Bracket Health</h3>
          <ul className="list-disc pl-6 text-sm">
            {health.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex gap-6 overflow-x-auto">
        {bracket.rounds.map((round: any, rIdx: number) => (
          <div key={rIdx} className="space-y-4 min-w-[200px]">
            <h3 className="font-semibold">Round {rIdx + 1}</h3>
            {round.matches.map((m: any, mIdx: number) => (
              <Card key={m.matchId} className="p-4">
                <p className="font-bold">{m.matchId}</p>
                {m.players.map((p: string) => (
                  <p
                    key={p}
                    className={`mt-1 ${m.winner === p ? "text-green-600 font-bold" : ""}`}
                  >
                    {p} {m.scores?.[p] !== null ? `(${m.scores[p]})` : ""}
                  </p>
                ))}
                <p>Status: {m.status}</p>
                {m.winner && <p>Winner: {m.winner}</p>}
                <div className="flex gap-2 mt-2">
                  {m.players.map((p: string) => (
                    <Button
                      key={p}
                      onClick={() => forceAdvance(rIdx, mIdx, p)}
                      size="sm"
                      variant="outline"
                    >
                      Force Advance {p}
                    </Button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
