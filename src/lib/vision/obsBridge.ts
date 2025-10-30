"use client";

import OBSWebSocket from "obs-websocket-js";

export type OBSConnectionConfig = {
  host: string;
  port: number;
  password: string;
};

export type OBSBridgeStatus = {
  connected: boolean;
  version?: string;
  error?: string;
};

/**
 * CQG Vision OBS Bridge
 * Interfaces with OBS Studio via WebSocket v5 for automated broadcast control
 */
export class OBSBridge {
  private obs: OBSWebSocket;
  private config: OBSConnectionConfig;
  private status: OBSBridgeStatus = { connected: false };
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<OBSConnectionConfig>) {
    this.obs = new OBSWebSocket();
    this.config = {
      host: config?.host || process.env.NEXT_PUBLIC_OBS_HOST || "localhost",
      port: config?.port || Number(process.env.NEXT_PUBLIC_OBS_PORT) || 4455,
      password: config?.password || process.env.NEXT_PUBLIC_OBS_PASSWORD || "",
    };
  }

  /**
   * Connect to OBS WebSocket
   */
  async connect(): Promise<boolean> {
    try {
      console.log("[OBS Bridge] Connecting to OBS...", this.config.host, this.config.port);
      
      await this.obs.connect(
        `ws://${this.config.host}:${this.config.port}`,
        this.config.password
      );

      const version = await this.obs.call("GetVersion");
      this.status = {
        connected: true,
        version: version.obsVersion,
      };

      console.log("[OBS Bridge] Connected successfully", version.obsVersion);
      return true;
    } catch (error: any) {
      this.status = {
        connected: false,
        error: error.message || "Connection failed",
      };
      console.error("[OBS Bridge] Connection failed:", error);
      return false;
    }
  }

  /**
   * Disconnect from OBS
   */
  async disconnect() {
    try {
      await this.obs.disconnect();
      this.status.connected = false;
      console.log("[OBS Bridge] Disconnected");
    } catch (error) {
      console.error("[OBS Bridge] Disconnect error:", error);
    }
  }

  /**
   * Switch to a different scene
   */
  async switchScene(sceneName: string): Promise<boolean> {
    if (!this.status.connected) {
      console.warn("[OBS Bridge] Not connected, cannot switch scene");
      return false;
    }

    try {
      await this.obs.call("SetCurrentProgramScene", { sceneName });
      console.log("[OBS Bridge] Switched to scene:", sceneName);
      return true;
    } catch (error) {
      console.error("[OBS Bridge] Scene switch failed:", error);
      return false;
    }
  }

  /**
   * Toggle source visibility
   */
  async toggleSource(sourceName: string, visible: boolean): Promise<boolean> {
    if (!this.status.connected) return false;

    try {
      await this.obs.call("SetSceneItemEnabled", {
        sceneName: await this.getCurrentScene(),
        sceneItemId: await this.getSourceId(sourceName),
        sceneItemEnabled: visible,
      });
      console.log("[OBS Bridge] Source toggled:", sourceName, visible);
      return true;
    } catch (error) {
      console.error("[OBS Bridge] Source toggle failed:", error);
      return false;
    }
  }

  /**
   * Play stinger transition
   */
  async playStinger(stingerName: string): Promise<boolean> {
    if (!this.status.connected) return false;

    try {
      // Trigger stinger via scene transition
      await this.obs.call("TriggerStudioModeTransition");
      console.log("[OBS Bridge] Stinger played:", stingerName);
      return true;
    } catch (error) {
      console.error("[OBS Bridge] Stinger playback failed:", error);
      return false;
    }
  }

  /**
   * Update text source
   */
  async setText(sourceName: string, text: string): Promise<boolean> {
    if (!this.status.connected) return false;

    try {
      await this.obs.call("SetInputSettings", {
        inputName: sourceName,
        inputSettings: { text },
      });
      console.log("[OBS Bridge] Text updated:", sourceName, text);
      return true;
    } catch (error) {
      console.error("[OBS Bridge] Text update failed:", error);
      return false;
    }
  }

  /**
   * Get current scene name
   */
  private async getCurrentScene(): Promise<string> {
    const response = await this.obs.call("GetCurrentProgramScene");
    return response.currentProgramSceneName;
  }

  /**
   * Get source ID by name (helper)
   */
  private async getSourceId(sourceName: string): Promise<number> {
    const scene = await this.getCurrentScene();
    const items = await this.obs.call("GetSceneItemList", { sceneName: scene });
    const item = items.sceneItems.find((i: any) => i.sourceName === sourceName);
    return item?.sceneItemId || 0;
  }

  /**
   * Get connection status
   */
  getStatus(): OBSBridgeStatus {
    return { ...this.status };
  }

  /**
   * Enable auto-reconnect
   */
  enableAutoReconnect(intervalMs: number = 5000) {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setInterval(async () => {
      if (!this.status.connected) {
        console.log("[OBS Bridge] Attempting reconnect...");
        await this.connect();
      }
    }, intervalMs);
  }

  /**
   * Disable auto-reconnect
   */
  disableAutoReconnect() {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// Singleton instance
let obsBridgeInstance: OBSBridge | null = null;

export function getOBSBridge(config?: Partial<OBSConnectionConfig>): OBSBridge {
  if (!obsBridgeInstance) {
    obsBridgeInstance = new OBSBridge(config);
  }
  return obsBridgeInstance;
}



