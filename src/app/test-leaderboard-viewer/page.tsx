"use client";

import LeaderboardViewer from "@/components/LeaderboardViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestLeaderboardViewerPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard Viewer Test</h1>
          <p className="text-gray-600">Test different leaderboard viewer configurations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Global Leaderboard */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Global Leaderboard</h2>
            <LeaderboardViewer 
              scope="global" 
              limit={10}
              showTiers={true}
              showRefresh={true}
            />
          </div>

          {/* Game Leaderboard */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Game Leaderboard (NBA2K)</h2>
            <LeaderboardViewer 
              scope="game" 
              filterId="2k"
              limit={10}
              showTiers={true}
              showRefresh={true}
            />
          </div>

          {/* League Leaderboard */}
          <div>
            <h2 className="text-xl font-semibold mb-4">League Leaderboard (Solo League S1)</h2>
            <LeaderboardViewer 
              scope="league" 
              filterId="soloLeagueS1"
              limit={10}
              showTiers={true}
              showRefresh={true}
            />
          </div>

          {/* Compact Version */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Compact Version (Top 5)</h2>
            <LeaderboardViewer 
              scope="global" 
              limit={5}
              showTiers={false}
              showRefresh={false}
            />
          </div>
        </div>

        {/* Full Width Global Leaderboard */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Full Global Leaderboard (Top 20)</h2>
          <LeaderboardViewer 
            scope="global" 
            limit={20}
            showTiers={true}
            showRefresh={true}
          />
        </div>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Basic Global Leaderboard:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<LeaderboardViewer scope="global" />`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Game-Specific Leaderboard:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<LeaderboardViewer 
  scope="game" 
  filterId="madden" 
  limit={15}
  showTiers={true}
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">League-Specific Leaderboard:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<LeaderboardViewer 
  scope="league" 
  filterId="clanLeagueS1" 
  limit={10}
  showRefresh={false}
/>`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


