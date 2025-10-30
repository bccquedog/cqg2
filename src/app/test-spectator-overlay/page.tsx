"use client";

import { useState } from "react";
import SpectatorOverlay from "@/components/SpectatorOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function TestSpectatorOverlayPage() {
  const [competitionId, setCompetitionId] = useState("soloCupS1");
  const [showStats, setShowStats] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showSpotlight, setShowSpotlight] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [showPolls, setShowPolls] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  const sampleCompetitions = [
    { id: "soloCupS1", name: "Solo Cup Season 1" },
    { id: "clanCupS1", name: "Clan Cup Season 1" },
    { id: "soloLeagueS1", name: "Solo League Season 1" },
    { id: "teamChampionship", name: "Team Championship" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Spectator Overlay Test Page</h1>
        <p className="text-gray-600">
          Test the enhanced SpectatorOverlay component with polling functionality
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎛️ Test Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Competition Selection */}
          <div className="space-y-2">
            <Label htmlFor="competition">Competition ID</Label>
            <div className="flex gap-2">
              <Input
                id="competition"
                value={competitionId}
                onChange={(e) => setCompetitionId(e.target.value)}
                placeholder="Enter competition ID"
                className="flex-1"
              />
              <div className="flex gap-1">
                {sampleCompetitions.map((comp) => (
                  <Button
                    key={comp.id}
                    size="sm"
                    variant={competitionId === comp.id ? "default" : "outline"}
                    onClick={() => setCompetitionId(comp.id)}
                  >
                    {comp.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Feature Toggles */}
          <div className="space-y-4">
            <h3 className="font-semibold">Feature Toggles</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="showStats"
                  checked={showStats}
                  onCheckedChange={setShowStats}
                />
                <Label htmlFor="showStats">Show Stats</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="showChat"
                  checked={showChat}
                  onCheckedChange={setShowChat}
                />
                <Label htmlFor="showChat">Show Chat</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="showSpotlight"
                  checked={showSpotlight}
                  onCheckedChange={setShowSpotlight}
                />
                <Label htmlFor="showSpotlight">Show Spotlight</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="showAlerts"
                  checked={showAlerts}
                  onCheckedChange={setShowAlerts}
                />
                <Label htmlFor="showAlerts">Show Alerts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="showPolls"
                  checked={showPolls}
                  onCheckedChange={setShowPolls}
                />
                <Label htmlFor="showPolls">Show Polls</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoRefresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label htmlFor="autoRefresh">Auto Refresh</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Refresh Interval */}
          <div className="space-y-2">
            <Label htmlFor="refreshInterval">Refresh Interval (ms)</Label>
            <Input
              id="refreshInterval"
              type="number"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              min="1000"
              max="30000"
              step="1000"
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Competition: {competitionId}</Badge>
            {showStats && <Badge variant="secondary">Stats</Badge>}
            {showChat && <Badge variant="secondary">Chat</Badge>}
            {showSpotlight && <Badge variant="secondary">Spotlight</Badge>}
            {showAlerts && <Badge variant="secondary">Alerts</Badge>}
            {showPolls && <Badge variant="secondary">Polls</Badge>}
            {autoRefresh && <Badge variant="secondary">Auto Refresh</Badge>}
            <Badge variant="outline">{refreshInterval}ms</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Spectator Overlay Component */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spectator Overlay Component</CardTitle>
        </CardHeader>
        <CardContent>
          <SpectatorOverlay
            competitionId={competitionId}
            showStats={showStats}
            showChat={showChat}
            showSpotlight={showSpotlight}
            showAlerts={showAlerts}
            showPolls={showPolls}
            autoRefresh={autoRefresh}
            refreshInterval={refreshInterval}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4"
          />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📋 Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">🗳️ Poll Testing:</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Switch between different competitions to see different poll data</li>
              <li>Try voting on polls - your vote should be recorded and displayed</li>
              <li>Check that poll results update in real-time</li>
              <li>Verify that expired polls are automatically filtered out</li>
              <li>Test the poll type badges (PREDICTION vs OVERUNDER)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">⚡ Alert Testing:</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Run the live alert simulation: <code>pnpm seed:spectator-overlay {competitionId} --live</code></li>
              <li>Watch alerts appear in real-time</li>
              <li>Check alert types and priorities are displayed correctly</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🌟 Spotlight Testing:</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Verify player spotlight data displays correctly</li>
              <li>Check stats and achievements are shown</li>
              <li>Test different spotlight types</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">💬 Chat Testing:</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Check chat messages display in chronological order</li>
              <li>Verify system vs user message types</li>
              <li>Test expand/collapse functionality</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">📊 Stats Testing:</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Verify live viewer counts and engagement metrics</li>
              <li>Check that stats update in real-time</li>
              <li>Test the gradient styling and layout</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔧 Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Seed Data:</h3>
              <div className="space-y-1 text-sm font-mono bg-gray-100 p-2 rounded">
                <div>pnpm seed:spectator-overlay {competitionId}</div>
                <div>pnpm seed:polls {competitionId}</div>
                <div>pnpm seed:spectator-overlay {competitionId} --live</div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Check Data:</h3>
              <div className="space-y-1 text-sm font-mono bg-gray-100 p-2 rounded">
                <div>pnpm sanity:spectator-overlay {competitionId}</div>
                <div>pnpm sanity:polls {competitionId}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}