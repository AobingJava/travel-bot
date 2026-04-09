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
        <div className="relative overflow-hidden rounded-[24px] bg-slate-950 px-5 py-6 text-white">
          <div className="absolute -left-10 top-4 h-28 w-28 rounded-full bg-slate-700/20" />
          <div className="absolute -right-8 -top-4 h-40 w-40 rounded-full bg-teal-200/12" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
              Wander
            </p>
            <h1 className="mt-3 max-w-[240px] text-[28px] font-bold leading-tight tracking-tight">
              计划你的下一次旅行
            </h1>
            <p className="mt-2.5 max-w-[260px] text-[13px] leading-6 text-white/75">
              AI 帮你搞定所有细节，先把行前准备、旅途打卡和旅后总结拆清楚。
            </p>
          </div>
        </div>

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
