"use client";

import { useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Props = {
  tournamentId: string;
  onNotification: (message: string, type: 'success' | 'info') => void;
};

export default function TournamentNotifications({ tournamentId, onNotification }: Props) {
  const prevMatchStates = useRef<Record<string, string>>({});

  useEffect(() => {
    const matchesRef = collection(db, 'tournaments', tournamentId, 'matches');
    const q = query(matchesRef, orderBy('round', 'asc'));

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const matchId = change.doc.id;
        const data = change.doc.data() as any;
        const newStatus = data.status;
        const round = data.round || 1;

        if (change.type === 'modified') {
          const prevStatus = prevMatchStates.current[matchId];
          
          // Notify when match completes
          if (prevStatus && prevStatus !== 'completed' && newStatus === 'completed') {
            const winner = data.winner || 'Unknown';
            onNotification(`Round ${round} match completed! Winner: ${winner}`, 'success');
          }
          
          // Notify when match goes live
          if (prevStatus && prevStatus === 'pending' && newStatus === 'live') {
            onNotification(`Round ${round} match is now LIVE!`, 'info');
          }
        }

        // Update state tracking
        prevMatchStates.current[matchId] = newStatus;
      });
    });

    return () => unsub();
  }, [tournamentId, onNotification]);

  return null; // This component only handles side effects
}



