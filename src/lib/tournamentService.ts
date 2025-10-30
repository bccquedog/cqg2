import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// 🏆 Create a new tournament
export async function createTournament(data: any) {
  const tournamentsRef = collection(db, "tournaments");
  const newDoc = await addDoc(tournamentsRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return { id: newDoc.id, ...data };
}

// 📋 Get all tournaments
export async function getAllTournaments() {
  const snapshot = await getDocs(collection(db, "tournaments"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 📋 Get one tournament by ID
export async function getTournamentById(tournamentId: string) {
  const ref = doc(db, "tournaments", tournamentId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

// 🎮 Get matches in a tournament
export async function getTournamentMatches(tournamentId: string) {
  const matchesRef = collection(db, `tournaments/${tournamentId}/matches`);
  const snapshot = await getDocs(matchesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ✍️ Add or update a match
export async function saveMatch(
  tournamentId: string,
  matchId: string,
  data: any
) {
  const matchRef = doc(db, `tournaments/${tournamentId}/matches/${matchId}`);
  await setDoc(matchRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return { id: matchId, ...data };
}

// 🗑️ Delete a tournament
export async function deleteTournament(tournamentId: string) {
  const ref = doc(db, "tournaments", tournamentId);
  await deleteDoc(ref);
  return true;
}

// Legacy functions for backwards compatibility with existing components
export async function registerPlayer(tournamentId: string, playerId: string) {
  const tourneyRef = doc(db, "tournaments", tournamentId);
  const snapshot = await getDoc(tourneyRef);
  if (!snapshot.exists()) throw new Error("Tournament not found");
  
  const data = snapshot.data();
  if (data.status !== "setup") throw new Error("Registration closed");
  
  await updateDoc(tourneyRef, {
    players: [...(data.players || []), playerId]
  });
}

export async function checkInPlayer(tournamentId: string, playerId: string) {
  const tourneyRef = doc(db, "tournaments", tournamentId);
  const snapshot = await getDoc(tourneyRef);
  if (!snapshot.exists()) throw new Error("Tournament not found");
  
  const data = snapshot.data();
  if (data.status !== "setup") throw new Error("Check-in closed");
  
  await updateDoc(tourneyRef, {
    checkIns: [...(data.checkIns || []), playerId]
  });
}

export async function generateMatches(tournamentId: string) {
  const tourneyRef = doc(db, "tournaments", tournamentId);
  const snapshot = await getDoc(tourneyRef);
  if (!snapshot.exists()) throw new Error("Tournament not found");
  
  const data = snapshot.data();
  if (!data.checkIns || data.checkIns.length < 2) {
    throw new Error("Not enough players checked in");
  }
  
  const shuffled = [...data.checkIns].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < shuffled.length; i += 2) {
    const playerA = shuffled[i];
    const playerB = shuffled[i + 1] || null;
    
    await addDoc(collection(db, "tournaments", tournamentId, "matches"), {
      playerA,
      playerB,
      status: "pending",
      score: null,
      winner: null,
      round: 1,
      createdAt: serverTimestamp()
    });
  }
  
  await updateDoc(tourneyRef, { status: "live" });
}

export async function submitMatchResult(
  tournamentId: string,
  matchId: string,
  playerId: string,
  score: number
) {
  const matchRef = doc(db, "tournaments", tournamentId, "matches", matchId);
  const snapshot = await getDoc(matchRef);
  if (!snapshot.exists()) throw new Error("Match not found");
  
  const data = snapshot.data();
  if (data.status !== "pending") throw new Error("Match already resolved");
  if (![data.playerA, data.playerB].includes(playerId)) {
    throw new Error("Player not part of this match");
  }
  
  await updateDoc(matchRef, {
    [`reports.${playerId}`]: score
  });
}

export async function validateMatchResult(
  tournamentId: string,
  matchId: string,
  winnerId: string,
  finalScore: { [playerId: string]: number }
) {
  const matchRef = doc(db, "tournaments", tournamentId, "matches", matchId);
  await updateDoc(matchRef, {
    status: "completed",
    winner: winnerId,
    score: finalScore,
    validatedAt: serverTimestamp()
  });
}

export async function getMatches(tournamentId: string) {
  const matchesRef = collection(db, "tournaments", tournamentId, "matches");
  const snapshot = await getDocs(matchesRef);

  const matches: any[] = [];

  for (const docSnap of snapshot.docs) {
    const match: any = { id: docSnap.id, ...docSnap.data() };

    if (match.playerA) {
      const playerRef = doc(db, "players", match.playerA);
      const playerSnap = await getDoc(playerRef);
      if (playerSnap.exists()) {
        match.playerAData = { id: playerSnap.id, ...playerSnap.data() };
      }
    }

    if (match.playerB) {
      const playerRef = doc(db, "players", match.playerB);
      const playerSnap = await getDoc(playerRef);
      if (playerSnap.exists()) {
        match.playerBData = { id: playerSnap.id, ...playerSnap.data() };
      }
    }

    matches.push(match);
  }

  return matches;
}

export async function getTournamentWinner(tournamentId: string) {
  const tourneyRef = doc(db, "tournaments", tournamentId);
  const snapshot = await getDoc(tourneyRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  
  if (data.status !== "completed") return null;
  return data.winner || null;
}