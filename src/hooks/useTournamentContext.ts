"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

export function useTournamentContext() {
  const pathname = usePathname();
  
  return useMemo(() => {
    // Check if we're on a tournament join page
    const joinMatch = pathname.match(/^\/tournaments\/([^\/]+)\/join/);
    if (joinMatch) {
      return { tournamentId: joinMatch[1], isJoinPage: true };
    }
    
    // Check if we're on any tournament page
    const tournamentMatch = pathname.match(/^\/tournaments\/([^\/]+)/);
    if (tournamentMatch) {
      return { tournamentId: tournamentMatch[1], isJoinPage: false };
    }
    
    return { tournamentId: null, isJoinPage: false };
  }, [pathname]);
}


