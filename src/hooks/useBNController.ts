"use client";

import { useEffect, useState } from "react";
import { BNController, BNControllerState, getBNController } from "@/lib/vision/network/bnController";

/**
 * useBNController
 * React hook for CQG Broadcast Network control
 */
export function useBNController() {
  const [controller] = useState(() => getBNController());
  const [state, setState] = useState<BNControllerState>({
    nodes: [],
    totalViewers: 0,
    totalActiveMatches: 0,
    networkHealth: 0,
    primaryNodeId: null,
  });

  useEffect(() => {
    controller.start((newState) => {
      setState(newState);
    });

    return () => {
      controller.stop();
    };
  }, [controller]);

  const registerNode = async (
    nodeId: string,
    tournamentId: string,
    tournamentName: string,
    streamUrl: string
  ) => {
    return await controller.registerNode(nodeId, tournamentId, tournamentName, streamUrl);
  };

  const goLive = async (nodeId: string) => {
    return await controller.goLive(nodeId);
  };

  const goStandby = async (nodeId: string) => {
    return await controller.goStandby(nodeId);
  };

  const removeNode = async (nodeId: string) => {
    return await controller.removeNode(nodeId);
  };

  const getPrimaryNode = () => {
    return controller.getPrimaryNode();
  };

  const getNodeByTournament = (tournamentId: string) => {
    return controller.getNodeByTournament(tournamentId);
  };

  return {
    state,
    registerNode,
    goLive,
    goStandby,
    removeNode,
    getPrimaryNode,
    getNodeByTournament,
  };
}



