import Link from "next/link";

import type { SessionUser, TripDocument } from "@/lib/types";
import { formatDateRange, getTripStageLabel } from "@/lib/utils";

export function TripHeader({
  trip,
  currentUser,
}: {
  trip: TripDocument;
  currentUser: SessionUser | null;
}) {
  return (
    <header className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-[13px] font-medium text-slate-400 transition hover:text-slate-700 active:scale-[0.98]"
        >
          ← 返回
        </Link>
        <Link
          href={`/auth?redirect=/trips/${trip.id}`}
          className="rounded-full bg-slate-950 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-slate-800 active:scale-[0.97]"
        >
          {currentUser ? currentUser.name : "登录"}
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
            {getTripStageLabel(trip.stage)}
          </span>
          <span className="text-[12px] text-white/70">{trip.travelerCount} 人同行</span>
        </div>
        <h1 className="mt-2.5 text-2xl font-bold tracking-tight">{trip.name}</h1>
        <p className="mt-1 text-[13px] text-white/75">{formatDateRange(trip.startDate, trip.endDate)}</p>
      </div>
    </header>
  );
}
