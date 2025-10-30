import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";

export default function ClipRail({ competitionId }: { competitionId: string }) {
  const [clips, setClips] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = db
      .collection("tournaments")
      .doc(competitionId)
      .collection("clips")
      .orderBy("surgeScore", "desc")
      .limit(10)
      .onSnapshot((snap) => {
        setClips(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    return () => unsubscribe();
  }, [competitionId]);

  if (clips.length === 0) return <p>No highlights yet.</p>;

  return (
    <div className="space-y-4">
      <h3 className="font-bold">🔥 Highlight Clips</h3>
      <div className="flex gap-4 overflow-x-auto">
        {clips.map((clip) => (
          <Card key={clip.id} className="min-w-[300px] p-2">
            <iframe
              src={clip.embedUrl}
              height="200"
              width="300"
              frameBorder="0"
              allowFullScreen
              className="rounded-lg w-full"
            />
            <p className="text-sm mt-2">{clip.description}</p>
            <p className="text-xs text-gray-500">Surge: {clip.surgeScore}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
