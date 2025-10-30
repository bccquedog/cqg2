"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, getDoc, setDoc } from "firebase/firestore";

export default function RedeemInvite() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redeem = async () => {
    setMessage(null);
    setError(null);
    if (!code.trim()) {
      setError("Please enter an invite code.");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to redeem an invite.");
      return;
    }
    try {
      setBusy(true);
      const invitesRef = collection(db, "invites");
      const q = query(invitesRef, where("code", "==", code.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError("Invalid invite code.");
        return;
      }
      const inviteDoc = snap.docs[0];
      const invite = inviteDoc.data() as any;
      if (invite.status && invite.status !== "unused") {
        setError("This invite has already been used.");
        return;
      }
      await updateDoc(doc(db, "invites", inviteDoc.id), {
        status: "used",
        usedBy: user.uid,
        usedAt: serverTimestamp()
      });

      // Upsert player profile with golden ticket access
      const playerRef = doc(db, "players", user.uid);
      const playerSnap = await getDoc(playerRef);
      const baseFields = {
        hasGoldenTicket: true,
        goldenTicketCode: code.trim(),
        goldenTicketRedeemedAt: serverTimestamp(),
      } as any;

      if (playerSnap.exists()) {
        await updateDoc(playerRef, baseFields);
      } else {
        await setDoc(playerRef, {
          uid: user.uid,
          displayName: user.displayName || "New Player",
          createdAt: serverTimestamp(),
          ...baseFields,
        });
      }

      setMessage("Invite redeemed successfully! Golden Ticket access unlocked 🎉");
      setCode("");
    } catch (e: any) {
      setError(e?.message || "Failed to redeem invite.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto border rounded-xl p-5 bg-white shadow-md text-center">
      <h3 className="text-lg font-semibold mb-4">Redeem Golden Ticket</h3>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter invite code (e.g., CQG-GOLD-TEST)"
          className="flex-1 border rounded-full px-4 py-2 text-sm"
          disabled={busy}
        />
        <button
          onClick={redeem}
          disabled={busy}
          className="px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin"></span>
              Checking...
            </span>
          ) : (
            "Redeem"
          )}
        </button>
      </div>
      {message && (
        <p className="mt-3 text-sm text-green-700 inline-flex items-center justify-center gap-2">
          <span className="inline-block w-4 h-4 rounded-full bg-green-600 text-white leading-none flex items-center justify-center">✓</span>
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-600 inline-flex items-center justify-center gap-2">
          <span className="inline-block w-4 h-4 rounded-full bg-red-600 text-white leading-none flex items-center justify-center">!</span>
          {error}
        </p>
      )}
    </div>
  );
}


