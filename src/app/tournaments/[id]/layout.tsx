"use client";

import { useAuth } from "@/hooks/useAuth";
import { useParams } from "next/navigation";
import { useLiveToasts } from "@/hooks/useLiveToasts";

export default function TournamentSectionLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const tournamentId = params.id as string;
  const { user } = useAuth();

  // Composite live toast system: matches, milestones, MVP, highlights
  useLiveToasts(tournamentId, user?.uid || undefined);

  return <>{children}</>;
}


