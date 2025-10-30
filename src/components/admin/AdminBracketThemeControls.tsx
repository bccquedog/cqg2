"use client";

import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

type Theme =
  | "default"
  | "halloween"
  | "holiday"
  | "summer"
  | "cod"
  | "fortnite"
  | "gta"
  | "sponsor";

export default function AdminBracketThemeControls({
  tournamentId = "tourney1"
}: {
  tournamentId?: string;
}) {
  const [theme, setTheme] = useState<Theme>("default");
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [brandingEnabled, setBrandingEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [playerClickMode, setPlayerClickMode] = useState<
    "modal" | "navigation" | "external"
  >("modal");

  const themeNames: Record<Theme, string> = {
    default: "Default CQG (Gold)",
    halloween: "Halloween 🎃",
    holiday: "Holiday 🎄",
    summer: "Summer ☀️",
    cod: "COD Camo 🪖",
    fortnite: "Fortnite 🎮",
    gta: "GTA Neon 🌆",
    sponsor: "Custom Sponsor"
  };

  const themeStyles: Record<Theme, string> = {
    default: "bg-white border-yellow-500 text-yellow-700",
    halloween: "bg-gray-900 border-orange-600 text-orange-400",
    holiday: "bg-blue-50 border-blue-400 text-blue-700",
    summer: "bg-yellow-50 border-pink-400 text-pink-600",
    cod: "bg-green-900 border-green-600 text-green-200",
    fortnite: "bg-purple-100 border-purple-500 text-purple-700",
    gta: "bg-pink-900 border-pink-600 text-pink-200",
    sponsor: "bg-gray-100 border-gray-500 text-gray-700"
  };

  const configRef = doc(db, "tournaments", tournamentId);

  // Load config
  useEffect(() => {
    const unsub = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data().themeConfig || {};
        setTheme(data.theme || "default");
        setEffectsEnabled(data.effectsEnabled ?? true);
        setBrandingEnabled(data.brandingEnabled ?? false);
        setLocked(data.locked ?? false);
        setPlayerClickMode(data.playerClickMode || "modal");
      }
    });
    return () => unsub();
  }, [tournamentId]);

  // Save config
  const saveConfig = async (newConfig: any) => {
    await setDoc(
      configRef,
      {
        themeConfig: {
          theme,
          effectsEnabled,
          brandingEnabled,
          locked,
          playerClickMode,
          ...newConfig
        }
      },
      { merge: true }
    );
  };

  return (
    <div className="p-6 border rounded-xl shadow-md bg-white space-y-6">
      <h2 className="text-2xl font-bold">🎨 Bracket Theme Controls</h2>

      {/* Theme dropdown */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Theme</label>
        <select
          value={theme}
          onChange={(e) => {
            const value = e.target.value as Theme;
            setTheme(value);
            saveConfig({ theme: value });
          }}
          className="border rounded-lg p-2 w-full"
          disabled={locked}
        >
          {Object.entries(themeNames).map(([key, name]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Player Click Mode */}
      <div>
        <label className="block text-sm font-medium mb-2">Player Click Mode</label>
        <select
          value={playerClickMode}
          onChange={(e) => {
            const value = e.target.value as "modal" | "navigation" | "external";
            setPlayerClickMode(value);
            saveConfig({ playerClickMode: value });
          }}
          className="border rounded-lg p-2 w-full"
          disabled={locked}
        >
          <option value="modal">Open Modal (default)</option>
          <option value="navigation">Navigate to /players/[id]</option>
          <option value="external">Open Stream Link (if available)</option>
        </select>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={effectsEnabled}
            onChange={(e) => {
              setEffectsEnabled(e.target.checked);
              saveConfig({ effectsEnabled: e.target.checked });
            }}
            disabled={locked}
          />
          <span>Enable Theme Effects</span>
        </label>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={brandingEnabled}
            onChange={(e) => {
              setBrandingEnabled(e.target.checked);
              saveConfig({ brandingEnabled: e.target.checked });
            }}
            disabled={locked}
          />
          <span>Apply Sponsor Branding</span>
        </label>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={locked}
            onChange={(e) => {
              setLocked(e.target.checked);
              saveConfig({ locked: e.target.checked });
            }}
          />
          <span>Lock Theme</span>
        </label>
      </div>

      {/* Live Preview */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Preview</h3>
        <div
          className={`p-4 border-2 rounded-lg shadow-md flex items-center justify-between ${themeStyles[theme]}`}
        >
          <span className="font-semibold">Player A vs Player B</span>
          <Crown className="w-5 h-5 text-yellow-400" />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Preview updates instantly with theme + click mode.
        </p>
      </div>
    </div>
  );
}
