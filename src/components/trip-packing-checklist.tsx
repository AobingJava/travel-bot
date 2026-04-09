"use client";

import { useMemo, useState } from "react";
import type { PackingListItem, PackingCategory, PackingSubItem } from "@/lib/types";
import {
  getPackingCategoryLabel,
  getPackingCategoryIcon,
  getPackingCategoryCardTone,
  normalizePackingListFromApi,
  isGenericPackGroupName,
} from "@/lib/packing-list";

function tripDayCount(startDate: string, endDate: string): number {
  const s = new Date(startDate).setHours(0, 0, 0, 0);
  const e = new Date(endDate).setHours(0, 0, 0, 0);
  if (Number.isNaN(s) || Number.isNaN(e)) return 1;
  return Math.max(1, Math.ceil((e - s) / 86400000) + 1);
}

function countUnits(items: PackingListItem[]): { total: number; checked: number } {
  let total = 0;
  let checked = 0;
  for (const item of items) {
    if (item.subItems?.length) {
      for (const sub of item.subItems) {
        total += 1;
        if (sub.checked) checked += 1;
      }
    } else {
      total += 1;
      if (item.checked) checked += 1;
    }
  }
  return { total, checked };
}

const CATEGORY_ORDER: PackingCategory[] = [
  "core",
  "documents",
  "clothing",
  "electronics",
  "toiletries",
  "weather",
  "gear",
];

type TripPackingChecklistProps = {
  tripId: string;
  packingList: string[] | PackingListItem[] | undefined;
  startDate: string;
  endDate: string;
};

export function TripPackingChecklist({
  tripId,
  packingList: rawList,
  startDate,
  endDate,
}: TripPackingChecklistProps) {
  const tripDays = useMemo(() => tripDayCount(startDate, endDate), [startDate, endDate]);

  const [items, setItems] = useState<PackingListItem[]>(() => {
    if (!rawList?.length) return [];
    const arr = rawList.filter((x) => x != null) as unknown[];
    return normalizePackingListFromApi(arr, tripDays);
  });

  if (!items.length) return null;

  const grouped = items.reduce(
    (acc, item) => {
      const cat = item.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<PackingCategory, PackingListItem[]>,
  );

  const { total, checked } = countUnits(items);
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

  const persistPatch = async (body: Record<string, unknown>) => {
    try {
      await fetch(`/api/trips/${tripId}/packing-list`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.error("装备清单同步失败", e);
    }
  };

  const toggleLeaf = async (itemId: string, sub: PackingSubItem | null, currentChecked: boolean) => {
    const next = !currentChecked;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (sub) {
          return {
            ...item,
            subItems: item.subItems?.map((s) =>
              s.id === sub.id || s.name === sub.name ? { ...s, checked: next } : s,
            ),
          };
        }
        return { ...item, checked: next };
      }),
    );
    if (sub) {
      await persistPatch({ itemId, subItemName: sub.name, checked: next });
    } else {
      await persistPatch({ itemId, checked: next });
    }
  };

  return (
    <section className="space-y-8">
      <div className="flex justify-between items-end gap-4">
        <div className="space-y-2">
          <h3 className="font-headline text-3xl font-extrabold tracking-tight text-on-background">
            装备清单
          </h3>
          <p className="max-w-md text-on-surface-variant">别做那个忘带袜子的朋友。</p>
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-1 md:flex">
          <span className="rounded-full bg-tertiary-container px-4 py-1 text-xs font-bold text-on-tertiary-container">
            已打包 {progress}%
          </span>
          <span className="text-xs text-on-surface-variant">
            {checked}/{total} 项
          </span>
        </div>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-highest">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary-fixed transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {CATEGORY_ORDER.map((category) => {
          const catItems = grouped[category];
          if (!catItems?.length) return null;
          const tone = getPackingCategoryCardTone(category);

          return (
            <div key={category} className="space-y-4 rounded-lg bg-surface-container-low p-6">
              <div className="mb-2 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone.circle}`}
                >
                  <span className={`material-symbols-outlined text-xl ${tone.icon}`}>
                    {getPackingCategoryIcon(category)}
                  </span>
                </div>
                <h4 className="font-headline text-lg font-bold text-on-surface">
                  {getPackingCategoryLabel(category)}
                </h4>
              </div>

              <div className="space-y-3">
                {catItems.map((group) => {
                  const showSubgroup =
                    Boolean(group.subItems?.length) && !isGenericPackGroupName(group.name);
                  return (
                    <div key={group.id} className="space-y-3">
                      {showSubgroup ? (
                        <p className="text-sm font-semibold leading-snug text-on-surface">
                          {group.name}
                          {group.weatherDependent ? (
                            <span className="ml-2 inline-block rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                              视天气
                            </span>
                          ) : null}
                        </p>
                      ) : group.weatherDependent && !group.subItems?.length ? (
                        <p className="text-[11px] font-medium text-on-surface-variant">视天气</p>
                      ) : null}

                      {group.subItems?.length ? (
                        <div className="space-y-3">
                          {group.subItems.map((sub) => (
                            <label
                              key={sub.id}
                              className="group flex cursor-pointer items-center gap-3"
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(sub.checked)}
                                onChange={() => toggleLeaf(group.id, sub, Boolean(sub.checked))}
                                className="h-5 w-5 shrink-0 rounded border-outline text-primary focus:ring-primary"
                              />
                              <span className="min-w-0 flex-1 text-on-surface transition-colors group-hover:text-primary">
                                <span className="text-sm">{sub.name}</span>
                                {sub.quantity != null ? (
                                  <span className="ml-1.5 inline-flex items-center rounded-md bg-primary-container/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                                    ×{sub.quantity}
                                  </span>
                                ) : null}
                                {sub.quantityNote ? (
                                  <span className="mt-0.5 block text-[11px] text-on-surface-variant">
                                    {sub.quantityNote}
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <label className="group flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={Boolean(group.checked)}
                            onChange={() => toggleLeaf(group.id, null, Boolean(group.checked))}
                            className="h-5 w-5 shrink-0 rounded border-outline text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-on-surface transition-colors group-hover:text-primary">
                            {group.name}
                          </span>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
