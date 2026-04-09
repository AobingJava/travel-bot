import { notFound } from "next/navigation";

import { MobileNav } from "@/components/mobile-nav";
import { TaskBoard } from "@/components/task-board";
import { TripHeader } from "@/components/trip-header";
import { TripMembers } from "@/components/trip-members";
import { TripOverview } from "@/components/trip-overview";
import { MemoryView } from "@/components/memory-view";
import { getTripWithViewer } from "@/lib/app-service";

export const dynamic = "force-dynamic";

type TripPageProps = {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TripPage({ params, searchParams }: TripPageProps) {
  const [{ tripId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const { trip, currentUser } = await getTripWithViewer(tripId);

  if (!trip) {
    notFound();
  }

  const viewParam = resolvedSearchParams.view;
  const view = typeof viewParam === "string" ? viewParam : "overview";
  const canInvite =
    (currentUser?.email?.toLowerCase() ?? "aihe@example.com") ===
    trip.ownerEmail.toLowerCase();

  return (
    <main className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 pt-6 pb-28 sm:pt-10">
      <TripHeader trip={trip} currentUser={currentUser} />

      {view === "overview" ? <TripOverview trip={trip} canInvite={canInvite} /> : null}
      {view === "tasks" ? (
        <TaskBoard tripId={trip.id} tasks={trip.tasks} banner={trip.banner} />
      ) : null}
      {view === "companions" ? (
        <TripMembers trip={trip} />
      ) : null}
      {view === "meeting" ? <MemoryView trip={trip} /> : null}

      <MobileNav tripId={trip.id} />
    </main>
  );
}
