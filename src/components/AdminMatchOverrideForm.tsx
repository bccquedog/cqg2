"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { advanceWinner } from "@/lib/advanceWinner";

type Props = {
  tournamentId: string;
  match: any;
};

export default function AdminMatchOverrideForm({ tournamentId, match }: Props) {
  const auth = getAuth();
  const user = auth.currentUser;
  const isAdmin = Boolean((user as any)?.admin === true);
  const [scoreA, setScoreA] = useState<number | "">(match.scoreA ?? "");
  const [scoreB, setScoreB] = useState<number | "">(match.scoreB ?? "");
  const [winnerId, setWinnerId] = useState<string>(match.winner ?? "");
  const [reason, setReason] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!isAdmin) return null;

  const doOverride = async () => {
    setMsg(null); setErr(null);
    if (scoreA === "" || scoreB === "") { setErr("Enter scores for both players"); return; }
    if (!winnerId) { setErr("Select a winner"); return; }
    if (!reason) { setErr("Provide a reason for audit"); return; }
    try {
      setBusy(true);
      const sA = Number(scoreA), sB = Number(scoreB);
      const matchRef = doc(db, "tournaments", tournamentId, "matches", match.id);
      await updateDoc(matchRef, {
        scoreA: sA,
        scoreB: sB,
        winner: winnerId,
        status: "completed",
        submittedAt: serverTimestamp(),
        reportedBy: user?.uid || "admin",
        override: {
          adminId: user?.uid || "admin",
          reason,
          timestamp: serverTimestamp()
        }
      });
      await advanceWinner(tournamentId, match.id, winnerId);
      await addDoc(collection(db, "tournaments", tournamentId, "timeline"), {
        action: `Admin override on match ${match.id}`,
        actor: user?.uid || "admin",
        reason,
        timestamp: serverTimestamp()
      });
      setMsg("✅ Override applied and bracket advanced");
    } catch (e: any) {
      setErr(e?.message || "Failed to apply override");
    } finally {
      setBusy(false);
    }
  };

  const forceAdvance = async () => {
    setMsg(null); setErr(null);
    if (!winnerId) { setErr("Select a winner to force advance"); return; }
    try {
      setBusy(true);
      const matchRef = doc(db, "tournaments", tournamentId, "matches", match.id);
      await updateDoc(matchRef, {
        winner: winnerId,
        status: "completed",
        submittedAt: serverTimestamp(),
        override: {
          adminId: user?.uid || "admin",
          reason: reason || "Force advance",
          timestamp: serverTimestamp()
        }
      });
      await advanceWinner(tournamentId, match.id, winnerId);
      await addDoc(collection(db, "tournaments", tournamentId, "timeline"), {
        action: `Force advance on match ${match.id}`,
        actor: user?.uid || "admin",
        reason: reason || "Force advance",
        timestamp: serverTimestamp()
      });
      setMsg("⚡ Force advance executed");
    } catch (e: any) {
      setErr(e?.message || "Failed to force advance");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 border rounded p-3 bg-gray-50">
      <div className="text-sm font-semibold mb-2">Admin Override</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 text-sm">
        <input type="number" min={0} value={scoreA} onChange={(e)=>setScoreA(e.target.value===''?'':Number(e.target.value))} placeholder={`Score ${match.playerA || 'A'}`} className="border rounded px-2 py-1" disabled={busy} />
        <input type="number" min={0} value={scoreB} onChange={(e)=>setScoreB(e.target.value===''?'':Number(e.target.value))} placeholder={`Score ${match.playerB || 'B'}`} className="border rounded px-2 py-1" disabled={busy} />
        <div className="col-span-1 sm:col-span-2 flex items-center gap-4">
          <label className="flex items-center gap-1"><input type="radio" name={`admin-winner-${match.id}`} value={match.playerA} checked={winnerId===match.playerA} onChange={()=>setWinnerId(match.playerA)} disabled={busy} /> {match.playerA}</label>
          <label className="flex items-center gap-1"><input type="radio" name={`admin-winner-${match.id}`} value={match.playerB} checked={winnerId===match.playerB} onChange={()=>setWinnerId(match.playerB)} disabled={busy} /> {match.playerB}</label>
        </div>
        <input type="text" value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Reason for override" className="border rounded px-2 py-1 col-span-1 sm:col-span-2" disabled={busy} />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={doOverride} disabled={busy} className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Apply Override</button>
        <button onClick={forceAdvance} disabled={busy} className="text-xs px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50">⚡ Force Advance</button>
      </div>
      {msg && <p className="text-xs text-green-700 mt-2">{msg}</p>}
      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
    </div>
  );
}




