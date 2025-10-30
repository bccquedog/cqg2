import Link from "next/link";

type MatchCardProps = {
  playerA: { id: string; name: string };
  playerB: { id: string; name: string };
  round: number;
};

export function MatchCard({ playerA, playerB, round }: MatchCardProps) {
  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h3 className="text-sm text-gray-500">Round {round}</h3>
      <div className="mt-2">
        <Link href={`/profile/${playerA.id}`} className="text-blue-600 hover:underline">
          {playerA.name}
        </Link>
      </div>
      <div className="mt-1">
        <Link href={`/profile/${playerB.id}`} className="text-blue-600 hover:underline">
          {playerB.name}
        </Link>
      </div>
    </div>
  );
}


