"use client";

import { collection, onSnapshot, doc, setDoc, updateDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export type VisionNode = {
  nodeId: string;
  tournamentId: string;
  tournamentName: string;
  status: "live" | "standby" | "offline";
  streamUrl: string;
  viewers: number;
  health: number; // 0-100
  latency: number; // ms
  lastHeartbeat: number;
  activeMatches: number;
  highlights: number;
  mvpPlayer?: { id: string; name: string };
};

export type BNControllerState = {
  nodes: VisionNode[];
  totalViewers: number;
  totalActiveMatches: number;
  networkHealth: number;
  primaryNodeId: string | null;
};

/**
 * CQG Broadcast Network (BN) Controller
 * Manages multiple Vision Engine instances across tournaments and leagues
 */
export class BNController {
  private state: BNControllerState = {
    nodes: [],
    totalViewers: 0,
    totalActiveMatches: 0,
    networkHealth: 100,
    primaryNodeId: null,
  };
  private listeners: Array<() => void> = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Start BN Controller
   */
  async start(onUpdate: (state: BNControllerState) => void) {
    console.log("[BN Controller] Starting Broadcast Network");

    // Subscribe to active Vision nodes
    const nodesCol = collection(db, "visionNetwork", "nodes", "active");
    const q = query(nodesCol, where("status", "in", ["live", "standby"]));

    const nodesUnsub = onSnapshot(q, (snap) => {
      const nodes: VisionNode[] = [];

      snap.forEach((doc) => {
        const data = doc.data();
        nodes.push({
          nodeId: doc.id,
          tournamentId: data.tournamentId || "",
          tournamentName: data.tournamentName || "Unknown",
          status: data.status || "offline",
          streamUrl: data.streamUrl || "",
          viewers: data.viewers || 0,
          health: data.health || 100,
          latency: data.latency || 0,
          lastHeartbeat: data.lastHeartbeat?.toMillis?.() || Date.now(),
          activeMatches: data.activeMatches || 0,
          highlights: data.highlights || 0,
          mvpPlayer: data.mvpPlayer,
        });
      });

      // Sort by viewers (prioritize popular streams)
      nodes.sort((a, b) => b.viewers - a.viewers);

      // Update state
      this.state.nodes = nodes;
      this.state.totalViewers = nodes.reduce((sum, n) => sum + n.viewers, 0);
      this.state.totalActiveMatches = nodes.reduce((sum, n) => sum + n.activeMatches, 0);
      this.state.networkHealth = this.calculateNetworkHealth(nodes);
      this.state.primaryNodeId = nodes.length > 0 ? nodes[0].nodeId : null;

      onUpdate(this.state);
    });

    this.listeners.push(nodesUnsub);

    // Start heartbeat monitoring
    this.startHeartbeatMonitor();
  }

  /**
   * Register a new Vision node
   */
  async registerNode(
    nodeId: string,
    tournamentId: string,
    tournamentName: string,
    streamUrl: string
  ): Promise<boolean> {
    try {
      const nodeRef = doc(db, "visionNetwork", "nodes", "active", nodeId);
      await setDoc(nodeRef, {
        tournamentId,
        tournamentName,
        status: "standby",
        streamUrl,
        viewers: 0,
        health: 100,
        latency: 0,
        activeMatches: 0,
        highlights: 0,
        lastHeartbeat: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      console.log("[BN Controller] Node registered:", nodeId);
      return true;
    } catch (error) {
      console.error("[BN Controller] Failed to register node:", error);
      return false;
    }
  }

  /**
   * Update node status
   */
  async updateNodeStatus(
    nodeId: string,
    updates: Partial<Omit<VisionNode, "nodeId">>
  ): Promise<boolean> {
    try {
      const nodeRef = doc(db, "visionNetwork", "nodes", "active", nodeId);
      await updateDoc(nodeRef, {
        ...updates,
        lastHeartbeat: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("[BN Controller] Failed to update node:", error);
      return false;
    }
  }

  /**
   * Set node to live
   */
  async goLive(nodeId: string): Promise<boolean> {
    return await this.updateNodeStatus(nodeId, { status: "live" });
  }

  /**
   * Set node to standby
   */
  async goStandby(nodeId: string): Promise<boolean> {
    return await this.updateNodeStatus(nodeId, { status: "standby" });
  }

  /**
   * Remove node from network
   */
  async removeNode(nodeId: string): Promise<boolean> {
    return await this.updateNodeStatus(nodeId, { status: "offline" });
  }

  /**
   * Calculate network health
   */
  private calculateNetworkHealth(nodes: VisionNode[]): number {
    if (nodes.length === 0) return 0;

    const avgHealth = nodes.reduce((sum, n) => sum + n.health, 0) / nodes.length;
    const onlineRatio = nodes.filter((n) => n.status === "live").length / nodes.length;

    return Math.round((avgHealth * 0.7 + onlineRatio * 100 * 0.3));
  }

  /**
   * Monitor node heartbeats
   */
  private startHeartbeatMonitor() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 30000; // 30 seconds

      this.state.nodes.forEach((node) => {
        if (now - node.lastHeartbeat > staleThreshold) {
          console.warn("[BN Controller] Node stale:", node.nodeId);
          this.updateNodeStatus(node.nodeId, { status: "offline", health: 0 });
        }
      });
    }, 10000); // Check every 10 seconds
  }

  /**
   * Get primary node (highest viewers)
   */
  getPrimaryNode(): VisionNode | null {
    return this.state.nodes.length > 0 ? this.state.nodes[0] : null;
  }

  /**
   * Get node by tournament ID
   */
  getNodeByTournament(tournamentId: string): VisionNode | null {
    return this.state.nodes.find((n) => n.tournamentId === tournamentId) || null;
  }

  /**
   * Stop BN Controller
   */
  stop() {
    console.log("[BN Controller] Stopping");
    this.listeners.forEach((unsub) => unsub());
    this.listeners = [];
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  /**
   * Get current state
   */
  getState(): BNControllerState {
    return { ...this.state };
  }
}

/**
 * Singleton instance
 */
let bnControllerInstance: BNController | null = null;

export function getBNController(): BNController {
  if (!bnControllerInstance) {
    bnControllerInstance = new BNController();
  }
  return bnControllerInstance;
}



