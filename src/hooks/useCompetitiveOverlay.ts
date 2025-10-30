import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Tournament {
  id: string;
  showOverlay: boolean;
  currentMatchId?: string;
}

export function useCompetitiveOverlay(tournamentId: string) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  // Load tournament overlay settings
  useEffect(() => {
    if (!tournamentId) return;

    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const unsubscribe = onSnapshot(tournamentRef, (doc) => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() } as Tournament;
        setTournament(data);
        setIsOverlayVisible(data.showOverlay || false);
      }
    });

    return () => unsubscribe();
  }, [tournamentId]);

  const toggleOverlay = async (visible: boolean) => {
    if (!tournamentId) return;

    try {
      await updateDoc(doc(db, 'tournaments', tournamentId), {
        showOverlay: visible,
        updatedAt: new Date()
      });
      setIsOverlayVisible(visible);
    } catch (error) {
      console.error('Error toggling overlay:', error);
    }
  };

  const setCurrentMatch = async (matchId: string) => {
    if (!tournamentId) return;

    try {
      await updateDoc(doc(db, 'tournaments', tournamentId), {
        currentMatchId: matchId,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error setting current match:', error);
    }
  };

  return {
    tournament,
    isOverlayVisible,
    toggleOverlay,
    setCurrentMatch
  };
}


