"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Users, Gamepad2 } from "lucide-react";

export default function TestCompetitionLeaderboardPage() {
  const [competitionId, setCompetitionId] = useState("soloCupS1");

  const sampleCompetitions = [
    { id: "soloCupS1", name: "Solo Cup Season 1", type: "Tournament" },
    { id: "clanCupS1", name: "Clan Cup Season 1", type: "Tournament" },
    { id: "soloLeagueS1", name: "Solo League Season 1", type: "League" },
    { id: "clanLeagueS1", name: "Clan League Season 1", type: "League" }
  ];

  const navigateToCompetition = () => {
    if (competitionId) {
      window.location.href = `/competitions/${competitionId}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Competition Leaderboard Toggle</h1>
          <p className="text-gray-600">Test the leaderboard scope toggle functionality in competition pages</p>
        </div>

        {/* Competition Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Competition to Test Leaderboard Toggle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-center">
              <Input
                placeholder="Enter competition ID"
                value={competitionId}
                onChange={(e) => setCompetitionId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={navigateToCompetition}>
                Test Competition Page
              </Button>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Or select from sample competitions:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {sampleCompetitions.map((comp) => (
                  <Button
                    key={comp.id}
                    variant="outline"
                    onClick={() => setCompetitionId(comp.id)}
                    className="justify-start"
                  >
                    {comp.type === "Tournament" ? (
                      <Trophy className="h-4 w-4 mr-2" />
                    ) : (
                      <Users className="h-4 w-4 mr-2" />
                    )}
                    {comp.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard Toggle Features */}
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard Toggle Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Global Leaderboard
                </h3>
                <p className="text-sm text-gray-600">
                  View overall performance across all games and competitions. No filter ID needed.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4" />
                  Game Leaderboard
                </h3>
                <p className="text-sm text-gray-600">
                  View performance within specific games. Enter game ID (e.g., &quot;madden&quot;, &quot;2k&quot;).
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  League Leaderboard
                </h3>
                <p className="text-sm text-gray-600">
                  View performance within specific leagues. Defaults to current competition ID.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test the Leaderboard Toggle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</div>
                <div>
                  <p className="font-medium">Navigate to a Competition Page</p>
                  <p className="text-sm text-gray-600">Click on any competition above or enter a competition ID</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</div>
                <div>
                  <p className="font-medium">Go to the Leaderboard Tab</p>
                  <p className="text-sm text-gray-600">Click on the &quot;Leaderboard&quot; tab in the competition page</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">3</div>
                <div>
                  <p className="font-medium">Test the Scope Toggle</p>
                  <p className="text-sm text-gray-600">Click between Global, Game, and League buttons to see different leaderboards</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">4</div>
                <div>
                  <p className="font-medium">Enter Filter IDs</p>
                  <p className="text-sm text-gray-600">For Game and League scopes, enter specific IDs to filter the leaderboard</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Filter IDs */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Filter IDs for Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Game IDs:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <code className="bg-gray-100 px-1 rounded">madden</code> - Madden NFL</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">2k</code> - NBA 2K</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">cod</code> - Call of Duty</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">League IDs:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <code className="bg-gray-100 px-1 rounded">soloLeagueS1</code> - Solo League Season 1</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">clanLeagueS1</code> - Clan League Season 1</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">soloCupS1</code> - Solo Cup Season 1</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
