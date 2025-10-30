"use client";

import React, { useState } from "react";
import ClipDisplay from "@/components/ClipDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function TestClipDisplayPage() {
  const [competitionId, setCompetitionId] = useState("soloCupS1");
  const [showClips, setShowClips] = useState(true);
  const [showTrending, setShowTrending] = useState(true);
  const [showHighlights, setShowHighlights] = useState(true);
  const [maxClips, setMaxClips] = useState(5);
  const [currentUserId, setCurrentUserId] = useState("user123");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎬 Clip Display Test Page
          </h1>
          <p className="text-gray-600">
            Test the clip display component with different configurations
          </p>
        </div>

        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚙️ Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Competition ID */}
              <div className="space-y-2">
                <Label htmlFor="competitionId">Competition ID</Label>
                <Input
                  id="competitionId"
                  value={competitionId}
                  onChange={(e) => setCompetitionId(e.target.value)}
                  placeholder="e.g., soloCupS1"
                />
              </div>

              {/* Current User ID */}
              <div className="space-y-2">
                <Label htmlFor="currentUserId">Current User ID</Label>
                <Input
                  id="currentUserId"
                  value={currentUserId}
                  onChange={(e) => setCurrentUserId(e.target.value)}
                  placeholder="e.g., user123"
                />
              </div>

              {/* Max Clips */}
              <div className="space-y-2">
                <Label htmlFor="maxClips">Max Clips to Show</Label>
                <Input
                  id="maxClips"
                  type="number"
                  min="1"
                  max="20"
                  value={maxClips}
                  onChange={(e) => setMaxClips(parseInt(e.target.value) || 5)}
                />
              </div>
            </div>

            <Separator />

            {/* Toggle Switches */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="showClips"
                  checked={showClips}
                  onCheckedChange={setShowClips}
                />
                <Label htmlFor="showClips">Show Clips</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showTrending"
                  checked={showTrending}
                  onCheckedChange={setShowTrending}
                />
                <Label htmlFor="showTrending">Show Trending</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showHighlights"
                  checked={showHighlights}
                  onCheckedChange={setShowHighlights}
                />
                <Label htmlFor="showHighlights">Show Highlights</Label>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <Label>Quick Presets</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCompetitionId("soloCupS1");
                    setShowClips(true);
                    setShowTrending(true);
                    setShowHighlights(true);
                    setMaxClips(5);
                  }}
                >
                  Solo Cup
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCompetitionId("clanCupS1");
                    setShowClips(true);
                    setShowTrending(true);
                    setShowHighlights(true);
                    setMaxClips(8);
                  }}
                >
                  Clan Cup
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowClips(true);
                    setShowTrending(false);
                    setShowHighlights(true);
                    setMaxClips(3);
                  }}
                >
                  Highlights Only
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowClips(true);
                    setShowTrending(true);
                    setShowHighlights(false);
                    setMaxClips(10);
                  }}
                >
                  Trending Only
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Configuration Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                Competition: {competitionId}
              </Badge>
              <Badge variant="outline">
                User: {currentUserId}
              </Badge>
              <Badge variant="outline">
                Max Clips: {maxClips}
              </Badge>
              <Badge variant={showClips ? "default" : "secondary"}>
                Clips: {showClips ? "ON" : "OFF"}
              </Badge>
              <Badge variant={showTrending ? "default" : "secondary"}>
                Trending: {showTrending ? "ON" : "OFF"}
              </Badge>
              <Badge variant={showHighlights ? "default" : "secondary"}>
                Highlights: {showHighlights ? "ON" : "OFF"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Clip Display Component */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎬 Clip Display Component
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClipDisplay
              competitionId={competitionId}
              showClips={showClips}
              maxClips={maxClips}
              showTrending={showTrending}
              showHighlights={showHighlights}
              currentUserId={currentUserId}
            />
          </CardContent>
        </Card>

        {/* Component Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ℹ️ Component Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Features:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Real-time clip display with Firestore integration</li>
                <li>Voting system with upvote/downvote functionality</li>
                <li>Surge score calculation based on votes</li>
                <li>Trending clips section (surge score ≥ 80)</li>
                <li>Highlights section for marked clips</li>
                <li>Source indicators (Twitch, YouTube, Manual)</li>
                <li>Tag display and filtering</li>
                <li>Duration and timestamp information</li>
                <li>Responsive design with mobile support</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Props:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li><code>competitionId</code> - Tournament/competition identifier</li>
                <li><code>showClips</code> - Toggle clip display on/off</li>
                <li><code>maxClips</code> - Maximum number of clips to show</li>
                <li><code>showTrending</code> - Toggle trending section</li>
                <li><code>showHighlights</code> - Toggle highlights section</li>
                <li><code>currentUserId</code> - User ID for voting</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Data Structure:</h4>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                <pre>{`{
  id: string;
  playerId: string;
  url: string;
  source: "twitch" | "youtube" | "manual";
  description: string;
  surgeScore: number;
  votes: Record<string, boolean>;
  createdAt: Date;
  thumbnailUrl?: string;
  duration?: number;
  tags?: string[];
  isHighlight?: boolean;
}`}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


