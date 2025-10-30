"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Users } from "lucide-react";

export default function TestCompetitionPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Competition Page</h1>
          <p className="text-gray-600">Test the public competition view with different competitions</p>
        </div>

        {/* Competition Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Competition to View</CardTitle>
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
                View Competition
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

        {/* Sample Competition Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Tournaments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = "/competitions/soloCupS1"}
              >
                Solo Cup Season 1
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = "/competitions/clanCupS1"}
              >
                Clan Cup Season 1
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Leagues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = "/competitions/soloLeagueS1"}
              >
                Solo League Season 1
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = "/competitions/clanLeagueS1"}
              >
                Clan League Season 1
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Competition Page Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">📊 Overview Tab</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Competition details and description</li>
                  <li>• Game, type, and season information</li>
                  <li>• Entry fee and membership requirements</li>
                  <li>• Participant list</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🎯 Bracket Tab</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Tournament bracket visualization</li>
                  <li>• Match results and progress</li>
                  <li>• Winner determination</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">📅 Schedule Tab</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Competition schedule and events</li>
                  <li>• Match times and dates</li>
                  <li>• Event status tracking</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🏆 Leaderboard Tab</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Competition-specific rankings</li>
                  <li>• Player statistics and performance</li>
                  <li>• Real-time updates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Direct Links:</h3>
              <div className="space-y-2">
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <code>/competitions/soloCupS1</code> - Solo Cup Season 1
                </div>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <code>/competitions/clanLeagueS1</code> - Clan League Season 1
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Programmatic Navigation:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`// Navigate to competition page
router.push('/competitions/soloCupS1');

// Or use Link component
<Link href="/competitions/soloCupS1">
  View Competition
</Link>`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
