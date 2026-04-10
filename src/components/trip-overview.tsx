"use client";

import type { TripDocument } from "@/lib/types";
import { InviteMemberForm } from "@/components/invite-member-form";
import { TripPackingChecklist } from "@/components/trip-packing-checklist";

export function TripOverview({ trip, canInvite }: { trip: TripDocument; canInvite: boolean }) {
  return (
    <section className="space-y-3">
      {canInvite && <InviteMemberForm key={trip.id} trip={trip} />}

      {trip.packingList && trip.packingList.length > 0 ? (
        <TripPackingChecklist
          tripId={trip.id}
          packingList={trip.packingList}
          startDate={trip.startDate}
          endDate={trip.endDate}
          packingCategoryLabels={trip.banner.packingCategoryLabels}
        />
      ) : null}

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
