import ScheduleViewer from "@/components/ScheduleViewer";
import Link from "next/link";

export default function TestSchedulePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Schedule Viewer Test</h1>
        <p className="text-gray-600 mb-6">
          Test the ScheduleViewer component with seeded tournament and league data.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Tournament Schedules</h3>
            <div className="flex flex-col gap-2">
              <Link 
                href="/schedule/tournament/soloCupS1" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Solo Cup S1 Schedule
              </Link>
              <Link 
                href="/schedule/tournament/clanCupS1" 
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
              >
                Clan Cup S1 Schedule
              </Link>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">League Schedules</h3>
            <div className="flex flex-col gap-2">
              <Link 
                href="/schedule/league/soloLeagueS1" 
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                Solo League S1 Schedule
              </Link>
              <Link 
                href="/schedule/league/clanLeagueS1" 
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm"
              >
                Clan League S1 Schedule
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Solo Cup S1 Tournament Schedule</h2>
          <ScheduleViewer competitionId="soloCupS1" competitionType="tournament" />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Clan Cup S1 Tournament Schedule</h2>
          <ScheduleViewer competitionId="clanCupS1" competitionType="tournament" />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Solo League S1 Schedule</h2>
          <ScheduleViewer competitionId="soloLeagueS1" competitionType="league" />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Clan League S1 Schedule</h2>
          <ScheduleViewer competitionId="clanLeagueS1" competitionType="league" />
        </div>
      </div>
    </div>
  );
}


