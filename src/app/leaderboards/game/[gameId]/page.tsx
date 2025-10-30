import LeaderboardViewer from '../../../../components/LeaderboardViewer';

interface GameLeaderboardPageProps {
  params: {
    gameId: string;
  };
}

export default function GameLeaderboardPage({ params }: GameLeaderboardPageProps) {
  const { gameId } = params;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{gameId.toUpperCase()} Leaderboard</h1>
        <p className="text-gray-600">
          Performance rankings for {gameId} players
        </p>
      </div>
      
      <LeaderboardViewer initialType="game" gameId={gameId} />
    </div>
  );
}


