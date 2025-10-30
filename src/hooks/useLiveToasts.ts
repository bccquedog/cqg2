"use client";

import { useLiveMatchToasts } from "./useLiveMatchToasts";
import { useMatchMilestoneToasts } from "./useMatchMilestoneToasts";
import { useMVPWatcher } from "./useMVPWatcher";
import { useHighlightToasts } from "./useHighlightToasts";
import { useMomentumTracker } from "./useMomentumTracker";

/**
 * useLiveToasts
 * Composable hook that combines all live toast subsystems for a tournament:
 * - Match start/end
 * - Player milestones (streaks, upsets)
 * - MVP tracking
 * - Highlight moments
 * - Momentum tracking
 */
export function useLiveToasts(tournamentId: string | undefined, currentUserId?: string) {
  useLiveMatchToasts(tournamentId, currentUserId);
  useMatchMilestoneToasts(tournamentId);
  useMVPWatcher(tournamentId);
  useHighlightToasts(tournamentId);
  useMomentumTracker(tournamentId);
}

