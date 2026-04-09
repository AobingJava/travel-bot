import Link from "next/link";

import { CreateTripForm } from "@/components/create-trip-form";
import { HomeMobileNav } from "@/components/home-mobile-nav";
import { getHomeBootstrap } from "@/lib/app-service";
import { formatDateRange } from "@/lib/utils";
import type { TripStage, TripDocument } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const bootstrap = await getHomeBootstrap();

  // 按状态分类旅行计划
  const ongoingTrips = bootstrap.trips.filter((trip) => trip.stage === "ongoing" || trip.stage === "planning");
  const completedTrips = bootstrap.trips.filter((trip) => trip.stage === "completed");

  return (
    <main className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 pt-6 pb-28 sm:pt-10">
      {/* Header bar */}
      <section className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Wander
          </p>
          <Link
            href="/auth"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:shadow-sm active:scale-[0.98]"
          >
            {bootstrap.currentUser ? bootstrap.currentUser.name : "登录"}
          </Link>
        </div>
      </section>

      {/* Hero card */}
      <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="mt-4">
          <CreateTripForm />
        </div>
      </section>

      {/* 进行中的旅行 */}
      {ongoingTrips.length > 0 && (
        <section className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <p className="text-xs font-medium text-slate-400 mb-3">进行中的旅行</p>
          <div className="space-y-2">
            {ongoingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* 已完成的旅行 */}
      {completedTrips.length > 0 && (
        <section className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <p className="text-xs font-medium text-slate-400 mb-3">已完成的旅行</p>
          <div className="space-y-2">
            {completedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      <HomeMobileNav />
    </main>
  );
}

function TripCard({ trip }: { readonly trip: TripDocument }) {
  const stageLabel: Record<TripStage, string> = {
    ongoing: "进行中",
    planning: "筹备中",
    completed: "已完成",
    draft: "草稿",
  };

  const stageColor: Record<TripStage, string> = {
    ongoing: "bg-emerald-50 text-emerald-700",
    planning: "bg-blue-50 text-blue-700",
    completed: "bg-slate-100 text-slate-600",
    draft: "bg-amber-50 text-amber-700",
  };

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-3.5 transition hover:bg-slate-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[15px] font-semibold text-slate-950">
            {trip.name}
          </h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${stageColor[trip.stage]}`}>
            {stageLabel[trip.stage]}
          </span>
        </div>
        <p className="text-[12px] text-slate-500">{formatDateRange(trip.startDate, trip.endDate)}</p>
      </div>
      <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
