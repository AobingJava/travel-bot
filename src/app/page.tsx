import Link from "next/link";

import { CreateTripForm } from "@/components/create-trip-form";
import { HomeMobileNav } from "@/components/home-mobile-nav";
import { getHomeBootstrap } from "@/lib/app-service";
import { formatDateRange, getThemeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const bootstrap = await getHomeBootstrap();
  const featuredTrip = bootstrap.trips.find(
    (trip) => trip.id === bootstrap.featuredTripId,
  );

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

      {/* Featured trip */}
      {featuredTrip ? (
        <section className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-400">最近的旅行计划</p>
              <h2 className="mt-1.5 text-xl font-bold text-slate-950">
                {featuredTrip.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {formatDateRange(featuredTrip.startDate, featuredTrip.endDate)}
              </p>
            </div>
            <Link
              href={`/trips/${featuredTrip.id}`}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.97]"
            >
              查看
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)]">
              <div className="flex items-center">
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  实时更新
                </span>
              </div>
              <p className="mt-3 text-base font-semibold">{featuredTrip.banner.title}</p>
              <p className="mt-2 text-[13px] leading-6 text-white/80">
                {featuredTrip.banner.body}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
              <p className="text-xs font-medium text-slate-400">这次旅行的关键词</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {featuredTrip.themes.map((theme) => (
                  <span
                    key={theme}
                    className="rounded-full bg-mint-100 px-2.5 py-1.5 text-[11px] font-semibold text-mint-700"
                  >
                    {getThemeLabel(theme)}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[13px] leading-6 text-slate-500">
                旅伴邀请、任务完成和行程变更都会被写进动态流，所有人都能看到最新状态。
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Highlights */}
      <section className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <p className="text-xs font-medium text-slate-400">这版的核心体验</p>
        <div className="mt-3 space-y-2">
          {[
            "创建旅行页默认就是移动端表单，不再使用桌面双栏。",
            "登录完全独立到 /auth 页面，首页只保留入口。",
            "底部导航和详情页保持一致，可直接切到任务、旅伴、动态。",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-[13px] leading-6 text-slate-600"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <HomeMobileNav featuredTripId={featuredTrip?.id} />
    </main>
  );
}
