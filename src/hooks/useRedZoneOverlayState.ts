"use client";

import { useState, useEffect, useRef } from "react";
import { RedZoneMatch } from "./useRedZoneFeed";

export type RedZoneMode = "grid" | "spotlight" | "rotation";

export type RedZoneState = {
  mode: RedZoneMode;
  spotlightMatchId: string | null;
  pinnedMatchId: string | null;
  rotationIndex: number;
  rotationInterval: number; // seconds
  clipAutoplay: boolean;
  streamerMode: boolean;
};

/**
 * useRedZoneOverlayState
 * Manages RedZone overlay behavior:
 * - Auto-rotation every 60s
 * - Spotlight mode when momentum > 90
 * - Pin/unpin matches
 * - Clip autoplay toggle
 */
export function useRedZoneOverlayState(matches: RedZoneMatch[]) {
  const [state, setState] = useState<RedZoneState>({
    mode: "grid",
    spotlightMatchId: null,
    pinnedMatchId: null,
    rotationIndex: 0,
    rotationInterval: 60,
    clipAutoplay: true,
    streamerMode: false,
  });

  const rotationTimer = useRef<NodeJS.Timeout | null>(null);
  const spotlightTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotation logic
  useEffect(() => {
    if (state.mode !== "rotation" || state.pinnedMatchId) return;

    rotationTimer.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        rotationIndex: (prev.rotationIndex + 1) % Math.max(matches.length, 1),
      }));
    }, state.rotationInterval * 1000);

    return () => {
      if (rotationTimer.current) clearInterval(rotationTimer.current);
    };
  }, [state.mode, state.rotationInterval, matches.length, state.pinnedMatchId]);

  // Auto-spotlight on high momentum
  useEffect(() => {
    if (state.pinnedMatchId || state.mode === "spotlight") return;

    const highMomentumMatch = matches.find((m) => m.avgMomentum > 90);
    if (highMomentumMatch && state.spotlightMatchId !== highMomentumMatch.matchId) {
      setState((prev) => ({
        ...prev,
        mode: "spotlight",
        spotlightMatchId: highMomentumMatch.matchId,
      }));

      // Return to grid after 10s
      spotlightTimer.current = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          mode: "grid",
          spotlightMatchId: null,
        }));
      }, 10000);
    }

    return () => {
      if (spotlightTimer.current) clearTimeout(spotlightTimer.current);
    };
  }, [matches, state.pinnedMatchId, state.mode, state.spotlightMatchId]);

  const setMode = (mode: RedZoneMode) => setState((prev) => ({ ...prev, mode }));
  const pinMatch = (matchId: string | null) => setState((prev) => ({ ...prev, pinnedMatchId: matchId }));
  const setRotationInterval = (seconds: number) => setState((prev) => ({ ...prev, rotationInterval: seconds }));
  const toggleClipAutoplay = () => setState((prev) => ({ ...prev, clipAutoplay: !prev.clipAutoplay }));
  const toggleStreamerMode = () => setState((prev) => ({ ...prev, streamerMode: !prev.streamerMode }));

  return {
    state,
    setMode,
    pinMatch,
    setRotationInterval,
    toggleClipAutoplay,
    toggleStreamerMode,
  };
}



