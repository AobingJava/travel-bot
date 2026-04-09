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

  const ongoingTrips = bootstrap.trips.filter((trip) => trip.stage === "ongoing" || trip.stage === "planning");
  const completedTrips = bootstrap.trips.filter((trip) => trip.stage === "completed");

  return (
    <>
      <header className="fixed top-0 z-50 flex w-full items-center justify-between bg-[#fbf9f7]/70 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-surface-container-highest">
            <img
              alt="用户头像"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMKvbpNKJG8j1JmkB4GxJHVe-ax-wvSx3mtudIp3uZwCNJA_lzrsUT10qujZVcJ46kAYpYhuB2hYfdAmPHRsQhw4QDJ2z03UbcaJ_UqwD_Scb6OHuQw6sBe4eqcLCC_OifVCj-KE8zOVR99App8_2FCCJi0-dHo1lMO5XK_-BVOplltb11yxg0LMBkhJEVykzrIK1Bfr3_PjJ9zP-W-dSn7bZFhBYDSUcQHnVS8QVrWkVukXK9cFS_jJiJybWRyJVtk_6lAXI6Jd2h"
            />
          </div>
          <span className="bg-gradient-to-r from-[#a03b00] to-[#c94c00] bg-clip-text font-headline text-2xl font-extrabold text-transparent">
            PlanGO
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="消息通知"
            className="text-slate-600 transition-opacity hover:opacity-80 active:scale-95"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <Link
            href="/auth"
            className="rounded-full border border-slate-200 bg-surface-container-lowest px-4 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-container-low active:scale-[0.98]"
          >
            {bootstrap.currentUser ? bootstrap.currentUser.name : "登录"}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 pb-32 pt-24">
        <section className="relative mb-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-xl">
              <h1 className="mb-4 font-headline text-5xl font-extrabold leading-tight tracking-tight text-on-surface md:text-6xl">
                让P人
                <br />
                <span className="text-primary italic">快速出门</span>
              </h1>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-[0_20px_50px_rgba(27,28,27,0.04)]">
            <CreateTripForm />
          </div>
        </section>

        {ongoingTrips.length > 0 && (
          <section id="ongoing" className="mb-14">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">进行中的旅行</h2>
              <span className="flex items-center gap-1 font-bold text-primary">
                查看全部
                {" "}
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </span>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {ongoingTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </section>
        )}

        {completedTrips.length > 0 && (
          <section className="mb-14">
            <h2 className="mb-6 font-headline text-3xl font-bold tracking-tight text-on-surface">已完成旅行</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {completedTrips.map((trip) => (
                <CompletedTripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </section>
        )}

        <section className="mb-8 mt-16">
          <h2 className="mb-8 font-headline text-3xl font-bold tracking-tight text-on-surface">精选目的地</h2>
          <div className="grid h-[500px] grid-cols-2 grid-rows-2 gap-4 md:grid-cols-4">
            <div className="group relative col-span-2 row-span-2 overflow-hidden rounded-xl">
              <img
                alt="瑞士山间湖泊"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhbcttFm8Fs7SjYndfXCY-TN48PZeFpp8T6tXIGzuwt6qWInlHuCJlorIuy7fGz30jAA0gXpJchOG6XsNjnkBblD97ooIN72yn9-JuCd5COVZvp_j70BTYJ168SQEIIw9AK5s3NgZDGFlGNuKZnEWckxLHTAvjYSzC_FrIaeR-GiDHH8H5i8zFpiunWgCYTmq6B19JOryuppypl3hHBfwBeNB_D038cZE8OfAggfFN7BaYUO4pAYiEQYr6j2I6teLY4MmXeInFvYQ"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/80">冒险</p>
                <h4 className="font-headline text-2xl font-bold text-white">瑞士阿尔卑斯</h4>
              </div>
            </div>
            <div className="group relative col-span-1 row-span-1 overflow-hidden rounded-xl">
              <img
                alt="马尔代夫海岛"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmn9wHxcKKCUANLW6milGx4ZvZ5pxz21lm9Xo535WJQGUwZhbdsFLOMzHatcO9QkmBB5Pf9gt7QSKiOfqexqlUPiWAxVyCuVsGXiEnSIMCLlE7P-J4QsubX1DAuBRrbDXIW-6DBLOLx38AYofEgYWAnmTpb4Lw8nOLES7-WJZg3lAjvy1TCOLM0xNv7Y_kN0CI0u--1E9t0vUctwtDeFtNME6kMAIaFNq7PwNTK7ySsnU5VNh4S-Pg5AL1kKChzYu6BvybocJRxAU"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/40 to-transparent p-4">
                <h4 className="font-headline text-lg font-bold text-white">马尔代夫</h4>
              </div>
            </div>
            <div className="group relative col-span-1 row-span-1 overflow-hidden rounded-xl">
              <img
                alt="京都红叶寺庙"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtz_rQgbbiTJx41snyxcM0ZFMdJrWk2YEuT81NJIQcoqSWgAHyKc6D9PY7USTla0pqqpW31qZ6hBw_ttxgE9hJixN5bORIifa4QFo4UUKO6YN7QqNr7sYKdb3KWEm-FsyX5AFos-fzijQ79Q8TUiY2YcHfjPQZlC-dQEHnKlNBi9Lryycz9Uq0xC2KHOyCIbFs8xxTiDAmIuV8h1KO4u3pPjEq5GOgyD6ji6P_zHfZ_1_s-ZF8XdfGcJPZO0wDdemBX7Wy4rY_WR0"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/40 to-transparent p-4">
                <h4 className="font-headline text-lg font-bold text-white">京都</h4>
              </div>
            </div>
            <div className="group relative col-span-2 row-span-1 overflow-hidden rounded-xl">
              <img
                alt="威尼斯水城黄昏"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCt8N3hanufWwcEhdSGhXfxVpCUO-ksKqKLE46L6yzLJAX0ttj8LiYOAMRbbN1vw1VVG18IZuq0v189BxWnki0ZWlvhVjW1hDIalUvb4Fhnq-f4iglgv01nQiQ3Wb7QxabpgbriPAlrjZZz_2Zb1hPYDtsVl0Y7B6HwMfqSkZQMi_Swd0hqpAWruxVmtSRSrLMiEWpJ2cfa8JEAwxPIndINL2wYM35uS8DsFe--ngpjKe0eXaCyRGkBFM3lo-xPkeWQWY5NQw63mV0"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/40 to-transparent p-6">
                <h4 className="font-headline text-xl font-bold text-white">威尼斯水巷</h4>
              </div>
            </div>
          </div>
        </section>
      </main>

      <HomeMobileNav />
    </>
  );
}

function TripCard({ trip }: { readonly trip: TripDocument }) {
  const coverImage = getCoverImage(trip.destination);

  const stageLabel: Record<TripStage, string> = {
    ongoing: "进行中",
    planning: "筹备中",
    completed: "已完成",
    draft: "草稿",
  };

  const stageColors: Record<TripStage, string> = {
    ongoing: "bg-tertiary-container text-on-tertiary-container",
    planning: "bg-secondary-container text-on-secondary-container",
    completed: "bg-slate-100 text-slate-600",
    draft: "bg-amber-100 text-amber-700",
  };

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1 md:flex-row"
    >
      <div className="relative h-48 overflow-hidden md:h-auto md:w-2/5">
        <img
          src={coverImage}
          alt={trip.destination}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest ${stageColors[trip.stage]}`}>
          {stageLabel[trip.stage]}
        </span>
      </div>
      <div className="flex flex-col justify-between p-6 md:w-3/5">
        <div>
          <h3 className="mb-2 font-headline text-xl font-bold leading-tight text-on-surface">
            {trip.destination} {trip.themes[0] ? `${trip.themes[0]}之旅` : "行程计划"}
          </h3>
          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">schedule</span>
              {trip.startDate || "待确认"}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">group</span>
              {trip.travelerCount}人
            </span>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end">
          <span className="text-on-surface-variant transition-colors group-hover:text-primary">
            <span className="material-symbols-outlined">more_horiz</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function CompletedTripCard({ trip }: { readonly trip: TripDocument }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-card transition hover:bg-surface-container-low active:scale-[0.99]"
    >
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-[12px]">
        <img
          src={getCoverImage(trip.destination)}
          alt={trip.destination}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-on-surface">{trip.destination}</p>
        <p className="text-[11px] text-on-surface-variant">{trip.travelerCount}人旅行</p>
      </div>
      <span className="chip-pill bg-slate-100 px-2.5 py-1 text-[9px] text-slate-600">已完成</span>
    </Link>
  );
}
