import LeaderboardViewer from '../../../../components/LeaderboardViewer';

interface LeagueLeaderboardPageProps {
  params: {
    leagueId: string;
  };
}

export default function LeagueLeaderboardPage({ params }: LeagueLeaderboardPageProps) {
  const { leagueId } = params;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{leagueId} Leaderboard</h1>
        <p className="text-gray-600">
          Performance rankings for {leagueId} participants
        </p>
      </div>
      
      <LeaderboardViewer initialType="league" leagueId={leagueId} />
    </div>
  );
}


