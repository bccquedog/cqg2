"use client";

import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export type ReplayAsset = {
  assetId: string;
  tournamentId: string;
  matchId: string;
  playerId?: string;
  playerName?: string;
  type: "highlight" | "full_match" | "clip" | "instant_replay";
  duration: number; // seconds
  storageUrl: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  surgeScore?: number;
  tags: string[];
  metadata: {
    game?: string;
    roundNumber?: number;
    timestamp: number;
    viewCount: number;
    upvotes: number;
  };
  status: "processing" | "ready" | "archived";
  createdAt: any;
};

export type VaultStats = {
  totalAssets: number;
  totalDuration: number; // seconds
  storageUsed: number; // bytes
  topClips: ReplayAsset[];
  recentHighlights: ReplayAsset[];
};

/**
 * CQG Global Replay Vault
 * Centralized storage and management for all video assets, highlights, and replays
 */
export class ReplayVault {
  private vaultId: string;

  constructor(vaultId: string = "global") {
    this.vaultId = vaultId;
  }

  /**
   * Store a replay asset
   */
  async storeReplay(asset: Omit<ReplayAsset, "assetId" | "createdAt" | "status">): Promise<string> {
    try {
      const assetId = `replay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const assetRef = doc(db, "replayVault", assetId);

      await setDoc(assetRef, {
        ...asset,
        assetId,
        status: "processing",
        createdAt: serverTimestamp(),
      });

      console.log("[Replay Vault] Asset stored:", assetId);
      return assetId;
    } catch (error) {
      console.error("[Replay Vault] Failed to store asset:", error);
      throw error;
    }
  }

  /**
   * Get replay asset by ID
   */
  async getReplay(assetId: string): Promise<ReplayAsset | null> {
    try {
      const assetRef = doc(db, "replayVault", assetId);
      const assetSnap = await getDoc(assetRef);

      if (!assetSnap.exists()) {
        return null;
      }

      return assetSnap.data() as ReplayAsset;
    } catch (error) {
      console.error("[Replay Vault] Failed to get asset:", error);
      return null;
    }
  }

  /**
   * Get replays by tournament
   */
  async getReplaysByTournament(
    tournamentId: string,
    type?: ReplayAsset["type"],
    limitCount: number = 20
  ): Promise<ReplayAsset[]> {
    try {
      const vaultCol = collection(db, "replayVault");
      let q = query(
        vaultCol,
        where("tournamentId", "==", tournamentId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      if (type) {
        q = query(vaultCol, where("tournamentId", "==", tournamentId), where("type", "==", type), orderBy("createdAt", "desc"), limit(limitCount));
      }

      const snap = await getDocs(q);
      const assets: ReplayAsset[] = [];

      snap.forEach((doc) => {
        assets.push(doc.data() as ReplayAsset);
      });

      return assets;
    } catch (error) {
      console.error("[Replay Vault] Failed to get tournament replays:", error);
      return [];
    }
  }

  /**
   * Get top clips by upvotes
   */
  async getTopClips(limitCount: number = 10): Promise<ReplayAsset[]> {
    try {
      const vaultCol = collection(db, "replayVault");
      const q = query(
        vaultCol,
        where("type", "==", "clip"),
        where("status", "==", "ready"),
        orderBy("metadata.upvotes", "desc"),
        limit(limitCount)
      );

      const snap = await getDocs(q);
      const clips: ReplayAsset[] = [];

      snap.forEach((doc) => {
        clips.push(doc.data() as ReplayAsset);
      });

      return clips;
    } catch (error) {
      console.error("[Replay Vault] Failed to get top clips:", error);
      return [];
    }
  }

  /**
   * Get vault statistics
   */
  async getVaultStats(): Promise<VaultStats> {
    try {
      const vaultCol = collection(db, "replayVault");
      const snap = await getDocs(vaultCol);

      let totalDuration = 0;
      let storageUsed = 0;
      const allAssets: ReplayAsset[] = [];

      snap.forEach((doc) => {
        const asset = doc.data() as ReplayAsset;
        allAssets.push(asset);
        totalDuration += asset.duration;
        // Estimate storage (rough calculation)
        storageUsed += asset.duration * 1000000; // ~1MB per second
      });

      const topClips = allAssets
        .filter((a) => a.type === "clip")
        .sort((a, b) => b.metadata.upvotes - a.metadata.upvotes)
        .slice(0, 10);

      const recentHighlights = allAssets
        .filter((a) => a.type === "highlight")
        .sort((a, b) => b.metadata.timestamp - a.metadata.timestamp)
        .slice(0, 10);

      return {
        totalAssets: allAssets.length,
        totalDuration,
        storageUsed,
        topClips,
        recentHighlights,
      };
    } catch (error) {
      console.error("[Replay Vault] Failed to get vault stats:", error);
      return {
        totalAssets: 0,
        totalDuration: 0,
        storageUsed: 0,
        topClips: [],
        recentHighlights: [],
      };
    }
  }

  /**
   * Update asset status (e.g., processing -> ready)
   */
  async updateAssetStatus(assetId: string, status: ReplayAsset["status"]): Promise<boolean> {
    try {
      const assetRef = doc(db, "replayVault", assetId);
      await setDoc(assetRef, { status }, { merge: true });
      console.log("[Replay Vault] Asset status updated:", assetId, status);
      return true;
    } catch (error) {
      console.error("[Replay Vault] Failed to update asset status:", error);
      return false;
    }
  }

  /**
   * Archive old assets
   */
  async archiveAssets(olderThan: number): Promise<number> {
    try {
      const vaultCol = collection(db, "replayVault");
      const snap = await getDocs(vaultCol);
      
      let archivedCount = 0;
      const cutoff = Date.now() - olderThan;

      snap.forEach(async (docSnap) => {
        const asset = docSnap.data() as ReplayAsset;
        if (asset.metadata.timestamp < cutoff && asset.status !== "archived") {
          await this.updateAssetStatus(asset.assetId, "archived");
          archivedCount++;
        }
      });

      console.log("[Replay Vault] Archived", archivedCount, "assets");
      return archivedCount;
    } catch (error) {
      console.error("[Replay Vault] Failed to archive assets:", error);
      return 0;
    }
  }
}

/**
 * Singleton instance
 */
let replayVaultInstance: ReplayVault | null = null;

export function getReplayVault(vaultId?: string): ReplayVault {
  if (!replayVaultInstance) {
    replayVaultInstance = new ReplayVault(vaultId);
  }
  return replayVaultInstance;
}



