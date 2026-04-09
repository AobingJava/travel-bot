import { notFound } from "next/navigation";

import { MemoryResultView } from "@/components/memory-result-view";
import { getTripWithViewer } from "@/lib/app-service";

export const dynamic = "force-dynamic";

type MemoryResultPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function MemoryResultPage({ params }: MemoryResultPageProps) {
  const { tripId } = await params;
  const { trip, currentUser } = await getTripWithViewer(tripId);

  if (!trip) {
    notFound();
  }

  return <MemoryResultView trip={trip} currentUser={currentUser} />;
}
