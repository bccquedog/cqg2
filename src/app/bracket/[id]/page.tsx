import BracketViewer from "@/components/BracketViewer";

interface BracketPageProps {
  params: {
    id: string;
  };
}

export default function BracketPage({ params }: BracketPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <BracketViewer competitionId={params.id} />
    </div>
  );
}


