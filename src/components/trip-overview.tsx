import type { TripDocument } from "@/lib/types";
import { getThemeLabel } from "@/lib/utils";
import { InviteMemberForm } from "@/components/invite-member-form";

function daysUntil(dateString: string): number {
  const now = new Date();
  const target = new Date(dateString);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function TripOverview({ trip, canInvite }: { trip: TripDocument; canInvite: boolean }) {
  const daysLeft = daysUntil(trip.startDate);

  return (
    <section className="space-y-3">
      {/* 邀请旅伴卡片 - 置顶 */}
      {canInvite && <InviteMemberForm tripId={trip.id} />}

      {/* 行程动态卡片 */}
      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-950">行程动态</h3>
            <p className="text-sm text-slate-500">
              大家已准备就绪。距离出发还有{daysLeft}天！
            </p>
          </div>
          {/* 旅伴头像列表 */}
          <div className="flex -space-x-2">
            {trip.members.slice(0, 4).map((member, index) => (
              <div
                key={member.id}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-[11px] font-bold text-slate-600 ring-2 ring-white"
                style={{ zIndex: 4 - index }}
              >
                {member.avatarText}
              </div>
            ))}
            {trip.members.length > 4 && (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 ring-2 ring-white"
                style={{ zIndex: 0 }}
              >
                +{trip.members.length - 4}
              </div>
            )}
          </div>
          {/* 进度条 */}
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all"
              style={{ width: `${Math.min(100, (1 - daysLeft / 14) * 100)}%` }}
            />
          </div>
        </div>
      </article>

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
      </div>

      {/* 装备清单 */}
      {trip.packingList && trip.packingList.length > 0 && (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-medium text-slate-400">装备清单</p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {trip.packingList.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"
              >
                <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                <span className="text-[13px] font-medium text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </article>
      )}

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
