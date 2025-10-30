"use client";

import { useParams } from "next/navigation";
import RedZoneOverlay from "@/components/RedZoneOverlay";

export default function RedZonePage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;

  return <RedZoneOverlay tournamentId={tournamentId} />;
}



