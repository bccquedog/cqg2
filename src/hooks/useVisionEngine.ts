"use client";

import { useEffect, useRef, useState } from "react";
import { VisionEngine, VisionFocusTarget, VisionEngineState } from "@/lib/vision/visionEngine";

/**
 * useVisionEngine
 * React hook wrapper for CQG Vision Engine
 */
export function useVisionEngine(tournamentId: string | undefined) {
  const engineRef = useRef<VisionEngine | null>(null);
  const [currentFocus, setCurrentFocus] = useState<VisionFocusTarget | null>(null);
  const [engineState, setEngineState] = useState<VisionEngineState>({
    currentFocus: null,
    candidateFocuses: [],
    isActive: false,
    mode: "auto",
  });

  useEffect(() => {
    if (!tournamentId) return;

    const engine = new VisionEngine(tournamentId);
    engineRef.current = engine;

    engine.start((focus) => {
      setCurrentFocus(focus);
      setEngineState(engine.getState());
    });

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, [tournamentId]);

  const setManualFocus = (matchId: string, playerId?: string) => {
    engineRef.current?.setManualFocus(matchId, playerId);
    setEngineState(engineRef.current?.getState() || engineState);
  };

  const setAutoMode = () => {
    engineRef.current?.setAutoMode();
    setEngineState(engineRef.current?.getState() || engineState);
  };

  const getFocusHistory = () => {
    return engineRef.current?.getFocusHistory() || [];
  };

  return {
    currentFocus,
    engineState,
    setManualFocus,
    setAutoMode,
    getFocusHistory,
  };
}



