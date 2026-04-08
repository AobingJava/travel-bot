import type { TripDocument } from "@/lib/types";
import { formatDateRange, getThemeLabel, getTripStageLabel } from "@/lib/utils";

export function TripOverview({ trip }: { trip: TripDocument }) {
  return (
    <section className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Wander</p>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
              {getTripStageLabel(trip.stage)}
            </span>
            <span className="text-[12px] text-white/70">{trip.travelerCount} 人同行</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{trip.name}</h1>
          <p className="text-[13px] text-white/75">{formatDateRange(trip.startDate, trip.endDate)}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-medium text-slate-400">旅行主题</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {trip.themes.map((theme) => (
              <span
                key={theme}
                className="rounded-full bg-mint-100 px-2.5 py-1.5 text-[11px] font-semibold text-mint-700"
              >
                {getThemeLabel(theme)}
              </span>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-medium text-slate-400">AI 调整原则</p>
          <p className="mt-2.5 text-[13px] leading-6 text-slate-600">
            优先把天气窗口敏感的任务提到前面，同时保留一条室内备选，保证多人协作下也能稳定推进。
          </p>
        </article>
      </div>

      <div className="space-y-2">
        {trip.dailySuggestions.map((suggestion) => (
          <article
            key={suggestion.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
              {suggestion.label}
            </p>
            <h3 className="mt-1.5 text-base font-semibold text-slate-950">{suggestion.title}</h3>
            <p className="mt-1.5 text-[13px] leading-6 text-slate-500">{suggestion.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
