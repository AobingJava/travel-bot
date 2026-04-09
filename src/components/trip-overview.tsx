import type { TripDocument } from "@/lib/types";
import { InviteMemberForm } from "@/components/invite-member-form";

export function TripOverview({ trip, canInvite }: { trip: TripDocument; canInvite: boolean }) {
  return (
    <section className="space-y-3">
      {/* 邀请旅伴卡片 - 置顶 */}
      {canInvite && <InviteMemberForm trip={trip} />}

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
