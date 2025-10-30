"use client";

import { useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, getDoc, addDoc, collection, setDoc, arrayUnion } from "firebase/firestore";
import { useToast } from "@/components/Toast";
import { getAuth } from "firebase/auth";
import { advanceWinner } from "@/lib/advanceWinner";

type Props = {
  tournamentId: string;
  match: any; // expects { id, playerA, playerB, scoreA?, scoreB?, winner? }
  tournament?: any; // tournament document for settings
};

export default function MatchResultForm({ tournamentId, match, tournament }: Props) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [scoreA, setScoreA] = useState<number | "">("");
  const [scoreB, setScoreB] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<string>("");
  const [streamLink, setStreamLink] = useState<string>("");
  const [submittedNow, setSubmittedNow] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const alreadySubmitted = useMemo(() => Boolean(match?.winner), [match]);
  const isParticipant = useMemo(() => {
    if (!user) return false;
    return user.uid === match?.playerA || user.uid === match?.playerB;
  }, [user, match]);

  const canSubmit = isParticipant || (user && (user as any).admin === true);
  const alreadySubmittedByUser = useMemo(() => {
    if (!user) return false;
    return match?.reportedBy === user.uid; // simple guard using last submitter
  }, [user, match]);

  const onSubmit = async () => {
    setMessage(null);
    setError(null);
    if (!user) {
      setError("You must be signed in to submit.");
      return;
    }
    if (!canSubmit) {
      setError("You are not allowed to submit this match.");
      return;
    }
    if (scoreA === "" || scoreB === "") {
      setError("Please enter a score for both players");
      return;
    }
    if (!winnerId) {
      setError("Please select a winner");
      return;
    }
    // Check if stream link is required by tournament settings
    const streamRequired = tournament?.settings?.streamRequired || false;
    if (streamRequired && !streamLink) {
      setError("Stream link is required for this tournament");
      return;
    }
    
    let urlOk = true;
    if (streamLink) {
      urlOk = /^https?:\/\/\S+/i.test(streamLink);
      if (!urlOk) {
        setError("Stream link must start with http(s)://");
        return;
      }
    }
    if (alreadySubmittedByUser) {
      setError("You have already submitted a result for this match");
      return;
    }
    try {
      setSubmitting(true);
      const sA = Number(scoreA);
      const sB = Number(scoreB);
      const winner = winnerId;
      const scores: Record<string, number> = {
        [match.playerA]: sA,
        [match.playerB]: sB,
      };
      if (!(winner in scores)) {
        setError("Winner must be one of the players");
        setSubmitting(false);
        return;
      }
      // basic consistency check
      if ((sA === sB) || (winner === match.playerA && sA <= sB) || (winner === match.playerB && sB <= sA)) {
        setError("Winner must match the higher score and scores cannot tie");
        setSubmitting(false);
        return;
      }

      const matchRef = doc(db, "tournaments", tournamentId, "matches", match.id);
      const snap = await getDoc(matchRef);
      if (snap.exists()) {
        const data = snap.data() as any;
        if (data.winner) {
          setError("Result already submitted.");
          setSubmitting(false);
          return;
        }
      }

      await updateDoc(matchRef, {
        scoreA: sA,
        scoreB: sB,
        winner,
        reportedBy: user.uid,
        submittedAt: serverTimestamp(),
        status: "completed",
        streamLink: streamLink || null,
        missingLink: !streamLink,
      });

      await advanceWinner(tournamentId, match.id, winner);

      // Timeline log
      await addDoc(collection(db, "tournaments", tournamentId, "timeline"), {
        action: "Match completed",
        actor: user.uid,
        matchId: match.id,
        timestamp: serverTimestamp()
      });

      // Update player profiles with match history entries
      const players = [match.playerA, match.playerB].filter(Boolean);
      await Promise.all(players.map(async (pid: string) => {
        const opponentIds = players.filter((x) => x !== pid);
        const playerScore = scores[pid] ?? 0;
        const result = pid === winner ? "win" : "loss";
        const playerRef = doc(db, "players", pid);
        await setDoc(playerRef, {
          matchHistory: arrayUnion({
            matchId: match.id,
            tournamentId,
            opponentIds,
            score: playerScore,
            result,
            streamLink,
            submittedAt: serverTimestamp(),
          })
        }, { merge: true });
      }));

      if (!streamLink) {
        setMessage(`✅ Result submitted: Winner is ${winner}. ⚠️ Consider adding a stream/VOD link.`);
      } else {
        setMessage(`✅ Result submitted: Winner is ${winner}`);
      }
      showToast("✅ Match Submitted", "success");
      setSubmittedNow(true);
    } catch (e: any) {
      const msg = e?.message || "Failed to submit result";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canSubmit) return null;

  return (
    <div className="mt-3 border-t pt-3 relative">
      {ToastContainer}
      {alreadySubmitted ? (
        <p className="text-sm text-green-700">✅ Result submitted: Winner is {match.winner}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="number"
            min={0}
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder={`Score ${match.playerA || "A"}`}
            className="border rounded px-2 py-1 text-sm w-40"
            disabled={submitting || submittedNow}
          />
          <span className="text-xs text-gray-500">vs</span>
          <input
            type="number"
            min={0}
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder={`Score ${match.playerB || "B"}`}
            className="border rounded px-2 py-1 text-sm w-40"
            disabled={submitting || submittedNow}
          />
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-1">
              <input type="radio" name={`winner-${match.id}`} value={match.playerA}
                checked={winnerId === match.playerA}
                onChange={() => setWinnerId(match.playerA)} disabled={submitting || submittedNow} />
              Winner: {match.playerA || 'A'}
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name={`winner-${match.id}`} value={match.playerB}
                checked={winnerId === match.playerB}
                onChange={() => setWinnerId(match.playerB)} disabled={submitting || submittedNow} />
              {match.playerB || 'B'}
            </label>
          </div>
          <input
            type="url"
            value={streamLink}
            onChange={(e) => setStreamLink(e.target.value)}
            placeholder={tournament?.settings?.streamRequired ? "Stream / Recording Link (Required)" : "Stream / Recording Link (Optional)"}
            className={`border rounded px-2 py-1 text-sm w-full ${tournament?.settings?.streamRequired ? 'border-red-300' : ''}`}
            disabled={submitting || submittedNow}
            required={tournament?.settings?.streamRequired}
          />
          <button
            onClick={onSubmit}
            disabled={submitting || submittedNow}
            className="text-xs px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submittedNow ? "Submitted" : submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}
      {message && <p className="text-sm text-green-700 mt-2">{message}</p>}
      {error && (
        <div className="mt-2 flex items-center gap-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={onSubmit}
            disabled={submitting || submittedNow}
            className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}


