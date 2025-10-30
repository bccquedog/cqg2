"use client";

import { useState } from "react";
import ScoreSubmitter from "@/components/ScoreSubmitter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Target, Users, Gamepad2 } from "lucide-react";

export default function TestScoreSubmitterPage() {
  const [competitionId, setCompetitionId] = useState("soloCupS1");
  const [matchId, setMatchId] = useState("match1");
  const [userId, setUserId] = useState("user1");
  const [maxScore, setMaxScore] = useState(100);
  const [minScore, setMinScore] = useState(0);
  const [allowDecimal, setAllowDecimal] = useState(false);

  const sampleCompetitions = [
    { id: "soloCupS1", name: "Solo Cup Season 1", type: "Tournament" },
    { id: "clanCupS1", name: "Clan Cup Season 1", type: "Tournament" },
    { id: "soloLeagueS1", name: "Solo League Season 1", type: "League" },
    { id: "clanLeagueS1", name: "Clan League Season 1", type: "League" }
  ];

  const sampleMatches = [
    { id: "match1", name: "Match 1 - Round 1" },
    { id: "match2", name: "Match 2 - Round 1" },
    { id: "match3", name: "Match 3 - Round 2" },
    { id: "match4", name: "Match 4 - Final" }
  ];

  const sampleUsers = [
    { id: "user1", name: "Player 1" },
    { id: "user2", name: "Player 2" },
    { id: "user3", name: "Player 3" },
    { id: "user4", name: "Player 4" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Score Submitter</h1>
          <p className="text-gray-600">Test the score submission component with different configurations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Competition Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Competition
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {sampleCompetitions.map((comp) => (
                    <Button
                      key={comp.id}
                      variant={competitionId === comp.id ? "default" : "outline"}
                      onClick={() => setCompetitionId(comp.id)}
                      className="justify-start text-sm"
                    >
                      {comp.type === "Tournament" ? (
                        <Trophy className="h-3 w-3 mr-1" />
                      ) : (
                        <Users className="h-3 w-3 mr-1" />
                      )}
                      {comp.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Match Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Match
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {sampleMatches.map((match) => (
                    <Button
                      key={match.id}
                      variant={matchId === match.id ? "default" : "outline"}
                      onClick={() => setMatchId(match.id)}
                      className="justify-start text-sm"
                    >
                      <Target className="h-3 w-3 mr-1" />
                      {match.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* User Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  User
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {sampleUsers.map((user) => (
                    <Button
                      key={user.id}
                      variant={userId === user.id ? "default" : "outline"}
                      onClick={() => setUserId(user.id)}
                      className="justify-start text-sm"
                    >
                      <Gamepad2 className="h-3 w-3 mr-1" />
                      {user.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Score Range Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Min Score
                  </label>
                  <Input
                    type="number"
                    value={minScore}
                    onChange={(e) => setMinScore(parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Max Score
                  </label>
                  <Input
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(parseInt(e.target.value) || 100)}
                    min="1"
                  />
                </div>
              </div>

              {/* Decimal Support */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Score Type
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={!allowDecimal ? "default" : "outline"}
                    onClick={() => setAllowDecimal(false)}
                    size="sm"
                  >
                    Whole Numbers
                  </Button>
                  <Button
                    variant={allowDecimal ? "default" : "outline"}
                    onClick={() => setAllowDecimal(true)}
                    size="sm"
                  >
                    Decimals Allowed
                  </Button>
                </div>
              </div>

              {/* Current Configuration Summary */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Current Configuration:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Competition: {competitionId}</p>
                  <p>Match: {matchId}</p>
                  <p>User: {userId}</p>
                  <p>Score Range: {minScore} - {maxScore}</p>
                  <p>Decimal Support: {allowDecimal ? "Yes" : "No"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Submitter Component */}
          <div>
            <ScoreSubmitter
              competitionId={competitionId}
              matchId={matchId}
              userId={userId}
              maxScore={maxScore}
              minScore={minScore}
              allowDecimal={allowDecimal}
            />
          </div>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Score Submitter Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">📊 Score Input</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Configurable score range (min/max)</li>
                  <li>• Support for whole numbers or decimals</li>
                  <li>• Real-time validation</li>
                  <li>• Clear error messages</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🎫 Ticket Validation</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Match ticket code input</li>
                  <li>• Automatic uppercase conversion</li>
                  <li>• Length validation (6-20 characters)</li>
                  <li>• Required field validation</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">✅ Submission Process</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• API integration with /api/submitScore</li>
                  <li>• Loading states and feedback</li>
                  <li>• Success/error status messages</li>
                  <li>• Form auto-clear after submission</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🎨 User Experience</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Clean, card-based design</li>
                  <li>• Responsive layout</li>
                  <li>• Clear visual feedback</li>
                  <li>• Helpful instructions and tips</li>
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
              <h3 className="font-semibold mb-2">Basic Usage:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<ScoreSubmitter
  competitionId="soloCupS1"
  matchId="match1"
  userId="user1"
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">With Custom Score Range:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<ScoreSubmitter
  competitionId="clanLeagueS1"
  matchId="match2"
  userId="user2"
  maxScore={50}
  minScore={0}
  allowDecimal={true}
/>`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* API Integration */}
        <Card>
          <CardHeader>
            <CardTitle>API Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Endpoint: POST /api/submitScore</h3>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <p className="font-medium mb-2">Request Body:</p>
                <pre className="text-xs">
{`{
  "userId": "user1",
  "competitionId": "soloCupS1", 
  "matchId": "match1",
  "score": 85,
  "code": "TICKET123"
}`}
                </pre>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Response:</h3>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <p className="font-medium mb-2">Success (200):</p>
                <pre className="text-xs">
{`{
  "success": true,
  "message": "Score submitted successfully"
}`}
                </pre>
                <p className="font-medium mb-2 mt-3">Error (400/500):</p>
                <pre className="text-xs">
{`{
  "error": "Invalid ticket code",
  "message": "The provided ticket code is invalid or expired"
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
