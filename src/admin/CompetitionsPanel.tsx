"use client";

import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, Heart, ChevronDown, ChevronRight, Trophy } from "lucide-react";
import { toast } from "sonner";
import BracketPanel from "./BracketPanel";

// Types
interface Competition {
  id: string;
  name: string;
  game: string;
  type: "solo" | "clan";
  season: string;
  participants: string[];
  buyIn: {
    enabled: boolean;
    amount: number;
    currency: string;
  };
  membershipRules: {
    requiredFeatures: string[];
    hostRequired: string[];
  };
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

interface CompetitionFormData {
  name: string;
  game: string;
  type: "solo" | "clan";
  season: string;
  buyInEnabled: boolean;
  buyInAmount: number;
  buyInCurrency: string;
  joinRequirements: string[];
  hostRequirements: string[];
  createdBy: string;
}

interface HealthIssue {
  id: string;
  name: string;
  collection: "tournaments" | "leagues";
  warnings: number;
  results: string[];
}

// Available games
const GAMES = [
  "NBA2K",
  "Madden",
  "COD",
  "Apex",
  "Battlefield",
  "FIFA",
  "Rocket League",
  "Valorant",
  "CS2",
  "League of Legends"
];

// Available features for membership rules
const AVAILABLE_FEATURES = [
  "standardLeagues",
  "premiumLeagues", 
  "standardTournaments",
  "premiumTournaments",
  "1TournamentRequest",
  "2TournamentRequests",
  "creatorTools",
  "prioritySupport",
  "canHostLeague",
  "canHostTournament",
  "allFeatures"
];

const CURRENCIES = ["usd", "eur", "gbp", "cad"];

export default function CompetitionsPanel() {
  const [tournaments, setTournaments] = useState<Competition[]>([]);
  const [leagues, setLeagues] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tournaments" | "leagues" | "health" | "bracket">("tournaments");
  const [selectedCompetitionForBracket, setSelectedCompetitionForBracket] = useState<string | null>(null);
  const [healthIssues, setHealthIssues] = useState<HealthIssue[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [healthLoading, setHealthLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "issues" | "tournaments" | "leagues">("all");

  const [formData, setFormData] = useState<CompetitionFormData>({
    name: "",
    game: "",
    type: "solo",
    season: "",
    buyInEnabled: false,
    buyInAmount: 0,
    buyInCurrency: "usd",
    joinRequirements: [],
    hostRequirements: [],
    createdBy: ""
  });

  // Fetch competitions
  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      
      // Fetch tournaments
      const tournamentsSnapshot = await getDocs(collection(db, "tournaments"));
      const tournamentsData = tournamentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Competition[];
      setTournaments(tournamentsData);

      // Fetch leagues
      const leaguesSnapshot = await getDocs(collection(db, "leagues"));
      const leaguesData = leaguesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Competition[];
      setLeagues(leaguesData);
    } catch (error) {
      console.error("Error fetching competitions:", error);
      toast.error("Failed to fetch competitions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    if (activeTab === "health") {
      validateAllCompetitions();
    }
  }, [activeTab]);

  // Toggle expanded row
  const toggleExpandedRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Handle form input changes
  const handleInputChange = (field: keyof CompetitionFormData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle feature selection
  const handleFeatureToggle = (feature: string, type: "join" | "host") => {
    const field = type === "join" ? "joinRequirements" : "hostRequirements";
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(feature)
        ? prev[field].filter(f => f !== feature)
        : [...prev[field], feature]
    }));
  };

  // Handle edit
  const handleEdit = (competition: Competition) => {
    setEditingCompetition(competition);
    setFormData({
      name: competition.name,
      game: competition.game,
      type: competition.type,
      season: competition.season,
      buyInEnabled: competition.buyIn?.enabled || false,
      buyInAmount: competition.buyIn?.amount || 0,
      buyInCurrency: competition.buyIn?.currency || "usd",
      joinRequirements: competition.membershipRules?.requiredFeatures || [],
      hostRequirements: competition.membershipRules?.hostRequired || [],
      createdBy: competition.createdBy || ""
    });
    setIsEditModalOpen(true);
  };

  // Handle add new
  const handleAddNew = (type: "tournaments" | "leagues") => {
    setEditingCompetition(null);
    setFormData({
      name: "",
      game: "",
      type: type === "tournaments" ? "solo" : "solo",
      season: new Date().getFullYear().toString(),
      buyInEnabled: false,
      buyInAmount: 0,
      buyInCurrency: "usd",
      joinRequirements: type === "tournaments" ? ["standardTournaments"] : ["standardLeagues"],
      hostRequirements: [],
      createdBy: ""
    });
    setIsEditModalOpen(true);
  };

  // Handle save
  const handleSave = async () => {
    try {
      // Validation
      if (!formData.name.trim()) {
        toast.error("Name is required");
        return;
      }
      if (!formData.game) {
        toast.error("Game is required");
        return;
      }
      if (!formData.season.trim()) {
        toast.error("Season is required");
        return;
      }
      if (formData.buyInEnabled && formData.buyInAmount <= 0) {
        toast.error("Buy-in amount must be greater than 0 when enabled");
        return;
      }
      if (!formData.createdBy.trim()) {
        toast.error("Created By (User ID) is required");
        return;
      }

      const collectionName = activeTab;
      const competitionData = {
        name: formData.name.trim(),
        game: formData.game,
        type: formData.type,
        season: formData.season.trim(),
        participants: editingCompetition?.participants || [],
        buyIn: {
          enabled: formData.buyInEnabled,
          amount: formData.buyInAmount,
          currency: formData.buyInCurrency
        },
        membershipRules: {
          requiredFeatures: formData.joinRequirements.length > 0 ? formData.joinRequirements : 
            (activeTab === "tournaments" ? ["standardTournaments"] : ["standardLeagues"]),
          hostRequired: formData.hostRequirements
        },
        createdBy: formData.createdBy.trim(),
        createdAt: editingCompetition?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingCompetition) {
        // Update existing
        await updateDoc(doc(db, collectionName, editingCompetition.id), competitionData);
        toast.success(`${activeTab === "tournaments" ? "Tournament" : "League"} updated successfully`);
      } else {
        // Create new
        await addDoc(collection(db, collectionName), competitionData);
        toast.success(`${activeTab === "tournaments" ? "Tournament" : "League"} created successfully`);
      }

      setIsEditModalOpen(false);
      fetchCompetitions();
    } catch (error) {
      console.error("Error saving competition:", error);
      toast.error("Failed to save competition");
    }
  };

  // Handle delete
  const handleDelete = async (id: string, type: "tournaments" | "leagues") => {
    try {
      await deleteDoc(doc(db, type, id));
      toast.success(`${type === "tournaments" ? "Tournament" : "League"} deleted successfully`);
      setDeleteConfirmId(null);
      fetchCompetitions();
    } catch (error) {
      console.error("Error deleting competition:", error);
      toast.error("Failed to delete competition");
    }
  };

  // Helper function to validate host
  const validateHost = (data: Record<string, unknown>): string => {
    const membershipRules = data.membershipRules as Record<string, unknown> | undefined;
    if (!data.createdBy || !membershipRules?.hostRequired || !Array.isArray(membershipRules.hostRequired) || membershipRules.hostRequired.length === 0) {
      return "✅ No host requirements";
    }

    // This is a simplified version - in real implementation, we'd need to fetch user data
    // For now, we'll return a placeholder that indicates host validation is needed
    return "⚠️ Host validation requires user data fetch";
  };

  // Helper function to validate participants
  const validateParticipants = (data: Record<string, unknown>): string[] => {
    const membershipRules = data.membershipRules as Record<string, unknown> | undefined;
    if (!data.participants || !membershipRules?.requiredFeatures || !Array.isArray(membershipRules.requiredFeatures) || membershipRules.requiredFeatures.length === 0) {
      return ["✅ No participant requirements"];
    }

    // This is a simplified version - in real implementation, we'd need to fetch user data
    // For now, we'll return a placeholder that indicates participant validation is needed
    return ["⚠️ Participant validation requires user data fetch"];
  };

  // Validate all competitions
  const validateAllCompetitions = useCallback(async () => {
    try {
      setHealthLoading(true);
      const membershipsSnapshot = await getDocs(collection(db, "memberships"));
      const memberships: Record<string, Record<string, unknown>> = {};
      membershipsSnapshot.forEach(m => memberships[m.id] = m.data());

      const issues: HealthIssue[] = [];

      // Check tournaments + leagues
      const collections = ["tournaments", "leagues"] as const;
      for (const col of collections) {
        const snapshot = await getDocs(collection(db, col));
        snapshot.forEach(doc => {
          const data = doc.data();
          let warnings = 0;
          const results: string[] = [];

          // Buy-In check
          if (data.buyIn?.enabled && (!data.buyIn.amount || data.buyIn.amount <= 0)) {
            results.push("⚠️ Buy-In enabled but invalid amount");
            warnings++;
          } else if (data.buyIn?.enabled) {
            results.push(`💰 Buy-In: $${data.buyIn.amount} (${data.buyIn.currency})`);
          } else {
            results.push("💰 Free Entry");
          }

          // Host check
          if (data.createdBy) {
            results.push(validateHost(data));
          }

          // Participant check
          if (data.participants) {
            results.push(...validateParticipants(data));
          }

          if (warnings > 0 || results.some(r => r.includes("❌") || r.includes("⚠️"))) {
            issues.push({
              id: doc.id,
              name: data.name as string,
              collection: col,
              warnings,
              results
            });
          }
        });
      }

      setHealthIssues(issues);
    } catch (error) {
      console.error("Error validating all competitions:", error);
      toast.error("Failed to validate competitions");
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Validate competition
  const validateCompetition = async (id: string, collectionName: "tournaments" | "leagues") => {
    try {
      const docSnap = await getDocs(collection(db, collectionName));
      const competitionDoc = docSnap.docs.find(d => d.id === id);
      
      if (!competitionDoc) {
        toast.error(`Competition ${id} not found`);
        return;
      }

      const data = competitionDoc.data();
      const membershipsSnapshot = await getDocs(collection(db, "memberships"));
      const memberships: Record<string, Record<string, unknown>> = {};
      membershipsSnapshot.forEach(m => memberships[m.id] = m.data());

      let warnings = 0;
      const results: string[] = [];

      // Buy-In check
      if (data.buyIn?.enabled && (!data.buyIn.amount || data.buyIn.amount <= 0)) {
        results.push("⚠️ Buy-In enabled but invalid amount");
        warnings++;
      } else if (data.buyIn?.enabled) {
        results.push(`💰 Buy-In: $${data.buyIn.amount} (${data.buyIn.currency})`);
      } else {
        results.push("💰 Free Entry");
      }

      // Host validation
      if (data.createdBy && data.membershipRules?.hostRequired?.length) {
        const hostSnapshot = await getDocs(collection(db, "users"));
        const hostDoc = hostSnapshot.docs.find(d => d.id === data.createdBy);
        
        if (!hostDoc) {
          results.push(`⚠️ Host ${data.createdBy} not found in /users`);
          warnings++;
        } else {
          const host = hostDoc.data() as Record<string, unknown>;
          const tierId = (host.membership as Record<string, unknown>)?.tierId as string || "none";
          const tier = memberships[tierId];
          if (!tier) {
            results.push(`⚠️ Host assigned to invalid tier: ${tierId}`);
            warnings++;
          } else {
            const tierFeatures = tier.features as string[] || [];
            const canHost = tierFeatures.includes("allFeatures") ||
                            data.membershipRules.hostRequired.some((f: string) => tierFeatures.includes(f));
            if (canHost) {
              results.push(`✅ Host ${data.createdBy} (${tier.name as string}) passes host requirement`);
            } else {
              results.push(`❌ Host ${data.createdBy} (${tier.name as string}) does NOT meet host requirement`);
              warnings++;
            }
          }
        }
      }

      // Participant validation
      if (data.participants && data.membershipRules?.requiredFeatures?.length) {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersMap: Record<string, Record<string, unknown>> = {};
        usersSnapshot.forEach(u => usersMap[u.id] = u.data());

        for (const pid of data.participants) {
          if (!usersMap[pid]) {
            results.push(`⚠️ Participant ${pid} not found in /users`);
            warnings++;
            continue;
          }
          const user = usersMap[pid];
          const tierId = (user.membership as Record<string, unknown>)?.tierId as string || "none";
          const tier = memberships[tierId];
          if (!tier) {
            results.push(`⚠️ ${pid} assigned to invalid tier: ${tierId}`);
            warnings++;
          } else {
            const tierFeatures = tier.features as string[] || [];
            const hasAccess = tierFeatures.includes("allFeatures") ||
                              data.membershipRules.requiredFeatures.some((f: string) => tierFeatures.includes(f));
            if (hasAccess) {
              results.push(`✅ ${pid} (${tier.name as string}) passes join requirement`);
            } else {
              results.push(`❌ ${pid} (${tier.name as string}) does NOT meet join requirements`);
              warnings++;
            }
          }
        }
      }

      // Show results in modal
      const resultText = `Validation Results for ${data.name}:\n\n${results.join("\n")}\n\n📌 Warnings: ${warnings}`;
      alert(resultText);
      
    } catch (error) {
      console.error("Error validating competition:", error);
      toast.error("Failed to validate competition");
    }
  };

  // Format buy-in display
  const formatBuyIn = (buyIn: Competition["buyIn"]) => {
    if (!buyIn?.enabled) return "Free Entry";
    return `$${buyIn.amount} ${buyIn.currency.toUpperCase()}`;
  };

  // Format membership rules
  const formatMembershipRules = (rules: Competition["membershipRules"]) => {
    if (!rules) return "None";
    const join = rules.requiredFeatures?.length ? rules.requiredFeatures.join(", ") : "None";
    const host = rules.hostRequired?.length ? rules.hostRequired.join(", ") : "None";
    return `Join: ${join} | Host: ${host}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Render health table
  const renderHealthTable = () => {
    // Apply filter to health issues
    const filteredIssues = healthIssues.filter(issue => {
      if (filter === "issues") return issue.warnings > 0;
      if (filter === "tournaments") return issue.collection === "tournaments";
      if (filter === "leagues") return issue.collection === "leagues";
      return true; // "all"
    });

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Competition Health</h3>
          <Button 
            onClick={validateAllCompetitions} 
            disabled={healthLoading}
            className="flex items-center gap-2"
          >
            <Heart className="h-4 w-4" />
            {healthLoading ? "Validating..." : "Refresh Health Check"}
          </Button>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({healthIssues.length})
          </Button>
          <Button
            variant={filter === "issues" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("issues")}
          >
            Only Issues ({healthIssues.filter(i => i.warnings > 0).length})
          </Button>
          <Button
            variant={filter === "tournaments" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("tournaments")}
          >
            Tournaments ({healthIssues.filter(i => i.collection === "tournaments").length})
          </Button>
          <Button
            variant={filter === "leagues" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("leagues")}
          >
            Leagues ({healthIssues.filter(i => i.collection === "leagues").length})
          </Button>
        </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Collection</TableHead>
                <TableHead>Warnings</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.map((issue) => (
                <React.Fragment key={issue.id}>
                  <TableRow>
                    <TableCell className="font-medium">{issue.name}</TableCell>
                    <TableCell>
                      <Badge variant={issue.collection === "tournaments" ? "default" : "secondary"}>
                        {issue.collection}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={issue.warnings > 0 ? "destructive" : "default"}>
                        {issue.warnings > 0 ? `${issue.warnings} warnings` : "No issues"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpandedRow(issue.id)}
                        className="flex items-center gap-1"
                      >
                        {expandedRows.has(issue.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        {expandedRows.has(issue.id) ? "Hide" : "Show"} Details
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(issue.id) && (
                    <TableRow>
                      <TableCell colSpan={4} className="bg-muted/50">
                        <div className="p-4 space-y-2">
                          <h4 className="font-semibold text-sm">Validation Results:</h4>
                          <div className="space-y-1">
                            {issue.results.map((result, index) => (
                              <div key={index} className="text-sm font-mono">
                                {result}
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredIssues.length === 0 && !healthLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Competitions Healthy!</h3>
            <p className="text-muted-foreground">
              No validation issues found in tournaments or leagues.
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    );
  };

  // Render data table
  const renderDataTable = (competitions: Competition[], type: "tournaments" | "leagues") => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold capitalize">{type}</h3>
        <Button onClick={() => handleAddNew(type)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add {type === "tournaments" ? "Tournament" : "League"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Game</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Buy-In</TableHead>
                <TableHead>Membership Rules</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Validate</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitions.map((competition) => (
                <TableRow key={competition.id}>
                  <TableCell className="font-medium">{competition.name}</TableCell>
                  <TableCell>{competition.game}</TableCell>
                  <TableCell>
                    <Badge variant={competition.type === "solo" ? "default" : "secondary"}>
                      {competition.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={competition.buyIn?.enabled ? "destructive" : "outline"}>
                      {formatBuyIn(competition.buyIn)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={formatMembershipRules(competition.membershipRules)}>
                    {formatMembershipRules(competition.membershipRules)}
                  </TableCell>
                  <TableCell>{competition.createdBy}</TableCell>
                  <TableCell>{formatDate(competition.createdAt)}</TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => validateCompetition(competition.id, type)}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Validate
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(competition)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmId(competition.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading competitions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Competitions Management</h2>
        <div className="text-sm text-muted-foreground">
          Manage tournaments and leagues with membership rules and buy-ins
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "tournaments" | "leagues" | "health" | "bracket")}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tournaments">Tournaments ({tournaments.length})</TabsTrigger>
          <TabsTrigger value="leagues">Leagues ({leagues.length})</TabsTrigger>
          <TabsTrigger value="bracket">
            <Trophy className="h-4 w-4 mr-1" />
            Bracket
          </TabsTrigger>
          <TabsTrigger value="health">Health ({healthIssues.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments" className="space-y-4">
          {renderDataTable(tournaments, "tournaments")}
        </TabsContent>

        <TabsContent value="leagues" className="space-y-4">
          {renderDataTable(leagues, "leagues")}
        </TabsContent>

        <TabsContent value="bracket" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={selectedCompetitionForBracket || ""} onValueChange={setSelectedCompetitionForBracket}>
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="Select a tournament to view bracket" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name} ({tournament.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedCompetitionForBracket ? (
              <BracketPanel competitionId={selectedCompetitionForBracket} />
            ) : (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Tournament</h3>
                  <p className="text-muted-foreground">Choose a tournament from the dropdown to view its bracket.</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          {renderHealthTable()}
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCompetition ? "Edit Competition" : `Add New ${activeTab === "tournaments" ? "Tournament" : "League"}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-semibold">Basic Information</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Competition name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game">Game *</Label>
                  <Select value={formData.game} onValueChange={(value) => handleInputChange("game", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select game" />
                    </SelectTrigger>
                    <SelectContent>
                      {GAMES.map((game) => (
                        <SelectItem key={game} value={game}>
                          {game}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="season">Season *</Label>
                  <Input
                    id="season"
                    value={formData.season}
                    onChange={(e) => handleInputChange("season", e.target.value)}
                    placeholder="e.g., 2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="createdBy">Created By (User ID) *</Label>
                  <Input
                    id="createdBy"
                    value={formData.createdBy}
                    onChange={(e) => handleInputChange("createdBy", e.target.value)}
                    placeholder="user123"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="solo"
                      name="type"
                      value="solo"
                      checked={formData.type === "solo"}
                      onChange={(e) => handleInputChange("type", e.target.value)}
                    />
                    <Label htmlFor="solo">Solo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="clan"
                      name="type"
                      value="clan"
                      checked={formData.type === "clan"}
                      onChange={(e) => handleInputChange("type", e.target.value)}
                    />
                    <Label htmlFor="clan">Clan</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Buy-In */}
            <div className="space-y-4">
              <h4 className="font-semibold">Buy-In Settings</h4>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="buyInEnabled"
                  checked={formData.buyInEnabled}
                  onCheckedChange={(checked) => handleInputChange("buyInEnabled", checked)}
                />
                <Label htmlFor="buyInEnabled">Enable buy-in</Label>
              </div>

              {formData.buyInEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyInAmount">Amount *</Label>
                    <Input
                      id="buyInAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.buyInAmount}
                      onChange={(e) => handleInputChange("buyInAmount", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyInCurrency">Currency</Label>
                    <Select value={formData.buyInCurrency} onValueChange={(value) => handleInputChange("buyInCurrency", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Membership Rules */}
            <div className="space-y-4">
              <h4 className="font-semibold">Membership Rules</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Join Requirements</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                    {AVAILABLE_FEATURES.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <Checkbox
                          id={`join-${feature}`}
                          checked={formData.joinRequirements.includes(feature)}
                          onCheckedChange={() => handleFeatureToggle(feature, "join")}
                        />
                        <Label htmlFor={`join-${feature}`} className="text-sm">
                          {feature}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Host Requirements</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                    {AVAILABLE_FEATURES.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <Checkbox
                          id={`host-${feature}`}
                          checked={formData.hostRequirements.includes(feature)}
                          onCheckedChange={() => handleFeatureToggle(feature, "host")}
                        />
                        <Label htmlFor={`host-${feature}`} className="text-sm">
                          {feature}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingCompetition ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this {activeTab === "tournaments" ? "tournament" : activeTab === "leagues" ? "league" : "competition"}? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteConfirmId && activeTab !== "health" && handleDelete(deleteConfirmId, activeTab as "tournaments" | "leagues")}
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
