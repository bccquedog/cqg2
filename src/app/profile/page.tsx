"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ProfilePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!uid) { setLoading(false); return; }
      const snap = await getDoc(doc(db, "players", uid));
      setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    };
    load();
  }, [uid]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      {!uid && (
        <div className="p-4 border rounded bg-yellow-50">Sign in to create your profile.</div>
      )}
      {uid && profile ? (
        <ProfileCard profile={profile} />
      ) : uid ? (
        <CreateProfileForm uid={uid} onCreated={(p) => setProfile(p)} />
      ) : null}
    </div>
  );
}

function ProfileCard({ profile }: { profile: any }) {
  return (
    <div className="p-4 border rounded shadow bg-white flex items-center gap-4">
      <img src={profile.avatarUrl} alt={profile.username} className="w-16 h-16 rounded-full border" />
      <div>
        <div className="text-lg font-semibold">{profile.username}</div>
        <div className="text-sm text-gray-600">Tier: <span className="inline-block px-2 py-0.5 rounded bg-gray-200">{profile.tier || "unranked"}</span></div>
      </div>
    </div>
  );
}

function CreateProfileForm({ uid, onCreated }: { uid: string; onCreated: (p: any) => void }) {
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [tier, setTier] = useState("unranked");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!username) return;
    setBusy(true);
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": uid },
        body: JSON.stringify({ username, avatarUrl, tier })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "create failed");
      onCreated({ id: uid, username, avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uid)}`, tier });
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow bg-white">
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Username</label>
        <input className="w-full border rounded p-2" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Avatar URL (optional)</label>
        <input className="w-full border rounded p-2" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Tier</label>
        <select className="w-full border rounded p-2" value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="unranked">Unranked</option>
          <option value="gamer">Gamer</option>
          <option value="premium">Premium</option>
          <option value="elite">Elite</option>
        </select>
      </div>
      <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50" disabled={busy || !username} onClick={submit}>
        {busy ? "Creating…" : "Create Profile"}
      </button>
    </div>
  );
}




