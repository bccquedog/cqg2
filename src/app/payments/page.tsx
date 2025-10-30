"use client";

import { useState } from "react";
import { getAuth } from "firebase/auth";

export default function PaymentsPage() {
  const [busy, setBusy] = useState<"buyin" | "sub" | null>(null);
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  const go = async (type: "buyin" | "sub") => {
    if (!uid) return alert("Sign in first.");
    setBusy(type);
    try {
      const res = await fetch("/api/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": uid },
        body: JSON.stringify({ type })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "stripe error");
      window.location.href = json.url;
    } catch (e: any) {
      alert(e.message || "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Payments (Test)</h1>
      <div className="p-4 border rounded shadow bg-white space-y-3">
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          disabled={busy !== null}
          onClick={() => go("buyin")}
        >
          {busy === "buyin" ? "Redirecting…" : "Pay Tournament Buy-In ($5)"}
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          disabled={busy !== null}
          onClick={() => go("sub")}
        >
          {busy === "sub" ? "Redirecting…" : "Subscribe (Test Plan $10/mo)"}
        </button>
        <p className="text-sm text-gray-500">Use Stripe test cards like 4242 4242 4242 4242 in test mode.</p>
      </div>
    </div>
  );
}




