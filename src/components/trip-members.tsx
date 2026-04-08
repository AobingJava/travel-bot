import { InviteMemberForm } from "@/components/invite-member-form";
import type { TripDocument } from "@/lib/types";

const statusLabel = {
  confirmed: "已确认",
  pending: "待确认",
} as const;

export function TripMembers({
  trip,
  canInvite,
}: {
  trip: TripDocument;
  canInvite: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)]">
        <p className="text-[13px] text-white/70">{trip.destination}</p>
        <h2 className="mt-1.5 text-2xl font-bold">同行旅伴</h2>
        <p className="mt-1 text-[13px] text-white/75">{trip.travelerCount} 人同行 · 邀请状态实时同步</p>
      </div>

      <div className="space-y-2">
        {trip.members.map((member) => (
          <article
            key={member.id}
            className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-600">
              {member.avatarText}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-[14px] font-semibold text-slate-950">
                  {member.name}
                </h3>
                {member.role === "owner" ? (
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                    发起人
                  </span>
                ) : null}
              </div>
              <p className="text-[12px] text-slate-400">{member.email}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                member.inviteStatus === "confirmed"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {statusLabel[member.inviteStatus]}
            </span>
          </article>
        ))}
      </div>

      {canInvite ? <InviteMemberForm tripId={trip.id} /> : null}
    </section>
  );
}
