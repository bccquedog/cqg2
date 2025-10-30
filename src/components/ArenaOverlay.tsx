"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface ArenaOverlayProps {
  leftPlayer: any;
  rightPlayer: any;
  roundName: string;
  matchScore: string;
  sponsorLogo?: string;
  theme?: "default" | "holiday" | "sponsor" | "cod" | "fortnite" | "gta";
}

export default function ArenaOverlay({
  leftPlayer,
  rightPlayer,
  roundName,
  matchScore,
  sponsorLogo,
  theme = "default"
}: ArenaOverlayProps) {
  const themeStyles: Record<string, string> = {
    default: "bg-black/70 text-white",
    holiday: "bg-blue-900/70 text-white",
    sponsor: "bg-gray-800/80 text-yellow-300",
    cod: "bg-green-900/80 text-green-100",
    fortnite: "bg-purple-900/80 text-pink-300",
    gta: "bg-pink-900/80 text-pink-200"
  };

  return (
    <div className="absolute inset-0 pointer-events-none font-sans">
      {/* Top bar */}
      <div
        className={`w-full py-2 px-6 flex justify-between items-center text-sm ${themeStyles[theme]}`}
      >
        <span className="font-bold uppercase tracking-wide">{roundName}</span>
        {sponsorLogo && (
          <Image
            src={sponsorLogo}
            alt="Sponsor"
            width={100}
            height={40}
            className="object-contain"
          />
        )}
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-0 w-full flex justify-between items-center px-8 pb-4">
        {/* Left Player */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`flex items-center space-x-3 py-2 px-4 rounded-xl shadow-lg ${themeStyles[theme]}`}
        >
          <Image
            src={leftPlayer?.avatarUrl || "/default-avatar.png"}
            alt={leftPlayer?.username || "Player"}
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <p className="font-semibold">{leftPlayer?.username || "TBD"}</p>
            <p className="text-xs text-gray-300">
              {leftPlayer?.stats?.wins || 0}W – {leftPlayer?.stats?.losses || 0}L
            </p>
          </div>
          {leftPlayer?.streamUrl && <span className="text-xs">🎥</span>}
        </motion.div>

        {/* Score */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-2xl font-bold px-6 py-2 rounded-lg shadow-md ${themeStyles[theme]}`}
        >
          {matchScore}
        </motion.div>

        {/* Right Player */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`flex items-center space-x-3 py-2 px-4 rounded-xl shadow-lg ${themeStyles[theme]}`}
        >
          {rightPlayer?.streamUrl && <span className="text-xs">🎥</span>}
          <div className="text-right">
            <p className="font-semibold">{rightPlayer?.username || "TBD"}</p>
            <p className="text-xs text-gray-300">
              {rightPlayer?.stats?.wins || 0}W – {rightPlayer?.stats?.losses || 0}L
            </p>
          </div>
          <Image
            src={rightPlayer?.avatarUrl || "/default-avatar.png"}
            alt={rightPlayer?.username || "Player"}
            width={40}
            height={40}
            className="rounded-full"
          />
        </motion.div>
      </div>
    </div>
  );
}
