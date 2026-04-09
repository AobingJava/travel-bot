import Link from "next/link";

import { CreateTripForm } from "@/components/create-trip-form";
import { HomeMobileNav } from "@/components/home-mobile-nav";
import { getHomeBootstrap } from "@/lib/app-service";
import type { TripStage, TripDocument } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const bootstrap = await getHomeBootstrap();

  // 按状态分类旅行计划
  const ongoingTrips = bootstrap.trips.filter((trip) => trip.stage === "ongoing" || trip.stage === "planning");
  const completedTrips = bootstrap.trips.filter((trip) => trip.stage === "completed");

  return (
    <main className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 pt-6 pb-28 sm:pt-10">
      {/* 合并的 Header + Hero 卡片 */}
      <section className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-[0px_20px_40px_rgba(78,33,32,0.08)]">
        {/* 顶部 Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full ring-2 ring-primary-container overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMKvbpNKJG8j1JmkB4GxJHVe-ax-wvSx3mtudIp3uZwCNJA_lzrsUT10qujZVcJ46kAYpYhuB2hYfdAmPHRsQhw4QDJ2z03UbcaJ_UqwD_Scb6OHuQw6sBe4eqcLCC_OifVCj-KE8zOVR99App8_2FCCJi0-dHo1lMO5XK_-BVOplltb11yxg0LMBkhJEVykzrIK1Bfr3_PjJ9zP-W-dSn7bZFhBYDSUcQHnVS8QVrWkVukXK9cFS_jJiJybWRyJVtk_6lAXI6Jd2h"
                alt="用户头像"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-black text-primary italic font-headline tracking-tight">
              PlanGO
            </h1>
          </div>
          <Link
            href="/auth"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:shadow-sm active:scale-[0.98]"
          >
            {bootstrap.currentUser ? bootstrap.currentUser.name : "登录"}
          </Link>
        </div>

        {/* 创建行程表单 */}
        <CreateTripForm />
      </section>

      {/* 进行中的旅行 - 横向滚动卡片 */}
      {ongoingTrips.length > 0 && (
        <section className="rounded-3xl bg-white p-4 shadow-[0px_20px_40px_rgba(78,33,32,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-400">进行中的旅行</p>
            <div className="flex items-center gap-1 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {ongoingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* 已完成的旅行 */}
      {completedTrips.length > 0 && (
        <section className="rounded-3xl bg-white p-4 shadow-[0px_20px_40px_rgba(78,33,32,0.04)]">
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

  // 生成目的地封面图（使用 Unsplash 根据目的地关键词）
  const coverImage = `https://source.unsplash.com/300x400/?${encodeURIComponent(trip.destination)},travel,landscape`;

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="flex-shrink-0 w-[140px] rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md"
    >
      {/* 封面图 */}
      <div className="relative h-[160px] overflow-hidden">
        <img
          src={coverImage}
          alt={trip.destination}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
        {/* 目的地名称叠加在图片底部 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
          <p className="text-white text-sm font-semibold truncate">{trip.destination}</p>
        </div>
        {/* 状态标签 */}
        <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-semibold backdrop-blur-sm ${stageColor[trip.stage]}`}>
          {stageLabel[trip.stage]}
        </span>
      </div>
    </Link>
  );
}
