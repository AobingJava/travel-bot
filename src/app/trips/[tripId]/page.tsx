import { notFound, redirect } from "next/navigation";

import { MobileNav } from "@/components/mobile-nav";
import { TaskBoard } from "@/components/task-board";
import { TripHeader } from "@/components/trip-header";
import { TripMembers } from "@/components/trip-members";
import { TodoList } from "@/components/todo-list";
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

  // 如果行程已完成，刷新时自动跳转回首页
  if (trip.stage === "completed") {
    redirect("/");
  }

  const viewParam = resolvedSearchParams.view;
  const view = typeof viewParam === "string" ? viewParam : "todos";
  const canInvite =
    (currentUser?.email?.toLowerCase() ?? "aihe@example.com") ===
    trip.ownerEmail.toLowerCase();

  return (
    <main className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 pt-6 pb-28 sm:pt-10">
      <TripHeader trip={trip} currentUser={currentUser} />

      {view === "todos" ? <TodoList trip={trip} canInvite={canInvite} /> : null}
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
