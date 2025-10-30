"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useTournamentContext } from "@/hooks/useTournamentContext";
import { useToastContext } from "@/contexts/ToastContext";

export default function TournamentJoinPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const { user } = useAuth();
  const { success, info, warning, error } = useToastContext();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTournament = async () => {
      try {
        const tournamentRef = doc(db, "tournaments", tournamentId);
        const tournamentSnap = await getDoc(tournamentRef);
        
        if (tournamentSnap.exists()) {
          setTournament({ id: tournamentSnap.id, ...tournamentSnap.data() });
        }
      } catch (error) {
        console.error("Error loading tournament:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTournament();
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading tournament...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Tournament not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-4">Join Tournament</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{tournament.name}</h2>
          <p className="text-gray-600 mb-4">{tournament.game}</p>
          <div className="flex space-x-4 text-sm text-gray-500">
            <span>Status: <span className="font-medium">{tournament.status}</span></span>
            <span>Max Players: <span className="font-medium">{tournament.maxPlayers || 16}</span></span>
            <span>Entry Fee: <span className="font-medium">${tournament.entryFee || 0}</span></span>
          </div>
        </div>

        {user ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ You're signed in!</h3>
            <p className="text-green-700 mb-4">
              You can now join this tournament. Click the button below to register.
            </p>
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              onClick={() => {
                // Placeholder; actual join logic elsewhere
                success("Tournament Created Successfully!");
                console.log("[toast] Tournament Created Successfully!");
              }}
            >
              Join Tournament
            </button>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">🏆 Tournament Auto-Join</h3>
            <p className="text-blue-700 mb-4">
              Sign up or sign in to automatically join this tournament! Your account will be created 
              and you'll be added to the tournament roster instantly.
            </p>
            <p className="text-sm text-blue-600">
              <strong>Note:</strong> This page is protected - you need to be signed in to access it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
