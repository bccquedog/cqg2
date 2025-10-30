"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPlayer } from "@/lib/playerService";
import PlayerProfile from "@/components/PlayerProfile";

export default function PlayerProfilePage() {
  const params = useParams();
  const id = (params as { id?: string }).id;
  const [player, setPlayer] = useState<any | null>(null);

  useEffect(() => {
    if (id) {
      getPlayer(id as string).then(setPlayer);
    }
  }, [id]);

  if (!player) {
    return <p className="p-6 text-gray-500">Loading player...</p>;
  }

  return (
    <div className="p-8">
      <PlayerProfile player={player} />
    </div>
  );
}
