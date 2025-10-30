"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Tournament {
  id: string;
  name: string;
  status: string;
  settings: {
    autoProgress: boolean;
    simulationMode: boolean;
  };
  currentRound: number;
  totalRounds: number;
}

interface AutoProgressionStatusProps {
  tournamentId: string;
}

export default function AutoProgressionStatus({ tournamentId }: AutoProgressionStatusProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    if (!tournamentId) return;

    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const unsubscribe = onSnapshot(tournamentRef, (doc) => {
      if (doc.exists()) {
        setTournament({ id: doc.id, ...doc.data() } as Tournament);
      }
    });

    return () => unsubscribe();
  }, [tournamentId]);

  if (!tournament || !tournament.settings?.autoProgress) {
    return null;
  }

  const getStatusColor = () => {
    if (tournament.settings?.simulationMode) {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    }
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const getStatusText = () => {
    if (tournament.settings?.simulationMode) {
      return 'Simulation Mode';
    }
    return 'Auto-Progression Active';
  };

  const getStatusIcon = () => {
    if (tournament.settings?.simulationMode) {
      return '🎲';
    }
    return '⚡';
  };

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
      {getStatusIcon()} {getStatusText()}
      {tournament.status === 'live' && (
        <span className="ml-1 opacity-75">
          (Round {tournament.currentRound || 1}/{tournament.totalRounds || 4})
        </span>
      )}
    </div>
  );
}


