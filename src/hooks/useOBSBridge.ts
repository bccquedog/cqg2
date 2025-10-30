"use client";

import { useEffect, useState } from "react";
import { getOBSBridge, OBSBridgeStatus } from "@/lib/vision/obsBridge";

/**
 * useOBSBridge
 * React hook for OBS WebSocket integration
 */
export function useOBSBridge(autoConnect: boolean = false) {
  const [status, setStatus] = useState<OBSBridgeStatus>({ connected: false });
  const [bridge] = useState(() => getOBSBridge());

  useEffect(() => {
    if (autoConnect) {
      bridge.connect().then((success) => {
        setStatus(bridge.getStatus());
        if (success) {
          bridge.enableAutoReconnect();
        }
      });
    }

    // Update status periodically
    const statusInterval = setInterval(() => {
      setStatus(bridge.getStatus());
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      bridge.disableAutoReconnect();
    };
  }, [autoConnect, bridge]);

  const connect = async () => {
    const success = await bridge.connect();
    setStatus(bridge.getStatus());
    if (success) {
      bridge.enableAutoReconnect();
    }
    return success;
  };

  const disconnect = async () => {
    await bridge.disconnect();
    bridge.disableAutoReconnect();
    setStatus(bridge.getStatus());
  };

  const switchScene = async (sceneName: string) => {
    return await bridge.switchScene(sceneName);
  };

  const toggleSource = async (sourceName: string, visible: boolean) => {
    return await bridge.toggleSource(sourceName, visible);
  };

  const setText = async (sourceName: string, text: string) => {
    return await bridge.setText(sourceName, text);
  };

  const playStinger = async (stingerName: string) => {
    return await bridge.playStinger(stingerName);
  };

  return {
    status,
    connect,
    disconnect,
    switchScene,
    toggleSource,
    setText,
    playStinger,
  };
}



