"use client";

import { Dialog } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getPlayer } from "@/lib/playerService";

interface PlayerProfileModalProps {
  playerId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function PlayerProfileModal({
  playerId,
  open,
  onClose
}: PlayerProfileModalProps) {
  const [player, setPlayer] = useState<any | null>(null);

  useEffect(() => {
    if (playerId && open) {
      getPlayer(playerId).then(setPlayer);
    }
  }, [playerId, open]);

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-6 space-y-4"
          >
            {player ? (
              <>
                {/* Header */}
                <div className="flex items-center space-x-4">
                  <Image
                    src={player.avatarUrl || "/default-avatar.png"}
                    alt={player.username}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                  <div>
                    <h2 className="text-xl font-bold">{player.username}</h2>
                    <p className="text-sm text-gray-500">
                      {player.bio || "No bio yet"}
                    </p>
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${
                        player.status === "online"
                          ? "bg-green-500"
                          : player.status === "in_match"
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                      }`}
                    ></span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold">
                      {player.stats?.matchesPlayed || 0}
                    </p>
                    <p className="text-xs text-gray-500">Matches</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-600">
                      {player.stats?.wins || 0}
                    </p>
                    <p className="text-xs text-gray-500">Wins</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-600">
                      {player.stats?.losses || 0}
                    </p>
                    <p className="text-xs text-gray-500">Losses</p>
                  </div>
                </div>

                {/* Stream Link */}
                {player.streamUrl && (
                  <div className="pt-2">
                    <a
                      href={player.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
                    >
                      🎥 Watch Stream
                    </a>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300"
                  >
                    Close
                  </button>
                  <a
                    href={`/players/${player.id}`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                  >
                    View Full Profile
                  </a>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Loading...</p>
            )}
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
