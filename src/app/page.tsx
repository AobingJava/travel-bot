import Link from "next/link";

import { CreateTripForm } from "@/components/create-trip-form";
import { HomeMobileNav } from "@/components/home-mobile-nav";
import { getHomeBootstrap } from "@/lib/app-service";
import type { TripStage, TripDocument } from "@/lib/types";

export const dynamic = "force-dynamic";

// 根据目的地生成封面图
function getCoverImage(destination: string): string {
  const destMap: Record<string, string> = {
    "日本": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop",
    "东京": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop",
    "京都": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop",
    "大阪": "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&h=300&fit=crop",
    "泰国": "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop",
    "曼谷": "https://images.unsplash.com/photo-1506665531195-35660a000bcd?w=400&h=300&fit=crop",
    "海边": "https://images.unsplash.com/photo-1507525428034-b723cf961d9e?w=400&h=300&fit=crop",
    "三亚": "https://images.unsplash.com/photo-1540206395-688085723adb?w=400&h=300&fit=crop",
    "马尔代夫": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=300&fit=crop",
    "韩国": "https://images.unsplash.com/photo-1538485399081-719218adee04?w=400&h=300&fit=crop",
    "首尔": "https://images.unsplash.com/photo-1538485399081-719218adee04?w=400&h=300&fit=crop",
    "巴黎": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop",
    "伦敦": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop",
    "美国": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop",
    "纽约": "https://images.unsplash.com/photo-1496449903678-68ddcb189a24?w=400&h=300&fit=crop",
    "澳洲": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=300&fit=crop",
    "悉尼": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=300&fit=crop",
    "新加坡": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=300&fit=crop",
    "冰岛": "https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=400&h=300&fit=crop",
    "瑞士": "https://images.unsplash.com/photo-1531209842466-b9f234f93899?w=400&h=300&fit=crop",
  };

  for (const [key, url] of Object.entries(destMap)) {
    if (destination.includes(key)) {
      return url;
    }
  }

  // 默认封面 - 旅行风景
  return "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop";
}

export default async function HomePage() {
  const bootstrap = await getHomeBootstrap();

  // 按状态分类旅行计划
  const ongoingTrips = bootstrap.trips.filter((trip) => trip.stage === "ongoing" || trip.stage === "planning");
  const completedTrips = bootstrap.trips.filter((trip) => trip.stage === "completed");

  return (
    <main className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 pt-6 pb-28 sm:pt-10">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary-container/30">
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
          className="rounded-full border border-slate-200 bg-surface-container-lowest px-4 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-container-low active:scale-[0.98]"
        >
          {bootstrap.currentUser ? bootstrap.currentUser.name : "登录"}
        </Link>
      </header>

      {/* 创建行程表单卡片 - 使用 elevated 卡片样式 */}
      <section className="rounded-[24px] bg-surface-container-lowest p-5 shadow-ambient">
        <div className="mb-4">
          <h2 className="text-[28px] font-black font-display text-on-surface">Plan</h2>
          <p className="text-xs text-on-surface-variant mt-1">输入你想去哪里？</p>
        </div>
        <CreateTripForm />
      </section>

      {/* 进行中的旅行 - 横向滚动卡片 */}
      {ongoingTrips.length > 0 && (
        <section className="rounded-[24px] bg-surface-container-lowest p-4 shadow-ambient">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold font-display text-on-surface">进行中的旅行</h2>
            <div className="flex items-center gap-1 text-on-surface-variant/60">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {ongoingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* 已完成的旅行 - 列表样式 */}
      {completedTrips.length > 0 && (
        <section className="rounded-[24px] bg-surface-container-lowest p-4 shadow-ambient">
          <h2 className="text-sm font-bold font-display text-on-surface mb-3">已完成的旅行</h2>
          <div className="space-y-2">
            {completedTrips.map((trip) => (
              <CompletedTripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      <HomeMobileNav />
    </main>
  );
}

// 进行中的旅行卡片 - 封面 + 地名
function TripCard({ trip }: { readonly trip: TripDocument }) {
  const coverImage = getCoverImage(trip.destination);

  const stageLabel: Record<TripStage, string> = {
    ongoing: "进行中",
    planning: "筹备中",
    completed: "已完成",
    draft: "草稿",
  };

  const stageColors: Record<TripStage, string> = {
    ongoing: "bg-emerald-100 text-emerald-700",
    planning: "bg-blue-100 text-blue-700",
    completed: "bg-slate-100 text-slate-600",
    draft: "bg-amber-100 text-amber-700",
  };

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group flex-shrink-0 w-[160px] rounded-[20px] overflow-hidden bg-surface-container-lowest shadow-card transition-all duration-300 hover:shadow-float active:scale-[0.98]"
    >
      {/* 封面图 */}
      <div className="relative h-[180px] overflow-hidden">
        <img
          src={coverImage}
          alt={trip.destination}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* 渐变叠加 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        {/* 状态标签 */}
        <span className={`absolute top-2.5 right-2.5 chip-pill px-2.5 py-1 text-[9px] backdrop-blur-sm bg-white/90 ${stageColors[trip.stage]}`}>
          {stageLabel[trip.stage]}
        </span>
        {/* 目的地名称 */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-base font-bold font-display drop-shadow-lg">
            {trip.destination}
          </p>
          <p className="text-white/80 text-[10px] mt-0.5">
            {trip.travelerCount}人 · {trip.themes[0] || "旅行"}
          </p>
        </div>
      </div>
    </Link>
  );
}

// 已完成的旅行卡片 - 简约列表
function CompletedTripCard({ trip }: { readonly trip: TripDocument }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="flex items-center gap-3 rounded-[16px] bg-surface-container-low p-3 transition hover:bg-surface-container active:scale-[0.99]"
    >
      <div className="w-12 h-12 rounded-[12px] overflow-hidden flex-shrink-0">
        <img
          src={getCoverImage(trip.destination)}
          alt={trip.destination}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-on-surface truncate">
          {trip.destination}
        </p>
        <p className="text-[11px] text-on-surface-variant">
          {trip.travelerCount}人旅行
        </p>
      </div>
      <span className="chip-pill px-2.5 py-1 text-[9px] bg-slate-100 text-slate-600">
        已完成
      </span>
    </Link>
  );
}
