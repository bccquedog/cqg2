"use client";

import LeaderboardViewer from "@/components/LeaderboardViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Gamepad2, Users } from "lucide-react";

export default function LeaderboardsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🏆 Leaderboards</h1>
          <p className="text-lg text-gray-600">See how you stack up against the competition</p>
        </div>

        {/* Global Leaderboard */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Global Leaderboard
          </h2>
          <LeaderboardViewer 
            scope="global" 
            limit={20}
            showTiers={true}
            showRefresh={true}
          />
        </div>

        {/* Game Leaderboards */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-blue-500" />
            Game Leaderboards
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">NBA 2K</h3>
              <LeaderboardViewer 
                scope="game" 
                filterId="2k"
                limit={10}
                showTiers={true}
                showRefresh={false}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Madden NFL</h3>
              <LeaderboardViewer 
                scope="game" 
                filterId="madden"
                limit={10}
                showTiers={true}
                showRefresh={false}
              />
            </div>
          </div>
        </div>

        {/* League Leaderboards */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Users className="h-6 w-6 text-green-500" />
            League Leaderboards
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Solo League S1</h3>
              <LeaderboardViewer 
                scope="league" 
                filterId="soloLeagueS1"
                limit={10}
                showTiers={true}
                showRefresh={false}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Clan League S1</h3>
              <LeaderboardViewer 
                scope="league" 
                filterId="clanLeagueS1"
                limit={10}
                showTiers={true}
                showRefresh={false}
              />
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>How Leaderboards Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">🏆 Global Leaderboard</h3>
              <p className="text-sm text-gray-600">
                Overall performance across all games and competitions. Points are accumulated from all matches played.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🎮 Game Leaderboards</h3>
              <p className="text-sm text-gray-600">
                Performance within specific games. Each game has its own leaderboard with game-specific scoring.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">👥 League Leaderboards</h3>
              <p className="text-sm text-gray-600">
                Performance within specific leagues or tournaments. Track your progress in ongoing competitions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📊 Scoring System</h3>
              <p className="text-sm text-gray-600">
                Points are awarded based on match performance, with bonus points for wins and tournament victories.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}