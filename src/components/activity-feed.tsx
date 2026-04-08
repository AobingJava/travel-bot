import type { TripDocument } from "@/lib/types";

export function ActivityFeed({ trip }: { trip: TripDocument }) {
  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
        <p className="text-xs font-medium text-slate-400">最新动态通知</p>
        <h2 className="mt-1.5 text-xl font-bold text-slate-950">所有人都知道发生了什么</h2>
      </div>

      <div className="space-y-2">
        {trip.events.map((event) => (
          <article
            key={event.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[14px] font-semibold text-slate-950">{event.title}</p>
                <p className="text-[13px] leading-6 text-slate-500">{event.body}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                {event.actorName}
              </span>
            </div>
            <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-300">
              {new Intl.DateTimeFormat("zh-CN", {
                month: "numeric",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(event.createdAt))}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
