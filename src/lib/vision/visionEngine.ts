"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { OBSBridge } from "./obsBridge";

export type VisionFocusTarget = {
  matchId: string;
  playerId?: string;
  reason: 
    | "momentum_spike" 
    | "surge_spike" 
    | "mvp_change" 
    | "close_score" 
    | "clip_upload" 
    | "upset_potential"
    | "streak_milestone"
    | "manual_override";
  priority: number; // 1-10, higher = more important
  timestamp: number;
};

export type VisionEngineState = {
  currentFocus: VisionFocusTarget | null;
  candidateFocuses: VisionFocusTarget[];
  isActive: boolean;
  mode: "auto" | "manual";
};

type MatchData = {
  id: string;
  status?: string;
  playerAId?: string;
  playerBId?: string;
  playerAName?: string;
  playerBName?: string;
  playerAMomentum?: number;
  playerBMomentum?: number;
  playerASurge?: number;
  playerBSurge?: number;
  playerASeed?: number;
  playerBSeed?: number;
  scoreA?: number;
  scoreB?: number;
  roundNumber?: number;
};

type ClipData = {
  id: string;
  playerId?: string;
  matchId?: string;
  surgeScore?: number;
  uploadedAt?: any;
};

/**
 * CQG Vision Engine
 * Intelligent auto-director that analyzes tournament data to determine optimal camera focus
 */
export class VisionEngine {
  private tournamentId: string;
  private state: VisionEngineState = {
    currentFocus: null,
    candidateFocuses: [],
    isActive: false,
    mode: "auto",
  };
  private listeners: Array<() => void> = [];
  private focusHistory: VisionFocusTarget[] = [];
  private lastSurgeScores: Record<string, number> = {};
  private lastMomentumScores: Record<string, number> = {};
  private obsBridge: OBSBridge | null = null;
  private obsEnabled: boolean = false;

  constructor(tournamentId: string, enableOBS: boolean = false) {
    this.tournamentId = tournamentId;
    this.obsEnabled = enableOBS;
    if (enableOBS) {
      this.obsBridge = new OBSBridge();
    }
  }

  /**
   * Start the Vision Engine
   */
  start(onFocusChange: (focus: VisionFocusTarget | null) => void) {
    this.state.isActive = true;
    console.log("[Vision Engine] Starting for tournament:", this.tournamentId);

    // Listen to active matches
    const matchesCol = collection(db, "tournaments", this.tournamentId, "matches");
    const activeQuery = query(matchesCol, where("status", "==", "live"));

    const matchUnsub = onSnapshot(activeQuery, (snap) => {
      if (this.state.mode !== "auto") return;

      const candidates: VisionFocusTarget[] = [];

      snap.forEach((doc) => {
        const match = { id: doc.id, ...doc.data() } as MatchData;
        
        // Momentum spike detection (>90 or sudden increase >20)
        const momentumA = match.playerAMomentum || 0;
        const momentumB = match.playerBMomentum || 0;
        const prevA = this.lastMomentumScores[match.playerAId || ""] || 0;
        const prevB = this.lastMomentumScores[match.playerBId || ""] || 0;

        if (momentumA > 90) {
          candidates.push({
            matchId: match.id,
            playerId: match.playerAId,
            reason: "momentum_spike",
            priority: 9,
            timestamp: Date.now(),
          });
        }
        if (momentumB > 90) {
          candidates.push({
            matchId: match.id,
            playerId: match.playerBId,
            reason: "momentum_spike",
            priority: 9,
            timestamp: Date.now(),
          });
        }

        // Surge spike detection (sudden increase >15)
        const surgeA = match.playerASurge || 0;
        const surgeB = match.playerBSurge || 0;
        const prevSurgeA = this.lastSurgeScores[match.playerAId || ""] || 0;
        const prevSurgeB = this.lastSurgeScores[match.playerBId || ""] || 0;

        if (surgeA - prevSurgeA > 15) {
          candidates.push({
            matchId: match.id,
            playerId: match.playerAId,
            reason: "surge_spike",
            priority: 8,
            timestamp: Date.now(),
          });
        }
        if (surgeB - prevSurgeB > 15) {
          candidates.push({
            matchId: match.id,
            playerId: match.playerBId,
            reason: "surge_spike",
            priority: 8,
            timestamp: Date.now(),
          });
        }

        // Close score detection (within 10% difference)
        if (match.scoreA != null && match.scoreB != null) {
          const diff = Math.abs(match.scoreA - match.scoreB);
          const total = match.scoreA + match.scoreB;
          if (total > 0 && (diff / total) < 0.1) {
            candidates.push({
              matchId: match.id,
              reason: "close_score",
              priority: 7,
              timestamp: Date.now(),
            });
          }
        }

        // Upset potential (lower seed winning)
        if (match.playerASeed && match.playerBSeed && match.scoreA != null && match.scoreB != null) {
          if (match.playerASeed > match.playerBSeed + 2 && match.scoreA > match.scoreB) {
            candidates.push({
              matchId: match.id,
              playerId: match.playerAId,
              reason: "upset_potential",
              priority: 8,
              timestamp: Date.now(),
            });
          }
          if (match.playerBSeed > match.playerASeed + 2 && match.scoreB > match.scoreA) {
            candidates.push({
              matchId: match.id,
              playerId: match.playerBId,
              reason: "upset_potential",
              priority: 8,
              timestamp: Date.now(),
            });
          }
        }

        // Update tracking
        if (match.playerAId) {
          this.lastMomentumScores[match.playerAId] = momentumA;
          this.lastSurgeScores[match.playerAId] = surgeA;
        }
        if (match.playerBId) {
          this.lastMomentumScores[match.playerBId] = momentumB;
          this.lastSurgeScores[match.playerBId] = surgeB;
        }
      });

      this.state.candidateFocuses = candidates;
      this.evaluateFocus(onFocusChange);
    });

    this.listeners.push(matchUnsub);

    // Listen to recent clips
    const clipsCol = collection(db, "clips");
    const clipsQuery = query(clipsCol, where("tournamentId", "==", this.tournamentId));

    const clipUnsub = onSnapshot(clipsQuery, (snap) => {
      if (this.state.mode !== "auto") return;

      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const clip = { id: change.doc.id, ...change.doc.data() } as ClipData;
          
          // Recent clip upload (within last 10 seconds)
          const now = Date.now();
          const uploadTime = clip.uploadedAt?.toMillis?.() || 0;
          if (now - uploadTime < 10000 && clip.matchId) {
            this.state.candidateFocuses.push({
              matchId: clip.matchId,
              playerId: clip.playerId,
              reason: "clip_upload",
              priority: 7,
              timestamp: now,
            });
            this.evaluateFocus(onFocusChange);
          }
        }
      });
    });

    this.listeners.push(clipUnsub);
  }

  /**
   * Evaluate and select best focus target
   */
  private evaluateFocus(onFocusChange: (focus: VisionFocusTarget | null) => void) {
    if (this.state.candidateFocuses.length === 0) {
      return;
    }

    // Sort by priority, then by recency
    const sorted = [...this.state.candidateFocuses].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.timestamp - a.timestamp;
    });

    const bestFocus = sorted[0];

    // Only change focus if:
    // 1. No current focus
    // 2. New focus has higher priority
    // 3. Current focus is stale (>5s old)
    const shouldChange =
      !this.state.currentFocus ||
      bestFocus.priority > (this.state.currentFocus.priority || 0) ||
      Date.now() - this.state.currentFocus.timestamp > 5000;

    if (shouldChange) {
      console.log("[Vision Engine] Focus change:", bestFocus.reason, bestFocus.matchId);
      this.state.currentFocus = bestFocus;
      this.focusHistory.push(bestFocus);
      onFocusChange(bestFocus);

      // OBS integration: auto-switch scene based on focus reason
      if (this.obsEnabled && this.obsBridge) {
        this.handleOBSFocusChange(bestFocus);
      }
    }

    // Clear stale candidates (>10s old)
    this.state.candidateFocuses = this.state.candidateFocuses.filter(
      (c) => Date.now() - c.timestamp < 10000
    );
  }

  /**
   * Manual override
   */
  setManualFocus(matchId: string, playerId?: string) {
    console.log("[Vision Engine] Manual override:", matchId, playerId);
    this.state.mode = "manual";
    this.state.currentFocus = {
      matchId,
      playerId,
      reason: "manual_override",
      priority: 10,
      timestamp: Date.now(),
    };
  }

  /**
   * Return to auto mode
   */
  setAutoMode() {
    console.log("[Vision Engine] Returning to auto mode");
    this.state.mode = "auto";
  }

  /**
   * Stop the engine
   */
  stop() {
    console.log("[Vision Engine] Stopping");
    this.state.isActive = false;
    this.listeners.forEach((unsub) => unsub());
    this.listeners = [];
  }

  /**
   * Get current state
   */
  getState(): VisionEngineState {
    return { ...this.state };
  }

  /**
   * Get focus history (for analytics)
   */
  getFocusHistory(): VisionFocusTarget[] {
    return [...this.focusHistory];
  }

  /**
   * Handle OBS scene changes based on focus reason
   */
  private async handleOBSFocusChange(focus: VisionFocusTarget) {
    if (!this.obsBridge) return;

    try {
      switch (focus.reason) {
        case "momentum_spike":
        case "surge_spike":
          // Switch to close-up player cam
          await this.obsBridge.switchScene("PlayerCam");
          if (focus.playerId) {
            await this.obsBridge.setText("PlayerNameTag", focus.playerId);
          }
          break;

        case "close_score":
          // Switch to split-screen match view
          await this.obsBridge.switchScene("MatchFeed");
          break;

        case "clip_upload":
          // Play stinger and show clip
          await this.obsBridge.playStinger("CQG_Transition");
          await this.obsBridge.switchScene("ClipReplay");
          break;

        case "mvp_change":
          // Show MVP overlay
          await this.obsBridge.toggleSource("MVPLayer", true);
          setTimeout(() => {
            this.obsBridge?.toggleSource("MVPLayer", false);
          }, 5000);
          break;

        default:
          // Default match feed
          await this.obsBridge.switchScene("MatchFeed");
      }

      console.log("[Vision Engine] OBS scene updated for:", focus.reason);
    } catch (error) {
      console.error("[Vision Engine] OBS control failed:", error);
    }
  }

  /**
   * Enable OBS integration
   */
  async enableOBS() {
    if (!this.obsBridge) {
      this.obsBridge = new OBSBridge();
    }
    this.obsEnabled = true;
    await this.obsBridge.connect();
    console.log("[Vision Engine] OBS integration enabled");
  }

  /**
   * Disable OBS integration
   */
  async disableOBS() {
    this.obsEnabled = false;
    if (this.obsBridge) {
      await this.obsBridge.disconnect();
    }
    console.log("[Vision Engine] OBS integration disabled");
  }

  /**
   * Get OBS bridge instance
   */
  getOBSBridge(): OBSBridge | null {
    return this.obsBridge;
  }
}

