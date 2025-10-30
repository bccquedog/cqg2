"use client";

import { useState, useEffect } from "react";
import { 
  FaChartBar, 
  FaTicketAlt, 
  FaTrophy, 
  FaShieldAlt, 
  FaGamepad, 
  FaCheck, 
  FaTimes 
} from "react-icons/fa";
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot, addDoc, deleteDoc, query, orderBy, limit } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "@/lib/firebase";
import { logAdminAction } from "@/lib/logAdminAction";

const navItems = [
  { id: "overview", label: "Overview", icon: <FaChartBar className="inline mr-2" />, roles: ["super"] },
  { id: "memberships", label: "Memberships", icon: <FaTicketAlt className="inline mr-2" />, roles: ["super"] },
  { id: "competitions", label: "Competitions", icon: <FaTrophy className="inline mr-2" />, roles: ["super", "mod"] },
  { id: "clips", label: "🎥 Clips", roles: ["super", "mod"] },
  { id: "security", label: "Security", icon: <FaShieldAlt className="inline mr-2" />, roles: ["super"] },
  { id: "auditLogs", label: "📜 Audit Logs", roles: ["super", "mod"] },
  { id: "compManager", label: "Competitions Manager", icon: <FaGamepad className="inline mr-2" />, roles: ["super"] },
];

export default function AdminDashboard() {
  const [section, setSection] = useState("overview");
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"super" | "mod" | "viewer" | null>(null);
  const [editing, setEditing] = useState<any | null>(null);

  const hasAccess = (sectionId: string) => {
    const item = navItems.find(item => item.id === sectionId);
    return item ? item.roles.includes(role || "viewer") : false;
  };

  const fetchCompetitions = async (mode: "tournaments" | "leagues") => {
    try {
      const snap = await getDocs(collection(db, mode));
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setData((prev: any) => ({
        ...prev,
        mode,
        list: data.showArchived ? list : list.filter((c) => !c.archived),
      }));
    } catch (error) {
      console.error("Error fetching competitions:", error);
      setData((prev: any) => ({ ...prev, mode, list: [] }));
    }
  };

  const exportCompetition = async (competition: any, auto = false) => {
    try {
      const format = auto ? "json" : prompt("Export format? Type 'csv' or 'json'", "json");

      const exportData: any = {
        ...competition,
        id: competition.id,
        exportedAt: new Date().toISOString(),
      };

      // subcollections
      const subcollections = ["matches", "players", "teams", "standings"];
      for (const sub of subcollections) {
        try {
          const snap = await getDocs(
            collection(
              db,
              data.mode === "tournaments" ? "tournaments" : "leagues",
              competition.id,
              sub
            )
          );
          if (!snap.empty) {
            exportData[sub] = snap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
          }
        } catch (err) {
          console.log(`No ${sub} for ${competition.name}`);
        }
      }

      let fileData: string;
      let mime: string;
      let filename = `${competition.name.replace(/\s+/g, "_")}.${format}`;

      if (format === "csv") {
        const matches = exportData.matches || [];
        const headers = Object.keys(matches[0] || {}).join(",");
        const rows = matches.map((m: any) =>
          Object.values(m).map((v) => JSON.stringify(v)).join(",")
        );
        fileData = [headers, ...rows].join("\n");
        mime = "text/csv";
      } else {
        fileData = JSON.stringify(exportData, null, 2);
        mime = "application/json";
      }

      // Trigger download
      const blob = new Blob([fileData], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log admin action
      await logAdminAction("admin123", role || "viewer", `Exported ${data.mode === "tournaments" ? "Tournament" : "League"}`, {
        name: competition.name,
        game: competition.game,
        id: competition.id,
        format: format,
        autoExport: auto
      });

      if (!auto) {
        alert(`📦 ${competition.name} exported as ${filename}`);
      } else {
        console.log(`📦 Auto-exported ${competition.name} before delete → ${filename}`);
      }
    } catch (error) {
      console.error("Error exporting competition:", error);
      alert(`Failed to export ${competition.name}`);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, "admins", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setRole(snap.data().role);
        } else {
          setRole("viewer"); // default fallback
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    if (section === "overview") {
      const ref = doc(db, "admin", "control");
      unsub = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setData(snap.data());
        } else {
          setData({ error: "No data found" });
        }
      });
    }

    if (section === "memberships") {
      const ref = doc(db, "admin/control/memberships", "settings");
      unsub = onSnapshot(ref, (snap) => setData(snap.exists() ? snap.data() : {}));
    }

    if (section === "competitions") {
      const ref = doc(db, "admin/control/competitions", "settings");
      unsub = onSnapshot(ref, (snap) => setData(snap.exists() ? snap.data() : {}));
    }

    if (section === "clips") {
      const ref = doc(db, "admin/control/clips", "settings");
      unsub = onSnapshot(ref, (snap) => setData(snap.exists() ? snap.data() : {}));
    }

    if (section === "security") {
      const ref = doc(db, "admin/control/security", "settings");
      unsub = onSnapshot(ref, (snap) => setData(snap.exists() ? snap.data() : {}));
    }

    if (section === "compManager") {
      // Data fetching is handled by the separate useEffect
      // No real-time listeners needed for this section
    }

    if (section === "auditLogs") {
      // keep existing query logic, we'll add live logs later
    }

    return () => {
      if (unsub) unsub();
    };
  }, [section]);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    if (section === "auditLogs") {
      const q = query(
        collection(db, "auditLogs"),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      unsub = onSnapshot(q, (snap) => {
        let logs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // apply filters client-side
        if (data.filterAdminId) {
          logs = logs.filter((log: any) =>
            log.adminId?.toLowerCase().includes(data.filterAdminId.toLowerCase())
          );
        }
        if (data.filterAction) {
          logs = logs.filter((log: any) =>
            log.action?.toLowerCase().includes(data.filterAction.toLowerCase())
          );
        }

        setData((prev: any) => ({ ...prev, logs }));
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, [section, data.filterAdminId, data.filterAction]);

  // Initialize competitions list when compManager section is accessed
  useEffect(() => {
    if (section === "compManager") {
      fetchCompetitions("tournaments"); // default load
    }
  }, [section]);

  // Refetch competitions when showArchived toggle changes
  useEffect(() => {
    if (section === "compManager" && data.mode) {
      fetchCompetitions(data.mode as "tournaments" | "leagues");
    }
  }, [data.showArchived]);


  async function saveMemberships() {
    try {
      setLoading(true);
      const ref = doc(db, "admin/control/memberships", "settings");
      await setDoc(ref, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      
      // Log admin action
      await logAdminAction("admin123", role || "viewer", "Updated Membership Settings", data);
      
      alert("Membership settings saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save memberships");
    } finally {
      setLoading(false);
    }
  }

  async function saveCompetitions() {
    try {
      setLoading(true);
      const ref = doc(db, "admin/control/competitions", "settings");
      await setDoc(ref, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      
      // Log admin action
      await logAdminAction("admin123", role || "viewer", "Updated Competition Settings", data);
      
      alert("Competition settings saved!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save competitions");
    } finally {
      setLoading(false);
    }
  }

  async function saveClips() {
    try {
      setLoading(true);
      const ref = doc(db, "admin/control/clips", "settings");
      await setDoc(ref, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      
      // Log admin action
      await logAdminAction("admin123", role || "viewer", "Updated Clip Settings", data);
      
      alert("✅ Clip settings saved!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save clips");
    } finally {
      setLoading(false);
    }
  }

  async function saveOverview() {
    try {
      setLoading(true);
      const ref = doc(db, "admin", "control");
      await setDoc(ref, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      
      // Log admin action
      await logAdminAction("admin123", role || "viewer", "Updated Overview Settings", data);
      
      alert("✅ Overview settings saved!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save overview settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🚀 CQG Bugatti Admin Panel</h1>
          <div className="text-right">
            <div className="text-sm opacity-70 flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Live Sync</span>
            </div>
            <div className="text-sm opacity-70">System: {data?.systemStatus || "Loading..."}</div>
            <div className="text-xs opacity-50">Role: {role || "Loading..."}</div>
          </div>
        </header>

      {/* Navigation */}
      <nav className="flex space-x-4 border-b border-gray-800 pb-2">
        {navItems
          .filter((item) => item.roles.includes(role || "viewer"))
          .map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`px-4 py-2 rounded-lg ${
                section === item.id
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {item.label}
            </button>
          ))}
      </nav>

      {/* Content */}
      <main className="mt-8 space-y-6">
        {/* Overview Section */}
        {section === "overview" && hasAccess("overview") && (
          <div>
            <h2 className="text-xl font-semibold mb-4">System Overview</h2>

            <div className="space-y-4 bg-gray-900 p-4 rounded-lg">
              {/* System Status */}
              <div>
                <label className="block mb-1">System Status</label>
                <select
                  value={data.systemStatus || "online"}
                  onChange={(e) =>
                    setData({ ...data, systemStatus: e.target.value })
                  }
                  className="bg-gray-800 px-3 py-2 rounded w-full"
                >
                  <option value="online">Online</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              {/* Feature Toggles */}
              <div>
                <label className="block mb-2">Feature Toggles</label>
                <div className="space-y-2">
                  {["tournaments", "leagues", "clips", "memberships"].map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!!data.features?.[feature]}
                        onChange={(e) =>
                          setData({
                            ...data,
                            features: {
                              ...data.features,
                              [feature]: e.target.checked,
                            },
                          })
                        }
                      />
                      <label className="capitalize">{feature}</label>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={saveOverview}
                disabled={loading}
                className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg"
              >
                {loading ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        )}

        {/* Memberships Section */}
        {section === "memberships" && hasAccess("memberships") && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Membership Management</h2>

            <div className="space-y-4 bg-gray-900 p-4 rounded-lg">
              {/* Default Tier */}
              <div>
                <label className="block mb-1">Default Tier</label>
                <select
                  value={data.defaultTier || "Gamer"}
                  onChange={(e) => setData({ ...data, defaultTier: e.target.value })}
                  className="bg-gray-800 px-3 py-2 rounded w-full"
                >
                  <option value="Gamer">Gamer</option>
                  <option value="Mamba">Mamba</option>
                  <option value="King">King</option>
                  <option value="Elite">Elite</option>
                </select>
              </div>

              {/* Free Trials Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!data.allowFreeTrials}
                  onChange={(e) => setData({ ...data, allowFreeTrials: e.target.checked })}
                />
                <label>Allow Free Trials</label>
              </div>

              {/* Adjustable Pricing Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!data.adjustablePricing}
                  onChange={(e) => setData({ ...data, adjustablePricing: e.target.checked })}
                />
                <label>Allow Adjustable Pricing</label>
              </div>

              <button
                onClick={saveMemberships}
                disabled={loading}
                className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg"
              >
                {loading ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        )}

        {/* Competitions Section */}
        {section === "competitions" && hasAccess("competitions") && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Competition Controls</h2>

            <div className="space-y-4 bg-gray-900 p-4 rounded-lg">
              {/* Buy-ins */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!data.buyInsEnabled}
                  onChange={(e) => setData({ ...data, buyInsEnabled: e.target.checked })}
                />
                <label>Enable Buy-Ins</label>
              </div>

              {/* Stripe Integration */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!data.enableStripe}
                  onChange={(e) => setData({ ...data, enableStripe: e.target.checked })}
                />
                <label>Enable Stripe Payments</label>
              </div>

              {/* Score Disputes */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!data.scoreDisputesEnabled}
                  onChange={(e) =>
                    setData({ ...data, scoreDisputesEnabled: e.target.checked })
                  }
                />
                <label>Enable Score Disputes</label>
              </div>

              {/* Player-Run Events */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!data.allowPlayerRunEvents}
                  onChange={(e) =>
                    setData({ ...data, allowPlayerRunEvents: e.target.checked })
                  }
                />
                <label>Allow Player-Run Events</label>
              </div>

              <button
                onClick={saveCompetitions}
                disabled={loading}
                className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg"
              >
                {loading ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        )}

        {/* Clips Section */}
        {section === "clips" && hasAccess("clips") && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Clips & Highlights</h2>

            <div className="space-y-4 bg-gray-900 p-4 rounded-lg">
              {/* Auto-Prune Days */}
              <div>
                <label className="block mb-1">Auto-Prune (Days)</label>
                <input
                  type="number"
                  value={data.autoPruneDays || 14}
                  onChange={(e) =>
                    setData({ ...data, autoPruneDays: parseInt(e.target.value) })
                  }
                  className="bg-gray-800 px-3 py-2 rounded w-full"
                />
              </div>

              {/* Moderation Queue */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!data.moderationQueueEnabled}
                  onChange={(e) =>
                    setData({ ...data, moderationQueueEnabled: e.target.checked })
                  }
                />
                <label>Enable Moderation Queue</label>
              </div>

              {/* Spotlight Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!data.spotlightEnabled}
                  onChange={(e) =>
                    setData({ ...data, spotlightEnabled: e.target.checked })
                  }
                />
                <label>Enable Spotlight Mode</label>
              </div>

              <button
                onClick={saveClips}
                disabled={loading}
                className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg"
              >
                {loading ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        )}

        {/* Audit Logs Section */}
        {section === "auditLogs" && hasAccess("auditLogs") && (
          <div>
            <h2 className="text-xl font-semibold mb-4">📜 Audit Logs</h2>

            {/* Filters */}
            <div className="flex space-x-4 mb-4">
              <input
                type="text"
                placeholder="Filter by Admin ID"
                value={data.filterAdminId || ""}
                onChange={(e) =>
                  setData((prev: any) => ({ ...prev, filterAdminId: e.target.value }))
                }
                className="bg-gray-800 px-3 py-2 rounded w-1/3"
              />
              <input
                type="text"
                placeholder="Filter by Action"
                value={data.filterAction || ""}
                onChange={(e) =>
                  setData((prev: any) => ({ ...prev, filterAction: e.target.value }))
                }
                className="bg-gray-800 px-3 py-2 rounded w-1/3"
              />
            </div>

            {/* Log List */}
            <div className="space-y-4 bg-gray-900 p-4 rounded-lg">
              {data?.logs?.length > 0 ? (
                <ul className="space-y-3 max-h-[500px] overflow-y-auto">
                  {data.logs.map((log: any, idx: number) => (
                    <li
                      key={idx}
                      className="border border-gray-800 p-3 rounded-lg bg-gray-950"
                    >
                      <p className="text-sm text-gray-300">
                        <strong>{log.adminId}</strong> ({log.role || "N/A"}) — {log.action}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.createdAt?.seconds * 1000).toLocaleString()}
                      </p>
                      {log.details && (
                        <pre className="bg-gray-800 text-xs mt-2 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No logs found.</p>
              )}
            </div>
          </div>
        )}

        {/* Security Section */}
        {section === "security" && hasAccess("security") && (
          <div>
            <h2 className="text-xl font-semibold">Security Panel</h2>
            <pre className="bg-gray-900 p-4 rounded mt-2 text-sm overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}

        {/* Competitions Manager Section */}
        {section === "compManager" && hasAccess("compManager") && (
          <div>
            <h2 className="text-xl font-semibold mb-4">🕹️ Competitions Manager</h2>

            {/* Mode Toggle */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => fetchCompetitions("tournaments")}
                className={`px-4 py-2 rounded-lg ${
                  data.mode === "tournaments"
                    ? "bg-cyan-600"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                🏆 Tournaments
              </button>
              <button
                onClick={() => fetchCompetitions("leagues")}
                className={`px-4 py-2 rounded-lg ${
                  data.mode === "leagues"
                    ? "bg-cyan-600"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                👥 Leagues
              </button>
            </div>

            {/* Tournament Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-cyan-400">Total {data.mode === "tournaments" ? "Tournaments" : "Leagues"}</h3>
                <p className="text-2xl font-bold">{data?.list?.length || 0}</p>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-400">Active</h3>
                <p className="text-2xl font-bold">
                  {data?.list?.filter((t: any) => t.status === "live").length || 0}
                </p>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-400">Upcoming</h3>
                <p className="text-2xl font-bold">
                  {data?.list?.filter((t: any) => t.status === "upcoming").length || 0}
                </p>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-400">Completed</h3>
                <p className="text-2xl font-bold">
                  {data?.list?.filter((t: any) => t.status === "completed").length || 0}
                </p>
              </div>
            </div>

            {/* List Competitions */}
            <div className="space-y-4 bg-gray-900 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {data.mode === "tournaments" ? "Tournaments" : "Leagues"} List
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={!!data.showArchived}
                    onChange={(e) =>
                      setData((prev: any) => ({ ...prev, showArchived: e.target.checked }))
                    }
                  />
                  <label className="text-sm">Show Archived</label>
                </div>
              </div>
              
              {data.list?.length > 0 ? (
                <ul className="space-y-3">
                  {data.list.map((c: any) => (
                    <li
                      key={c.id}
                      className={`border p-3 rounded-lg flex justify-between items-center ${
                        editing?.id === c.id 
                          ? "border-blue-500 bg-blue-950" 
                          : "border-gray-800 bg-gray-950"
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-xs text-gray-500">
                          {c.game} — {c.status} {c.archived ? "(Archived)" : ""}
                        </p>
                        {c.archived && c.pruneAt && (
                          <p className="text-xs text-red-400 mt-1">
                            ⚠️ Will be deleted on {new Date(c.pruneAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="space-x-2">
                        {!c.archived ? (
                          <>
                            <button
                              onClick={() => {
                                if (!c.archived) {
                                  setEditing(editing?.id === c.id ? null : c);
                                } else {
                                  alert("📦 Archived competitions are view-only. Unarchive to edit.");
                                }
                              }}
                              className={`px-3 py-1 rounded ${
                                editing?.id === c.id 
                                  ? "bg-orange-600 hover:bg-orange-500" 
                                  : "bg-yellow-600 hover:bg-yellow-500"
                              }`}
                            >
                              {editing?.id === c.id ? "Cancel" : "Edit"}
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const ref = collection(
                                    db,
                                    data.mode === "tournaments" ? "tournaments" : "leagues"
                                  );
                                  const newDoc = await addDoc(ref, {
                                    ...c,
                                    name: `${c.name} (Copy)`,
                                    status: "upcoming",
                                    archived: false,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                  });
                                  
                                  // Log admin action
                                  await logAdminAction("admin123", role || "viewer", `Duplicated ${data.mode === "tournaments" ? "Tournament" : "League"}`, {
                                    originalName: c.name,
                                    newName: `${c.name} (Copy)`,
                                    originalId: c.id,
                                    newId: newDoc.id
                                  });
                                  
                                  alert(`✅ ${c.name} duplicated as ${c.name} (Copy)`);
                                  fetchCompetitions(data.mode as "tournaments" | "leagues");
                                } catch (error) {
                                  console.error("Error duplicating competition:", error);
                                  alert(`❌ Failed to duplicate ${c.name}`);
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded"
                            >
                              Duplicate
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const ref = doc(
                                    db,
                                    data.mode === "tournaments" ? "tournaments" : "leagues",
                                    c.id
                                  );
                                  await setDoc(
                                    ref,
                                    {
                                      archived: true,
                                      pruneAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                                      updatedAt: new Date().toISOString(),
                                    },
                                    { merge: true }
                                  );
                                  
                                  // Log admin action
                                  await logAdminAction("admin123", role || "viewer", `Archived ${data.mode === "tournaments" ? "Tournament" : "League"}`, {
                                    name: c.name,
                                    game: c.game,
                                    id: c.id
                                  });

                                  alert(
                                    `📦 ${c.name} archived.\n\n💡 Export this competition if you want a permanent snapshot before ${new Date(
                                      Date.now() + 90 * 24 * 60 * 60 * 1000
                                    ).toLocaleDateString()}!`
                                  );

                                  fetchCompetitions(data.mode as "tournaments" | "leagues");
                                } catch (error) {
                                  console.error("Error archiving competition:", error);
                                  alert(`❌ Failed to archive ${c.name}`);
                                }
                              }}
                              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded"
                            >
                              Archive
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="px-3 py-1 text-gray-400 border border-gray-600 rounded">
                              View-Only
                            </span>
                            <button
                              onClick={() => exportCompetition(c)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded"
                            >
                              Export
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const ref = doc(
                                    db,
                                    data.mode === "tournaments" ? "tournaments" : "leagues",
                                    c.id
                                  );
                                  await setDoc(
                                    ref,
                                    { archived: false, updatedAt: new Date().toISOString() },
                                    { merge: true }
                                  );
                                  
                                  // Log admin action
                                  await logAdminAction("admin123", role || "viewer", `Unarchived ${data.mode === "tournaments" ? "Tournament" : "League"}`, {
                                    name: c.name,
                                    game: c.game,
                                    id: c.id
                                  });
                                  
                                  alert(`✅ ${c.name} unarchived`);
                                  fetchCompetitions(data.mode as "tournaments" | "leagues");
                                } catch (error) {
                                  console.error("Error unarchiving competition:", error);
                                  alert(`❌ Failed to unarchive ${c.name}`);
                                }
                              }}
                              className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded"
                            >
                              Unarchive
                            </button>
                          </>
                        )}
                        <button
                          onClick={async () => {
                            try {
                              // Auto-export before delete
                              await exportCompetition(c, true);

                              const confirmDelete = confirm(
                                `⚠️ Are you sure you want to permanently delete "${c.name}"?\nA backup has already been exported.`
                              );
                              if (!confirmDelete) return;

                              await deleteDoc(
                                doc(
                                  db,
                                  data.mode === "tournaments" ? "tournaments" : "leagues",
                                  c.id
                                )
                              );
                              
                              // Log admin action
                              await logAdminAction("admin123", role || "viewer", `Permanently Deleted ${data.mode === "tournaments" ? "Tournament" : "League"}`, {
                                name: c.name,
                                game: c.game,
                                id: c.id,
                                backupExported: true
                              });
                              
                              alert(`❌ ${c.name} deleted`);
                              fetchCompetitions(data.mode as "tournaments" | "leagues");
                            } catch (error) {
                              console.error("Error deleting competition:", error);
                              alert(`❌ Failed to delete ${c.name}`);
                            }
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No {data.mode === "tournaments" ? "tournaments" : "leagues"} 
                  {data.showArchived ? "" : " (active)"} found.
                </p>
              )}
            </div>

            {/* Edit Modal */}
            {editing && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
                <div className="bg-gray-900 p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-semibold mb-4">Edit {editing.name}</h3>

                  {/* Basic Info */}
                  <input
                    type="text"
                    placeholder="Name"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="bg-gray-800 px-3 py-2 rounded w-full mb-2"
                  />

                  <input
                    type="text"
                    placeholder="Game"
                    value={editing.game}
                    onChange={(e) => setEditing({ ...editing, game: e.target.value })}
                    className="bg-gray-800 px-3 py-2 rounded w-full mb-2"
                  />

                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    className="bg-gray-800 px-3 py-2 rounded w-full mb-4"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                  </select>

                  {/* Advanced Settings */}
                  <h4 className="text-md font-semibold mb-2">Advanced Settings</h4>

                  <input
                    type="number"
                    placeholder="Buy-in"
                    value={editing.buyIn || 0}
                    onChange={(e) =>
                      setEditing({ ...editing, buyIn: Number(e.target.value) })
                    }
                    className="bg-gray-800 px-3 py-2 rounded w-full mb-2"
                  />

                  <input
                    type="number"
                    placeholder={
                      data.mode === "tournaments" ? "Max Players" : "Max Teams"
                    }
                    value={editing.settings?.maxPlayers || editing.settings?.maxTeams || 0}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        settings: {
                          ...editing.settings,
                          [data.mode === "tournaments" ? "maxPlayers" : "maxTeams"]: Number(
                            e.target.value
                          ),
                        },
                      })
                    }
                    className="bg-gray-800 px-3 py-2 rounded w-full mb-2"
                  />

                  {/* Stream Required */}
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={!!editing.settings?.streamRequired}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          settings: {
                            ...editing.settings,
                            streamRequired: e.target.checked,
                          },
                        })
                      }
                    />
                    <label>Stream Required</label>
                  </div>

                  {/* Disputes Allowed (tournaments only) */}
                  {data.mode === "tournaments" && (
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={!!editing.settings?.disputesAllowed}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            settings: {
                              ...editing.settings,
                              disputesAllowed: e.target.checked,
                            },
                          })
                        }
                      />
                      <label>Allow Disputes</label>
                    </div>
                  )}

                  {/* Stat Tracking (leagues only) */}
                  {data.mode === "leagues" && (
                    <div className="mb-2">
                      <label className="block mb-1">Stat Tracking (comma separated)</label>
                      <input
                        type="text"
                        placeholder="wins, losses, pointDiff"
                        value={editing.settings?.statTracking?.join(", ") || ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            settings: {
                              ...editing.settings,
                              statTracking: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            },
                          })
                        }
                        className="bg-gray-800 px-3 py-2 rounded w-full"
                      />
                    </div>
                  )}

                  {/* Save + Cancel */}
                  <button
                    onClick={async () => {
                      try {
                        const ref = doc(
                          db,
                          data.mode === "tournaments" ? "tournaments" : "leagues",
                          editing.id
                        );
                        await setDoc(ref, {
                          ...editing,
                          updatedAt: new Date().toISOString(),
                        });
                        
                        // Log admin action
                        await logAdminAction("admin123", role || "viewer", `Updated ${data.mode === "tournaments" ? "Tournament" : "League"}`, {
                          name: editing.name,
                          game: editing.game,
                          id: editing.id
                        });
                        
                        alert(`✅ ${editing.name} updated`);
                        setEditing(null);
                        fetchCompetitions(data.mode as "tournaments" | "leagues");
                      } catch (error) {
                        console.error("Error updating competition:", error);
                        alert(`❌ Failed to update ${editing.name}`);
                      }
                    }}
                    className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-500 rounded w-full"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setEditing(null)}
                    className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded w-full"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Add New Competition */}
            <div className="mt-6 bg-gray-900 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">➕ Add New {data.mode === "tournaments" ? "Tournament" : "League"}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Competition Name"
                  value={data.newName || ""}
                  onChange={(e) => setData({ ...data, newName: e.target.value })}
                  className="bg-gray-800 px-3 py-2 rounded w-full"
                />
                <input
                  type="text"
                  placeholder="Game"
                  value={data.newGame || ""}
                  onChange={(e) => setData({ ...data, newGame: e.target.value })}
                  className="bg-gray-800 px-3 py-2 rounded w-full"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  type="number"
                  placeholder="Buy-in Amount"
                  value={data.newBuyIn || ""}
                  onChange={(e) => setData({ ...data, newBuyIn: parseInt(e.target.value) || 0 })}
                  className="bg-gray-800 px-3 py-2 rounded w-full"
                />
                <select
                  value={data.newStatus || "upcoming"}
                  onChange={(e) => setData({ ...data, newStatus: e.target.value })}
                  className="bg-gray-800 px-3 py-2 rounded w-full"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {data.mode === "tournaments" && (
                  <select
                    value={data.newType || "single_elim"}
                    onChange={(e) => setData({ ...data, newType: e.target.value })}
                    className="bg-gray-800 px-3 py-2 rounded w-full"
                  >
                    <option value="single_elim">Single Elimination</option>
                    <option value="double_elim">Double Elimination</option>
                    <option value="swiss">Swiss</option>
                    <option value="round_robin">Round Robin</option>
                  </select>
                )}
              </div>

              {/* Stripe Payment Button (Placeholder) */}
              {data.enableStripe && data.newBuyIn > 0 && (
                <div className="mb-4 p-4 bg-blue-900 border border-blue-700 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-300 mb-2">💳 Stripe Integration</h4>
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-600 text-gray-400 rounded cursor-not-allowed flex items-center gap-2"
                  >
                    <span>💳</span>
                    Pay with Stripe (Coming Soon)
                  </button>
                  <p className="text-xs text-blue-400 mt-2">
                    Stripe integration is configured but not yet functional. 
                    Tournament will be created with buy-in amount: ${data.newBuyIn}
                  </p>
                </div>
              )}
              
              <button
                onClick={async () => {
                  if (!data.newName || !data.newGame) {
                    alert("Please fill in the name and game fields");
                    return;
                  }
                  
                  try {
                    const collectionName = data.mode === "tournaments" ? "tournaments" : "leagues";
                    const competitionData: any = {
                      name: data.newName,
                      game: data.newGame,
                      status: data.newStatus || "upcoming",
                      buyIn: data.newBuyIn || 0,
                      archived: false,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    };
                    
                    if (data.mode === "tournaments") {
                      competitionData.type = data.newType || "single_elim";
                      competitionData.maxPlayers = 32;
                      competitionData.currentPlayers = 0;
                      competitionData.prizePool = 0;
                    } else {
                      competitionData.type = "league";
                      competitionData.maxTeams = 16;
                      competitionData.currentPlayers = 0;
                      competitionData.prizePool = 0;
                      competitionData.settings = {
                        maxTeams: 16,
                        matchFrequency: "weekly",
                        tier: "Mamba",
                        statTracking: ["wins", "losses", "pointDiff"]
                      };
                    }
                    
                    const ref = collection(db, collectionName);
                    await addDoc(ref, competitionData);
                    
                    // Log admin action
                    await logAdminAction("admin123", role || "viewer", `Created ${data.mode === "tournaments" ? "Tournament" : "League"}`, {
                      name: data.newName,
                      game: data.newGame,
                      type: data.mode
                    });
                    
                    alert(`✅ ${data.newName} created successfully`);
                    setData({ 
                      ...data, 
                      newName: "", 
                      newGame: "", 
                      newBuyIn: 0, 
                      newStatus: "upcoming",
                      newType: data.mode === "tournaments" ? "single_elim" : "league"
                    });
                    fetchCompetitions(data.mode as "tournaments" | "leagues");
                  } catch (error) {
                    console.error("Error creating competition:", error);
                    alert(`❌ Failed to create ${data.newName}`);
                  }
                }}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-semibold"
              >
                Create {data.mode === "tournaments" ? "Tournament" : "League"}
              </button>
            </div>
          </div>
        )}

        {/* Access Denied Message */}
        {!hasAccess(section) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-400">
              You don't have permission to access this section.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Your role: <span className="font-mono">{role || "Loading..."}</span>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}