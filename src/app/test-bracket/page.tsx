import BracketViewer from "@/components/BracketViewer";
import Link from "next/link";

export default function TestBracketPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Bracket Viewer Test</h1>
        <p className="text-gray-600 mb-6">
          Test the BracketViewer component with seeded tournament data.
        </p>
        
        <div className="flex gap-4 mb-8">
          <Link 
            href="/bracket/soloCupS1" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View Solo Cup S1 Bracket
          </Link>
          <Link 
            href="/bracket/clanCupS1" 
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            View Clan Cup S1 Bracket
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Solo Cup S1 Bracket</h2>
          <BracketViewer competitionId="soloCupS1" />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Clan Cup S1 Bracket</h2>
          <BracketViewer competitionId="clanCupS1" />
        </div>
      </div>
    </div>
  );
}


