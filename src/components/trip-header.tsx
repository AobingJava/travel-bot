import type { SessionUser, TripDocument } from "@/lib/types";
import { formatDateRange, getTripStageLabel } from "@/lib/utils";

const avatarUrls = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCMKvbpNKJG8j1JmkB4GxJHVe-ax-wvSx3mtudIp3uZwCNJA_lzrsUT10qujZVcJ46kAYpYhuB2hYfdAmPHRsQhw4QDJ2z03UbcaJ_UqwD_Scb6OHuQw6sBe4eqcLCC_OifVCj-KE8zOVR99App8_2FCCJi0-dHo1lMO5XK_-BVOplltb11yxg0LMBkhJEVykzrIK1Bfr3_PjJ9zP-W-dSn7bZFhBYDSUcQHnVS8QVrWkVukXK9cFS_jJiJybWRyJVtk_6lAXI6Jd2h",
];

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
        {currentUser ? (
          <div className="w-8 h-8 rounded-full ring-2 ring-white/30 overflow-hidden">
            <img
              src={avatarUrls[0]}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full ring-2 ring-white/30 bg-white/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        )}
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
