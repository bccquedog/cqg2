"use client";

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

type Props = {
  tournamentId: string;
  matchId: string;
  status: string;
  startedAt?: any | null;
  submittedAt?: any | null;
  durationSeconds?: number | null;
  className?: string;
};

function toMs(ts: any | null | undefined): number | null {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (typeof ts === 'number') return ts;
  if (ts instanceof Date) return ts.getTime();
  return null;
}

export default function MatchTimer({ tournamentId, matchId, status, startedAt, submittedAt, durationSeconds, className }: Props) {
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // Initialize startedAt if match just went live and field missing
  useEffect(() => {
    if ((status === 'live' || status === 'Live') && !startedAt) {
      const ref = doc(db, 'tournaments', tournamentId, 'matches', matchId);
      updateDoc(ref, { startedAt: serverTimestamp() }).catch(() => {});
    }
  }, [status, startedAt, tournamentId, matchId]);

  // When completed and we have startedAt but no durationSeconds, compute and save
  useEffect(() => {
    if (status === 'completed' && startedAt && !durationSeconds) {
      const startMs = toMs(startedAt);
      const endMs = toMs(submittedAt) ?? Date.now();
      if (startMs && endMs && endMs > startMs) {
        const seconds = Math.round((endMs - startMs) / 1000);
        const ref = doc(db, 'tournaments', tournamentId, 'matches', matchId);
        updateDoc(ref, { durationSeconds: seconds }).catch(() => {});
      }
    }
  }, [status, startedAt, submittedAt, durationSeconds, tournamentId, matchId]);

  // Tick timer while live
  useEffect(() => {
    if (status === 'live' || status === 'Live') {
      const t = setInterval(() => setNowMs(Date.now()), 1000);
      return () => clearInterval(t);
    }
  }, [status]);

  const display = useMemo(() => {
    const startMs = toMs(startedAt);
    if (!startMs) return '⏱ 00:00';
    let totalSec = 0;
    if (status === 'completed' && durationSeconds) {
      totalSec = durationSeconds;
    } else if (status === 'live' || status === 'Live') {
      totalSec = Math.max(0, Math.round((nowMs - startMs) / 1000));
    } else {
      // pending
      totalSec = 0;
    }
    const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const ss = String(totalSec % 60).padStart(2, '0');
    return `⏱ ${mm}:${ss}`;
  }, [startedAt, durationSeconds, status, nowMs]);

  return (
    <span className={className || 'text-xs text-gray-600'}>{display}</span>
  );
}




