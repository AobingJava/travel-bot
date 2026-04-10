"use client";

import { useEffect, useState } from "react";
import type { PackingCategory, PackingListItem } from "@/lib/types";
import { TripPackingChecklist } from "@/components/trip-packing-checklist";

interface PackingListProps {
  tripId: string;
}

export function PackingList({ tripId }: PackingListProps) {
  const [packingList, setPackingList] = useState<string[] | PackingListItem[] | undefined>(undefined);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [packingCategoryLabels, setPackingCategoryLabels] = useState<
    Partial<Record<PackingCategory, string>> | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/trips/${tripId}/packing-list`).then((r) => r.json()),
      fetch(`/api/trips/${tripId}`).then((r) => r.json()),
    ])
      .then(([packRes, tripRes]) => {
        if (cancelled) return;
        setPackingList(packRes.packingList ?? []);
        const t = tripRes.trip;
        if (t) {
          setStartDate(t.startDate ?? "");
          setEndDate(t.endDate ?? "");
          setPackingCategoryLabels(t.banner?.packingCategoryLabels);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
      </div>
    );
  }

  if (!packingList?.length) {
    return (
      <div className="rounded-lg bg-surface-container-low p-8 text-center text-sm text-on-surface-variant">
        暂无装备清单
      </div>
    );
  }

  return (
    <TripPackingChecklist
      tripId={tripId}
      packingList={packingList}
      startDate={startDate || "2000-01-01"}
      endDate={endDate || startDate || "2000-01-01"}
      packingCategoryLabels={packingCategoryLabels}
    />
  );
}
