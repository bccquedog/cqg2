"use client";

import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";

type Player = {
  id: string;
  name: string;
  seed: number;
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const querySnapshot = await getDocs(collection(db, "players"));
      const playerList: Player[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Player, "id">),
      }));
      setPlayers(playerList);
    };
    fetchPlayers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Players ({players.length})</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {players.map((player) => (
          <Link
            key={player.id}
            href={`/profile/${player.id}`}
            className="p-4 border rounded-lg hover:bg-gray-100 transition"
          >
            <h2 className="font-semibold">{player.name}</h2>
            <p className="text-sm text-gray-600">Seed #{player.seed}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
