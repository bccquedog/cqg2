"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface TestResult {
  success: boolean;
  message: string;
  data?: { matchId: string; scores: Record<string, number>; winner?: string; status: string };
  error?: string;
}

export default function TestApiSubmitScorePage() {
  const [userId, setUserId] = useState("user1");
  const [competitionId, setCompetitionId] = useState("soloCupS1");
  const [matchId, setMatchId] = useState("match1");
  const [score, setScore] = useState<number | "">(85);
  const [ticketCode, setTicketCode] = useState("TICKET123");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const sampleData = [
    {
      userId: "user1",
      competitionId: "soloCupS1",
      matchId: "match1",
      score: 85,
      ticketCode: "TICKET123"
    },
    {
      userId: "user2",
      competitionId: "clanLeagueS1",
      matchId: "match2",
      score: 92,
      ticketCode: "TICKET456"
    },
    {
      userId: "user3",
      competitionId: "soloLeagueS1",
      matchId: "match3",
      score: 78,
      ticketCode: "TICKET789"
    }
  ];

  const handleSubmit = async () => {
    if (score === "" || !ticketCode.trim()) {
      setResult({
        success: false,
        message: "Please fill in all fields",
        error: "Missing required fields"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/submitScore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          competitionId,
          matchId,
          score: score as number,
          code: ticketCode.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || "Score submitted successfully",
          data: data.result
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to submit score",
          error: data.error
        });
      }
    } catch (error) {
      console.error("API call error:", error);
      setResult({
        success: false,
        message: "Network error occurred",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = (index: number) => {
    const sample = sampleData[index];
    setUserId(sample.userId);
    setCompetitionId(sample.competitionId);
    setMatchId(sample.matchId);
    setScore(sample.score);
    setTicketCode(sample.ticketCode);
    setResult(null);
  };

  const getResultIcon = () => {
    if (!result) return null;
    
    if (result.success) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getResultColor = () => {
    if (!result) return "";
    
    if (result.success) {
      return "border-green-200 bg-green-50";
    } else {
      return "border-red-200 bg-red-50";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test API Submit Score</h1>
          <p className="text-gray-600">Test the /api/submitScore endpoint with different scenarios</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                API Test Form
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sample Data Buttons */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Quick Test Data
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {sampleData.map((sample, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => loadSampleData(index)}
                      className="text-xs"
                    >
                      Sample {index + 1}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    User ID
                  </label>
                  <Input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter user ID"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Competition ID
                  </label>
                  <Input
                    value={competitionId}
                    onChange={(e) => setCompetitionId(e.target.value)}
                    placeholder="Enter competition ID"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Match ID
                  </label>
                  <Input
                    value={matchId}
                    onChange={(e) => setMatchId(e.target.value)}
                    placeholder="Enter match ID"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Score
                  </label>
                  <Input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value) || "")}
                    placeholder="Enter score"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Ticket Code
                  </label>
                  <Input
                    value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                    placeholder="Enter ticket code"
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleSubmit} 
                disabled={loading || score === "" || !ticketCode.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing API...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Test Submit Score
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                API Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No test results yet</p>
                  <p className="text-sm text-gray-500">Submit a test to see the API response</p>
                </div>
              ) : (
                <div className={`p-4 rounded-lg border ${getResultColor()}`}>
                  <div className="flex items-start gap-3">
                    {getResultIcon()}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          {result.success ? "Success" : "Error"}
                        </h3>
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? "200 OK" : "Error"}
                        </Badge>
                      </div>
                      
                      <p className="text-sm mb-3">{result.message}</p>
                      
                      {result.data && (
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-medium text-sm mb-2">Response Data:</h4>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {result.error && (
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-medium text-sm mb-2">Error Details:</h4>
                          <p className="text-xs text-red-600">{result.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* API Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>API Documentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Endpoint: POST /api/submitScore</h3>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <p className="font-medium mb-2">Request Body:</p>
                <pre className="text-xs">
{`{
  "userId": "string",
  "competitionId": "string", 
  "matchId": "string",
  "score": number,
  "code": "string"
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
  "message": "Score submitted successfully",
  "result": {
    "matchId": "string",
    "scores": { "userId": number },
    "winner": "string",
    "status": "live" | "completed"
  }
}`}
                </pre>
                <p className="font-medium mb-2 mt-3">Error (400/500):</p>
                <pre className="text-xs">
{`{
  "success": false,
  "error": "Error message"
}`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Validation Rules:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All fields are required</li>
                <li>• Score must be a number ≥ 0</li>
                <li>• Ticket code must be 6-20 characters</li>
                <li>• Ticket must be valid and not expired</li>
                <li>• User must be a participant in the match</li>
                <li>• Score cannot be submitted twice for the same match</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
