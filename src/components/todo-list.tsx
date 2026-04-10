"use client";

import type { TripDocument } from "@/lib/types";
import { InviteMemberForm } from "@/components/invite-member-form";
import { TripPackingChecklist } from "@/components/trip-packing-checklist";

export function TodoList({ trip, canInvite }: { trip: TripDocument; canInvite: boolean }) {
  return (
    <section className="space-y-3">
      {/* 卡片样式在 InviteMemberForm 根节点，此处不再套一层避免双边框 */}
      {canInvite ? <InviteMemberForm key={trip.id} trip={trip} /> : null}

      {trip.packingList && trip.packingList.length > 0 ? (
        <TripPackingChecklist
          tripId={trip.id}
          packingList={trip.packingList}
          startDate={trip.startDate}
          endDate={trip.endDate}
          packingCategoryLabels={trip.banner.packingCategoryLabels}
        />
      ) : null}
    </section>
  );
}
