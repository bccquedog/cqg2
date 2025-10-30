"use client";

import { useState, useEffect } from "react";
import {
  createTournament,
  updateTournament,
  getTournament,
  listTournaments,
  deleteTournament,
  registerPlayerInTournament,
  registerClanInTournament,
  removeParticipantFromTournament,
  createLeague,
  updateLeague,
  getLeague,
  listLeagues,
  deleteLeague,
  registerPlayerInLeague,
  registerClanInLeague,
  removeParticipantFromLeague,
  submitMatchResult,
  verifyMatchResult,
  getTournamentMatches,
  removeMatchResult,
  disputeMatch,
  resolveDispute
} from "@/lib/firestoreEvents";
import { getProfile } from "@/lib/firestoreProfiles";
import { getPresence, PresenceData } from "@/lib/presence";
import { Tournament, League, TournamentPlayer, LeagueTeam, Match } from "@/types/events";
import { Profile } from "@/types/profile";

interface PlayerWithData extends TournamentPlayer {
  profile?: Profile;
  presence?: PresenceData;
}

interface TeamWithData extends LeagueTeam {
  profile?: Profile;
  presence?: PresenceData;
}

export default function EventsTestPage() {
  // Tournament state
  const [tournamentId, setTournamentId] = useState<string>("");
  const [tournamentName, setTournamentName] = useState<string>("");
  const [tournamentGame, setTournamentGame] = useState<string>("");
  const [tournamentType, setTournamentType] = useState<"solo" | "clan">("solo");
  const [tournamentSeason, setTournamentSeason] = useState<string>("");
  const [newPlayerInput, setNewPlayerInput] = useState<string>("");
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [playersWithData, setPlayersWithData] = useState<PlayerWithData[]>([]);

  // League state
  const [leagueId, setLeagueId] = useState<string>("");
  const [leagueName, setLeagueName] = useState<string>("");
  const [leagueGame, setLeagueGame] = useState<string>("");
  const [leagueSeason, setLeagueSeason] = useState<string>("");
  const [leagueStatus, setLeagueStatus] = useState<"draft" | "active" | "completed">("draft");
  const [leagueType, setLeagueType] = useState<"solo" | "clan">("solo");
  const [newTeamInput, setNewTeamInput] = useState<string>("");
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teamsWithData, setTeamsWithData] = useState<TeamWithData[]>([]);

  // Match submission state
  const [matchId, setMatchId] = useState<string>("");
  const [matchRound, setMatchRound] = useState<number>(1);
  const [matchPlayers, setMatchPlayers] = useState<string>("");
  const [matchScores, setMatchScores] = useState<string>("");
  const [matchWinner, setMatchWinner] = useState<string>("");
  const [matchStreamUrl, setMatchStreamUrl] = useState<string>("");
  const [tournamentMatches, setTournamentMatches] = useState<Match[]>([]);

  // Dispute management state
  const [disputeReason, setDisputeReason] = useState<string>("");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [adminId, setAdminId] = useState<string>("admin1"); // For testing purposes

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"tournaments" | "leagues">("tournaments");

  // Presence subscriptions cleanup
  const [presenceUnsubscribes, setPresenceUnsubscribes] = useState<(() => void)[]>([]);

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // Cleanup presence subscriptions
  useEffect(() => {
    return () => {
      presenceUnsubscribes.forEach(unsub => unsub());
    };
  }, [presenceUnsubscribes]);

  // Load player/team data when tournament/league changes
  useEffect(() => {
    if (currentTournament) {
      loadTournamentParticipantsData(currentTournament.participants, currentTournament.type);
      loadTournamentMatches();
    }
  }, [currentTournament]);

  useEffect(() => {
    if (currentLeague) {
      loadParticipantsData(currentLeague.participants, currentLeague.type);
    }
  }, [currentLeague]);

  const loadTournamentParticipantsData = async (participants: string[], type: "solo" | "clan") => {
    // Cleanup existing subscriptions
    presenceUnsubscribes.forEach(unsub => unsub());
    const newUnsubscribes: (() => void)[] = [];

    const participantsData: PlayerWithData[] = await Promise.all(
      participants.map(async (participantId) => {
        const participantData: PlayerWithData = { 
          userId: participantId, 
          joinedAt: Date.now() 
        };

        // Fetch profile or clan data based on type
        try {
          if (type === "solo") {
            const profile = await getProfile(participantId);
            if (profile) {
              participantData.profile = profile;
            }
          } else {
            // For clan tournaments, we could fetch clan data here
            // For now, just use the participantId as display name
            participantData.profile = {
              id: participantId,
              username: `Clan ${participantId}`,
              email: "",
              tier: "Gamer" as const,
              wins: 0,
              losses: 0,
              tournamentsWon: 0,
              leaguesWon: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
          }
        } catch (error) {
          console.error(`Error fetching data for ${participantId}:`, error);
        }

        // Subscribe to presence
        const unsubscribe = getPresence(participantId, (presence) => {
          setPlayersWithData(prev => 
            prev.map(p => 
              p.userId === participantId 
                ? { ...p, presence }
                : p
            )
          );
        });
        newUnsubscribes.push(unsubscribe);

        return participantData;
      })
    );

    setPlayersWithData(participantsData);
    setPresenceUnsubscribes(newUnsubscribes);
  };

  const loadParticipantsData = async (participants: string[], type: "solo" | "clan") => {
    // Cleanup existing subscriptions
    presenceUnsubscribes.forEach(unsub => unsub());
    const newUnsubscribes: (() => void)[] = [];

    const participantsData: TeamWithData[] = await Promise.all(
      participants.map(async (participantId) => {
        const participantData: TeamWithData = { 
          teamId: participantId, 
          joinedAt: Date.now() 
        };

        // Fetch profile or clan data based on type
        try {
          if (type === "solo") {
            const profile = await getProfile(participantId);
            if (profile) {
              participantData.profile = profile;
            }
          } else {
            // For clan leagues, we could fetch clan data here
            // For now, just use the participantId as display name
            participantData.profile = {
              id: participantId,
              username: `Clan ${participantId}`,
              email: "",
              tier: "Gamer" as const,
              wins: 0,
              losses: 0,
              tournamentsWon: 0,
              leaguesWon: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
          }
        } catch (error) {
          console.error(`Error fetching data for ${participantId}:`, error);
        }

        // Subscribe to presence
        const unsubscribe = getPresence(participantId, (presence) => {
          setTeamsWithData(prev => 
            prev.map(t => 
              t.teamId === participantId 
                ? { ...t, presence }
                : t
            )
          );
        });
        newUnsubscribes.push(unsubscribe);

        return participantData;
      })
    );

    setTeamsWithData(participantsData);
    setPresenceUnsubscribes(newUnsubscribes);
  };

  const loadTournamentMatches = async () => {
    if (!currentTournament) return;
    
    try {
      if (currentTournament.id) {
        const matches = await getTournamentMatches(currentTournament.id);
        setTournamentMatches(matches);
      }
    } catch (error) {
      console.error("Error loading matches:", error);
    }
  };

  // ========================
  // MATCH FUNCTIONS
  // ========================

  const handleSubmitMatch = async () => {
    if (!tournamentId.trim() || !matchId.trim() || !matchPlayers.trim() || !matchScores.trim() || !matchWinner.trim()) {
      showMessage("Please fill in all required match fields", true);
      return;
    }

    setIsLoading(true);
    try {
      // Parse players and scores
      const players = matchPlayers.split(',').map(p => p.trim());
      const scoresArray = matchScores.split(',').map(s => parseFloat(s.trim()));
      
      if (players.length !== scoresArray.length) {
        showMessage("Number of players must match number of scores", true);
        return;
      }

      const scores: { [userId: string]: number } = {};
      players.forEach((player, index) => {
        scores[player] = scoresArray[index];
      });

      await submitMatchResult(tournamentId, matchId, {
        round: matchRound,
        scores,
        winner: matchWinner,
        streamUrl: matchStreamUrl || undefined,
      });

      // Clear form
      setMatchId("");
      setMatchRound(1);
      setMatchPlayers("");
      setMatchScores("");
      setMatchWinner("");
      setMatchStreamUrl("");

      await loadTournamentMatches();
      showMessage("Match result submitted successfully!");
    } catch (error) {
      console.error("Error submitting match:", error);
      showMessage(error instanceof Error ? error.message : "Failed to submit match", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMatch = async (matchId: string) => {
    if (!tournamentId.trim()) {
      showMessage("No tournament selected", true);
      return;
    }

    setIsLoading(true);
    try {
      await verifyMatchResult(tournamentId, matchId);
      await loadTournamentMatches();
      showMessage("Match verified successfully!");
    } catch (error) {
      console.error("Error verifying match:", error);
      showMessage("Failed to verify match", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMatch = async (matchId: string) => {
    if (!tournamentId.trim()) {
      showMessage("No tournament selected", true);
      return;
    }

    if (!confirm("Are you sure you want to remove this match?")) {
      return;
    }

    setIsLoading(true);
    try {
      await removeMatchResult(tournamentId, matchId);
      await loadTournamentMatches();
      showMessage("Match removed successfully!");
    } catch (error) {
      console.error("Error removing match:", error);
      showMessage("Failed to remove match", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisputeMatch = async (matchId: string) => {
    if (!tournamentId.trim()) {
      showMessage("No tournament selected", true);
      return;
    }

    if (!disputeReason.trim()) {
      showMessage("Please enter a dispute reason", true);
      return;
    }
    
    try {
      setIsLoading(true);
      await disputeMatch(tournamentId, matchId, disputeReason.trim());
      showMessage("Match disputed successfully!");
      setDisputeReason("");
      await loadTournamentMatches();
    } catch (error) {
      console.error("Error disputing match:", error);
      showMessage("Failed to dispute match", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveDispute = async (matchId: string) => {
    if (!tournamentId.trim()) {
      showMessage("No tournament selected", true);
      return;
    }

    if (!resolutionNotes.trim()) {
      showMessage("Please enter resolution notes", true);
      return;
    }
    
    try {
      setIsLoading(true);
      await resolveDispute(tournamentId, matchId, adminId, resolutionNotes.trim());
      showMessage("Dispute resolved successfully!");
      setResolutionNotes("");
      await loadTournamentMatches();
    } catch (error) {
      console.error("Error resolving dispute:", error);
      showMessage("Failed to resolve dispute", true);
    } finally {
      setIsLoading(false);
    }
  };

  // ========================
  // TOURNAMENT FUNCTIONS
  // ========================

  const handleCreateTournament = async () => {
    if (!tournamentName.trim() || !tournamentGame.trim()) {
      showMessage("Please fill in Tournament Name and Game", true);
      return;
    }

    setIsLoading(true);
    try {
      const id = await createTournament({
        name: tournamentName,
        game: tournamentGame,
        season: tournamentSeason || "Season 1",
        type: tournamentType,
        participants: [],
        bracket: {},
      });
      setTournamentId(id);
      showMessage(`Tournament created with ID: ${id}`);
      await handleFetchTournament(id);
    } catch (error) {
      console.error("Error creating tournament:", error);
      showMessage("Failed to create tournament", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTournament = async () => {
    if (!tournamentId.trim()) {
      showMessage("Please enter a Tournament ID", true);
      return;
    }

    setIsLoading(true);
    try {
      const updateData: Partial<Tournament> = {};
      if (tournamentName.trim()) updateData.name = tournamentName;
      if (tournamentGame.trim()) updateData.game = tournamentGame;
      if (tournamentSeason.trim()) updateData.season = tournamentSeason;
      updateData.type = tournamentType;

      await updateTournament(tournamentId, updateData);
      showMessage("Tournament updated successfully!");
      await handleFetchTournament(tournamentId);
    } catch (error) {
      console.error("Error updating tournament:", error);
      showMessage("Failed to update tournament", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchTournament = async (id?: string) => {
    const targetId = id || tournamentId;
    if (!targetId.trim()) {
      showMessage("Please enter a Tournament ID", true);
      return;
    }

    setIsLoading(true);
    try {
      const tournament = await getTournament(targetId);
      setCurrentTournament(tournament);
      
      if (tournament) {
        setTournamentName(tournament.name);
        setTournamentGame(tournament.game);
        setTournamentSeason(tournament.season);
        setTournamentType(tournament.type);
        showMessage("Tournament fetched successfully!");
      } else {
        showMessage("Tournament not found", true);
      }
    } catch (error) {
      console.error("Error fetching tournament:", error);
      showMessage("Failed to fetch tournament", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleListTournaments = async () => {
    setIsLoading(true);
    try {
      const tournamentList = await listTournaments();
      setTournaments(tournamentList);
      showMessage(`Found ${tournamentList.length} tournaments`);
    } catch (error) {
      console.error("Error listing tournaments:", error);
      showMessage("Failed to list tournaments", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!tournamentId.trim() || !newPlayerInput.trim()) {
      showMessage("Please enter Tournament ID and Player ID", true);
      return;
    }

    setIsLoading(true);
    try {
      if (currentTournament?.type === "solo") {
        await registerPlayerInTournament(tournamentId, newPlayerInput);
      } else {
        await registerClanInTournament(tournamentId, newPlayerInput);
      }
      setNewPlayerInput("");
      await handleFetchTournament(tournamentId);
      showMessage("Player added successfully!");
    } catch (error) {
      console.error("Error adding player:", error);
      showMessage(error instanceof Error ? error.message : "Failed to add player", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePlayer = async (userId: string) => {
    if (!tournamentId.trim()) {
      showMessage("No tournament selected", true);
      return;
    }

    setIsLoading(true);
    try {
      await removeParticipantFromTournament(tournamentId, userId);
      await handleFetchTournament(tournamentId);
      showMessage("Player removed successfully!");
    } catch (error) {
      console.error("Error removing player:", error);
      showMessage("Failed to remove player", true);
    } finally {
      setIsLoading(false);
    }
  };

  // ========================
  // LEAGUE FUNCTIONS
  // ========================

  const handleCreateLeague = async () => {
    if (!leagueName.trim() || !leagueGame.trim()) {
      showMessage("Please fill in League Name and Game", true);
      return;
    }

    setIsLoading(true);
    try {
      const id = await createLeague({
        name: leagueName,
        season: leagueSeason || "Season 1",
        type: leagueType as "solo" | "clan",
        participants: [],
        stats: { matchesPlayed: 0, wins: 0, losses: 0 },
      });
      setLeagueId(id);
      showMessage(`League created with ID: ${id}`);
      await handleFetchLeague(id);
    } catch (error) {
      console.error("Error creating league:", error);
      showMessage("Failed to create league", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLeague = async () => {
    if (!leagueId.trim()) {
      showMessage("Please enter a League ID", true);
      return;
    }

    setIsLoading(true);
    try {
      const updateData: Partial<League> = {};
      if (leagueName.trim()) updateData.name = leagueName;
      if (leagueSeason.trim()) updateData.season = leagueSeason;
      updateData.type = leagueType;

      await updateLeague(leagueId, updateData);
      showMessage("League updated successfully!");
      await handleFetchLeague(leagueId);
    } catch (error) {
      console.error("Error updating league:", error);
      showMessage("Failed to update league", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchLeague = async (id?: string) => {
    const targetId = id || leagueId;
    if (!targetId.trim()) {
      showMessage("Please enter a League ID", true);
      return;
    }

    setIsLoading(true);
    try {
      const league = await getLeague(targetId);
      setCurrentLeague(league);
      
      if (league) {
        setLeagueName(league.name);
        setLeagueSeason(league.season);
        setLeagueType(league.type);
        showMessage("League fetched successfully!");
      } else {
        showMessage("League not found", true);
      }
    } catch (error) {
      console.error("Error fetching league:", error);
      showMessage("Failed to fetch league", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleListLeagues = async () => {
    setIsLoading(true);
    try {
      const leagueList = await listLeagues();
      setLeagues(leagueList);
      showMessage(`Found ${leagueList.length} leagues`);
    } catch (error) {
      console.error("Error listing leagues:", error);
      showMessage("Failed to list leagues", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeam = async () => {
    if (!leagueId.trim() || !newTeamInput.trim()) {
      showMessage("Please enter League ID and Team/User ID", true);
      return;
    }

    setIsLoading(true);
    try {
      if (currentLeague?.type === "solo") {
        await registerPlayerInLeague(leagueId, newTeamInput);
      } else {
        await registerClanInLeague(leagueId, newTeamInput);
      }
      setNewTeamInput("");
      await handleFetchLeague(leagueId);
      showMessage("Team added successfully!");
    } catch (error) {
      console.error("Error adding team:", error);
      showMessage(error instanceof Error ? error.message : "Failed to add team", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTeam = async (teamId: string) => {
    if (!leagueId.trim()) {
      showMessage("No league selected", true);
      return;
    }

    setIsLoading(true);
    try {
      await removeParticipantFromLeague(leagueId, teamId);
      await handleFetchLeague(leagueId);
      showMessage("Team removed successfully!");
    } catch (error) {
      console.error("Error removing team:", error);
      showMessage("Failed to remove team", true);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
      case "active":
        return "text-green-600 bg-green-100";
      case "testing":
      case "setup":
        return "text-yellow-600 bg-yellow-100";
      case "completed":
        return "text-blue-600 bg-blue-100";
      case "draft":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPresenceColor = (state: string) => {
    switch (state) {
      case "online":
        return "bg-green-500";
      case "idle":
        return "bg-yellow-500";
      case "in_match":
        return "bg-blue-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Elite":
        return "text-purple-600 bg-purple-100";
      case "King":
        return "text-red-600 bg-red-100";
      case "Mamba":
        return "text-blue-600 bg-blue-100";
      case "Gamer":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🏆 CQG Events System - Integrated Profiles & Presence
        </h1>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${message.includes("Failed") || message.includes("Please") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
            {message}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex mb-8 bg-white rounded-lg shadow-sm p-1">
          <button
            onClick={() => setActiveTab("tournaments")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === "tournaments" 
                ? "bg-blue-600 text-white" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🏆 Tournaments
          </button>
          <button
            onClick={() => setActiveTab("leagues")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === "leagues" 
                ? "bg-blue-600 text-white" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🏅 Leagues
          </button>
        </div>

        {/* Tournaments Tab */}
        {activeTab === "tournaments" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Tournament Management */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🏆 Tournament Management</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tournament ID</label>
                  <input
                    type="text"
                    value={tournamentId}
                    onChange={(e) => setTournamentId(e.target.value)}
                    placeholder="Enter tournament ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder="Tournament name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Game *</label>
                  <input
                    type="text"
                    value={tournamentGame}
                    onChange={(e) => setTournamentGame(e.target.value)}
                    placeholder="Game name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={tournamentType}
                      onChange={(e) => setTournamentType(e.target.value as "solo" | "clan")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="solo">Solo Tournament</option>
                      <option value="clan">Clan Tournament</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Season</label>
                    <input
                      type="text"
                      value={tournamentSeason}
                      onChange={(e) => setTournamentSeason(e.target.value)}
                      placeholder="e.g., Season 1, 2025"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCreateTournament}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={handleUpdateTournament}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleFetchTournament()}
                    disabled={isLoading}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-300 transition-colors"
                  >
                    Fetch
                  </button>
                  <button
                    onClick={handleListTournaments}
                    disabled={isLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
                  >
                    List All
                  </button>
                </div>

                {/* Add Player Section */}
                {currentTournament && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium text-gray-900 mb-3">Add Player</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPlayerInput}
                        onChange={(e) => setNewPlayerInput(e.target.value)}
                        placeholder="Enter player/user ID"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleAddPlayer}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Tournament List */}
                {tournaments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-3">All Tournaments ({tournaments.length})</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {tournaments.map((tournament) => (
                        <div
                          key={tournament.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            if (tournament.id) {
                              setTournamentId(tournament.id);
                              handleFetchTournament(tournament.id);
                            }
                          }}
                        >
                          <span className="font-medium">{tournament.name}</span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {tournament.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tournament Players */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">👥 Tournament Players</h2>
              
              {currentTournament ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Participants: {playersWithData.length}</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {currentTournament.type}
                    </span>
                  </div>

                  {playersWithData.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {playersWithData.map((player) => (
                        <div key={player.userId} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-3 h-3 rounded-full ${getPresenceColor(player.presence?.state || "offline")}`}></div>
                                <Link href={`/profile/${player.userId}`} className="font-medium text-blue-600 hover:underline">
                                  {player.profile?.username || player.userId}
                                </Link>
                                {player.profile?.tier && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(player.profile.tier)}`}>
                                    {player.profile.tier}
                                  </span>
                                )}
                              </div>
                              
                              <div className="space-y-1 text-sm text-gray-600">
                                <div>Status: <span className="font-medium">{player.presence?.state || "offline"}</span></div>
                                <div>Joined: {formatTimestamp(player.joinedAt)}</div>
                                {player.profile && (
                                  <div>Record: {player.profile.wins}W - {player.profile.losses}L</div>
                                )}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleRemovePlayer(player.userId)}
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No players yet. Add players using the form above.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Select a tournament to view players.
                </div>
              )}
            </div>

            {/* Tournament Data */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Tournament Data</h2>
              
              {currentTournament ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Name:</span>
                        <p className="text-gray-900">{currentTournament.name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Game:</span>
                        <p className="text-gray-900">{currentTournament.game}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <p className="text-gray-900">{currentTournament.type}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Created:</span>
                        <p className="text-gray-900">{currentTournament.createdAt.toDate().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Raw JSON Data</h3>
                    <pre className="bg-gray-100 rounded-md p-4 text-xs overflow-x-auto max-h-64">
                      {JSON.stringify(currentTournament, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No tournament data. Create or fetch a tournament to see details.
                </div>
              )}
            </div>

            {/* Dispute Management */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">⚖️ Dispute Management</h2>
              
              {currentTournament ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Admin ID</label>
                      <input
                        type="text"
                        value={adminId}
                        onChange={(e) => setAdminId(e.target.value)}
                        placeholder="Enter admin ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dispute Reason</label>
                      <input
                        type="text"
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="Enter reason for dispute"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Notes</label>
                      <input
                        type="text"
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Enter resolution notes"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>• Use <strong>Dispute Reason</strong> to flag a match as disputed</p>
                    <p>• Use <strong>Resolution Notes</strong> to resolve disputes (admin only)</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Select a tournament to manage disputes.
                </div>
              )}
            </div>

            {/* Match Submission */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">⚔️ Match Submission</h2>
              
              {currentTournament ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Match ID *</label>
                    <input
                      type="text"
                      value={matchId}
                      onChange={(e) => setMatchId(e.target.value)}
                      placeholder="Enter unique match ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Round</label>
                    <input
                      type="number"
                      value={matchRound}
                      onChange={(e) => setMatchRound(parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Players *</label>
                    <input
                      type="text"
                      value={matchPlayers}
                      onChange={(e) => setMatchPlayers(e.target.value)}
                      placeholder="user1, user2 (comma-separated)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scores *</label>
                    <input
                      type="text"
                      value={matchScores}
                      onChange={(e) => setMatchScores(e.target.value)}
                      placeholder="100, 85 (comma-separated)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Winner *</label>
                    <input
                      type="text"
                      value={matchWinner}
                      onChange={(e) => setMatchWinner(e.target.value)}
                      placeholder="Enter winner user ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stream URL</label>
                    <input
                      type="url"
                      value={matchStreamUrl}
                      onChange={(e) => setMatchStreamUrl(e.target.value)}
                      placeholder="https://twitch.tv/stream (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleSubmitMatch}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                  >
                    Submit Match Result
                  </button>

                  {/* Tournament Matches */}
                  {tournamentMatches.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-medium text-gray-900 mb-3">Tournament Matches ({tournamentMatches.length})</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {tournamentMatches.map((match) => (
                          <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-gray-900">{match.id}</span>
                                  <span className="text-sm text-gray-600">Round {match.round}</span>
                                  {match.verified ? (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                                      Verified
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium text-yellow-600 bg-yellow-100">
                                      Pending
                                    </span>
                                  )}
                                  {match.disputed && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                                      ⚠️ Disputed
                                    </span>
                                  )}
                                  {match.resolved && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                                      ✅ Resolved
                                    </span>
                                  )}
                                </div>
                                
                                <div className="space-y-1 text-sm text-gray-600">
                                  <div>
                                    <span className="font-medium">Winner:</span> 
                                    {match.winner ? (
                                      <Link href={`/profile/${match.winner}`} className="text-blue-600 hover:underline ml-1">
                                        {match.winner}
                                      </Link>
                                    ) : (
                                      <span className="ml-1">TBD</span>
                                    )}
                                  </div>
                                  <div>
                                    <span className="font-medium">Players:</span> 
                                    <span className="ml-1">
                                      {match.players.map((playerId: string, index: number) => (
                                        <span key={playerId}>
                                          <Link href={`/profile/${playerId}`} className="text-blue-600 hover:underline">
                                            {playerId}
                                          </Link>
                                          {index < match.players.length - 1 && ", "}
                                        </span>
                                      ))}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Scores:</span> 
                                    <span className="ml-1">
                                      {Object.entries(match.scores).map(([player, score], index) => (
                                        <span key={player}>
                                          <Link href={`/profile/${player}`} className="text-blue-600 hover:underline">
                                            {player}
                                          </Link>
                                          : {score}
                                          {index < Object.entries(match.scores).length - 1 && ", "}
                                        </span>
                                      ))}
                                    </span>
                                  </div>
                                  {match.streamUrl && (
                                    <div>
                                      <span className="font-medium">Stream:</span> 
                                      <a href={match.streamUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                        View
                                      </a>
                                    </div>
                                  )}
                                  {match.submittedAt && (
                                    <div>
                                      <span className="font-medium">Submitted:</span> {formatTimestamp(match.submittedAt)}
                                    </div>
                                  )}
                                  {match.disputed && match.disputeReason && (
                                    <div>
                                      <span className="font-medium text-red-600">Dispute Reason:</span> {match.disputeReason}
                                    </div>
                                  )}
                                  {match.resolved && match.resolutionNotes && (
                                    <div>
                                      <span className="font-medium text-blue-600">Resolution:</span> {match.resolutionNotes}
                                    </div>
                                  )}
                                  {match.resolved && match.resolvedBy && (
                                    <div>
                                      <span className="font-medium text-blue-600">Resolved by:</span> {match.resolvedBy}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-2">
                                {!match.verified && (
                                  <button
                                    onClick={() => handleVerifyMatch(match.id)}
                                    disabled={isLoading}
                                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                                  >
                                    Verify
                                  </button>
                                )}
                                {!match.disputed && !match.resolved && (
                                  <button
                                    onClick={() => handleDisputeMatch(match.id)}
                                    disabled={isLoading || !disputeReason.trim()}
                                    className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                                  >
                                    Dispute
                                  </button>
                                )}
                                {match.disputed && !match.resolved && (
                                  <button
                                    onClick={() => handleResolveDispute(match.id)}
                                    disabled={isLoading || !resolutionNotes.trim()}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    Resolve
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveMatch(match.id)}
                                  disabled={isLoading}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Select a tournament to submit match results.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leagues Tab */}
        {activeTab === "leagues" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* League Management */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🏅 League Management</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">League ID</label>
                  <input
                    type="text"
                    value={leagueId}
                    onChange={(e) => setLeagueId(e.target.value)}
                    placeholder="Enter league ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    placeholder="League name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Game *</label>
                  <input
                    type="text"
                    value={leagueGame}
                    onChange={(e) => setLeagueGame(e.target.value)}
                    placeholder="Game name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Season</label>
                    <input
                      type="text"
                      value={leagueSeason}
                      onChange={(e) => setLeagueSeason(e.target.value)}
                      placeholder="Season name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={leagueStatus}
                      onChange={(e) => setLeagueStatus(e.target.value as "draft" | "active" | "completed")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCreateLeague}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={handleUpdateLeague}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleFetchLeague()}
                    disabled={isLoading}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-300 transition-colors"
                  >
                    Fetch
                  </button>
                  <button
                    onClick={handleListLeagues}
                    disabled={isLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
                  >
                    List All
                  </button>
                </div>

                {/* Add Team Section */}
                {currentLeague && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium text-gray-900 mb-3">Add Team/User</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTeamInput}
                        onChange={(e) => setNewTeamInput(e.target.value)}
                        placeholder="Enter team/user ID"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleAddTeam}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* League List */}
                {leagues.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-3">All Leagues ({leagues.length})</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {leagues.map((league) => (
                        <div
                          key={league.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            if (league.id) {
                              setLeagueId(league.id);
                              handleFetchLeague(league.id);
                            }
                          }}
                        >
                          <span className="font-medium">{league.name}</span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {league.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* League Teams */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">👥 League Teams</h2>
              
              {currentLeague ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Teams: {teamsWithData.length}</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {currentLeague.type}
                    </span>
                  </div>

                  {teamsWithData.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {teamsWithData.map((team) => (
                        <div key={team.teamId} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-3 h-3 rounded-full ${getPresenceColor(team.presence?.state || "offline")}`}></div>
                                <span className="font-medium text-gray-900">
                                  {team.profile?.username || team.teamId}
                                </span>
                                {team.profile?.tier && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(team.profile.tier)}`}>
                                    {team.profile.tier}
                                  </span>
                                )}
                              </div>
                              
                              <div className="space-y-1 text-sm text-gray-600">
                                <div>Status: <span className="font-medium">{team.presence?.state || "offline"}</span></div>
                                <div>Joined: {formatTimestamp(team.joinedAt)}</div>
                                {team.profile && (
                                  <div>Record: {team.profile.wins}W - {team.profile.losses}L</div>
                                )}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleRemoveTeam(team.teamId)}
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No teams yet. Add teams using the form above.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Select a league to view teams.
                </div>
              )}
            </div>

            {/* League Data */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 League Data</h2>
              
              {currentLeague ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Name:</span>
                        <p className="text-gray-900">{currentLeague.name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <p className="text-gray-900">{currentLeague.type}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Season:</span>
                        <p className="text-gray-900">{currentLeague.season}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Participants:</span>
                        <p className="text-gray-900">{currentLeague.participants.length}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Matches Played:</span>
                        <p className="text-gray-900">{currentLeague.stats.matchesPlayed}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Created:</span>
                        <p className="text-gray-900">{currentLeague.createdAt.toDate().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Raw JSON Data</h3>
                    <pre className="bg-gray-100 rounded-md p-4 text-xs overflow-x-auto max-h-64">
                      {JSON.stringify(currentLeague, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No league data. Create or fetch a league to see details.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
              <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-900">Processing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}