import ScheduleViewer from "@/components/ScheduleViewer";

interface SchedulePageProps {
  params: {
    type: "tournament" | "league";
    id: string;
  };
}

export default function SchedulePage({ params }: SchedulePageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <ScheduleViewer 
        competitionId={params.id} 
        competitionType={params.type} 
      />
    </div>
  );
}


