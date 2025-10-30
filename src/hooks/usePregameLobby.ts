import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Tournament {
  id: string;
  lobbyEnabled: boolean;
  lobbySettings: {
    showMusic: boolean;
    showPoll: boolean;
    showClips: boolean;
    showCountdown: boolean;
    musicUrl?: string;
    pollQuestion?: string;
    pollOptions?: string[];
    featuredClips?: string[];
  };
}

export function usePregameLobby(tournamentId: string) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLobbyVisible, setIsLobbyVisible] = useState(false);

  // Load tournament lobby settings
  useEffect(() => {
    if (!tournamentId) return;

    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const unsubscribe = onSnapshot(tournamentRef, (doc) => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() } as Tournament;
        setTournament(data);
        setIsLobbyVisible(data.lobbyEnabled || false);
      }
    });

    return () => unsubscribe();
  }, [tournamentId]);

  const toggleLobby = async (enabled: boolean) => {
    if (!tournamentId) return;

    try {
      await updateDoc(doc(db, 'tournaments', tournamentId), {
        lobbyEnabled: enabled,
        updatedAt: new Date()
      });
      setIsLobbyVisible(enabled);
    } catch (error) {
      console.error('Error toggling lobby:', error);
    }
  };

  const updateLobbySettings = async (settings: Partial<Tournament['lobbySettings']>) => {
    if (!tournamentId) return;

    try {
      await updateDoc(doc(db, 'tournaments', tournamentId), {
        'lobbySettings': {
          ...tournament?.lobbySettings,
          ...settings
        },
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating lobby settings:', error);
    }
  };

  return {
    tournament,
    isLobbyVisible,
    toggleLobby,
    updateLobbySettings
  };
}


