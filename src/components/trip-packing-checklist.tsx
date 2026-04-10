"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import type { PackingListItem, PackingCategory, PackingSubItem } from "@/lib/types";
import {
  getPackingCategoryLabel,
  getPackingCategoryIcon,
  getPackingCategoryCardTone,
  normalizePackingListFromApi,
} from "@/lib/packing-list";

const SWIPE_DELETE_WIDTH = 72;

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
    if (Array.isArray(item.subItems)) {
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

/**
 * 向左滑主行，右侧露出底层「删除」；点击删除后执行 onDelete。
 * 使用 Pointer 事件，触摸与鼠标均可。
 */
function SwipeToDeleteRow({
  children,
  onDelete,
  className = "",
  slideBgClassName = "bg-surface-container-low",
}: {
  children: ReactNode;
  onDelete: () => void;
  className?: string;
  /** 左滑内容区底衬，须不透明才能完全盖住底层「删除」 */
  slideBgClassName?: string;
}) {
  const [open, setOpen] = useState(0);
  const [gesture, setGesture] = useState(false);
  const startX = useRef(0);
  const openAtStart = useRef(0);
  const moved = useRef(false);
  const dragging = useRef(false);

  const endDrag = () => {
    dragging.current = false;
    setOpen((o) => (o > SWIPE_DELETE_WIDTH / 2 ? SWIPE_DELETE_WIDTH : 0));
  };

  return (
    <div className={`relative overflow-hidden rounded-md ${className}`}>
      <div className="absolute inset-y-0 right-0 z-0 flex w-[4.5rem] items-stretch bg-error">
        <button
          type="button"
          className="flex w-full items-center justify-center text-xs font-bold text-on-error"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(0);
            onDelete();
          }}
        >
          删除
        </button>
      </div>
      <div
        role="presentation"
        className={`relative z-[1] w-full touch-pan-y ${slideBgClassName}`}
        style={{
          transform: `translateX(-${open}px)`,
          transition: gesture ? "none" : "transform 0.2s ease-out",
        }}
        onPointerDown={(e) => {
          if (e.button !== 0 && e.pointerType === "mouse") return;
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = true;
          setGesture(true);
          startX.current = e.clientX;
          openAtStart.current = open;
          moved.current = false;
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const dx = startX.current - e.clientX;
          if (Math.abs(dx) > 6) moved.current = true;
          const next = Math.max(0, Math.min(SWIPE_DELETE_WIDTH, openAtStart.current + dx));
          setOpen(next);
        }}
        onPointerUp={(e) => {
          if (dragging.current) {
            try {
              e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
              /* already released */
            }
            endDrag();
            setGesture(false);
          }
        }}
        onPointerCancel={() => {
          dragging.current = false;
          setGesture(false);
          setOpen(0);
        }}
        onClickCapture={(e) => {
          if (moved.current) {
            e.preventDefault();
            e.stopPropagation();
            moved.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** 不展示「天气用品」「运动装备」独立板块；该类物品在分组展示时并入核心必备 */
const CATEGORY_ORDER: PackingCategory[] = [
  "core",
  "documents",
  "clothing",
  "electronics",
  "toiletries",
];

/** 按分组 id 稳定取色：只饰标题条左侧线与文字（不再套内层卡片） */
const GROUP_DOPAMINE = [
  { border: "border-l-fuchsia-500", title: "text-fuchsia-900 dark:text-fuchsia-100" },
  { border: "border-l-sky-500", title: "text-sky-900 dark:text-sky-100" },
  { border: "border-l-amber-500", title: "text-amber-900 dark:text-amber-100" },
  { border: "border-l-emerald-500", title: "text-emerald-900 dark:text-emerald-100" },
  { border: "border-l-violet-500", title: "text-violet-900 dark:text-violet-100" },
  { border: "border-l-rose-500", title: "text-rose-900 dark:text-rose-100" },
  { border: "border-l-orange-500", title: "text-orange-900 dark:text-orange-100" },
  { border: "border-l-cyan-500", title: "text-cyan-900 dark:text-cyan-100" },
] as const;

function packingGroupAccent(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i);
  const idx = Math.abs(h) % GROUP_DOPAMINE.length;
  return GROUP_DOPAMINE[idx];
}

type TripPackingChecklistProps = {
  tripId: string;
  packingList: string[] | PackingListItem[] | undefined;
  startDate: string;
  endDate: string;
  /** 来自 trip.banner，自定义各大类标题 */
  packingCategoryLabels?: Partial<Record<PackingCategory, string>>;
};

export function TripPackingChecklist({
  tripId,
  packingList: rawList,
  startDate,
  endDate,
  packingCategoryLabels,
}: TripPackingChecklistProps) {
  const router = useRouter();
  const tripDays = useMemo(() => tripDayCount(startDate, endDate), [startDate, endDate]);

  const categoryTitle = useCallback(
    (cat: PackingCategory) => packingCategoryLabels?.[cat]?.trim() || getPackingCategoryLabel(cat),
    [packingCategoryLabels],
  );

  const [items, setItems] = useState<PackingListItem[]>(() => {
    if (!rawList?.length) return [];
    const arr = rawList.filter((x) => x != null) as unknown[];
    return normalizePackingListFromApi(arr, tripDays);
  });

  const persistList = useCallback(
    async (next: PackingListItem[]) => {
      try {
        await fetch(`/api/trips/${tripId}/packing-list`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packingList: next }),
        });
      } catch (e) {
        console.error("装备清单保存失败", e);
      }
    },
    [tripId],
  );

  const applyAndPersist = useCallback(
    (updater: (prev: PackingListItem[]) => PackingListItem[]) => {
      setItems((prev) => {
        const next = updater(prev);
        void persistList(next);
        return next;
      });
    },
    [persistList],
  );

  const grouped = useMemo(() => {
    const acc = items.reduce(
      (a, item) => {
        const cat = item.category;
        if (!a[cat]) a[cat] = [];
        a[cat].push(item);
        return a;
      },
      {} as Record<PackingCategory, PackingListItem[]>,
    );
    for (const fold of ["weather", "gear"] as const) {
      const extra = acc[fold];
      if (extra?.length) {
        acc.core = [...(acc.core ?? []), ...extra];
        delete acc[fold];
      }
    }
    return acc;
  }, [items]);

  const { total, checked } = countUnits(items);
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

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
    try {
      await fetch(`/api/trips/${tripId}/packing-list`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          sub ? { itemId, subItemName: sub.name, checked: next } : { itemId, checked: next },
        ),
      });
    } catch (e) {
      console.error("装备清单同步失败", e);
    }
  };

  const editCategoryTitle = async (category: PackingCategory) => {
    if (typeof window === "undefined") return;
    const current = categoryTitle(category);
    const next = window.prompt("板块标题（留空则恢复默认）", current);
    if (next === null) return;
    const t = next.trim();
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packingCategoryLabels: {
            [category]: t.length > 0 ? t : null,
          },
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        window.alert(data.error ?? "保存失败");
        return;
      }
      router.refresh();
    } catch {
      window.alert("网络异常，请重试");
    }
  };

  const removeGroup = (groupId: string) => {
    applyAndPersist((prev) => prev.filter((item) => item.id !== groupId));
  };

  const removeSubItem = (groupId: string, subId: string) => {
    applyAndPersist((prev) =>
      prev
        .map((item) => {
          if (item.id !== groupId || !Array.isArray(item.subItems)) return item;
          const subItems = item.subItems.filter((s) => s.id !== subId);
          if (subItems.length === 0) return null;
          return { ...item, subItems };
        })
        .filter((x): x is PackingListItem => x != null),
    );
  };

  return (
    <section className="space-y-8">
      <div className="flex items-end justify-between gap-4">
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
          const catItems = grouped[category] ?? [];
          const tone = getPackingCategoryCardTone(category);

          return (
            <div key={category} className="flex flex-col rounded-lg bg-surface-container-low p-6">
              <div className="mb-2 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone.circle}`}
                >
                  <span className={`material-symbols-outlined text-xl ${tone.icon}`}>
                    {getPackingCategoryIcon(category)}
                  </span>
                </div>
                <button
                  type="button"
                  className="font-headline min-w-0 truncate text-left text-lg font-bold text-on-surface transition hover:text-primary"
                  onClick={() => void editCategoryTitle(category)}
                >
                  {categoryTitle(category)}
                </button>
              </div>

              {catItems.length === 0 ? null : (
                <div className="space-y-3">
                  {catItems.map((group) => {
                    const isSection = Array.isArray(group.subItems);

                    if (isSection) {
                      return (
                        <div key={group.id} className="space-y-3">
                          {!group.subItems!.length ? (
                            <div className="space-y-2">
                              <p className="text-xs text-on-surface-variant">
                                暂无子项；不需要时可移除此空分组。
                              </p>
                              <button
                                type="button"
                                className="text-xs text-on-surface-variant underline decoration-outline/50 underline-offset-2 hover:text-on-surface"
                                onClick={() => removeGroup(group.id)}
                              >
                                移除此空分组
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {group.subItems!.map((sub) => (
                                <SwipeToDeleteRow
                                  key={sub.id}
                                  onDelete={() => removeSubItem(group.id, sub.id)}
                                >
                                  <label className="group flex min-h-[44px] cursor-pointer items-center gap-3 py-0.5 pr-1">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(sub.checked)}
                                      onChange={() =>
                                        toggleLeaf(group.id, sub, Boolean(sub.checked))
                                      }
                                      className="h-5 w-5 shrink-0 rounded border-outline text-primary focus:ring-primary"
                                    />
                                    <span className="min-w-0 flex-1 text-on-surface transition-colors group-hover:text-primary">
                                      <span className="text-sm">{sub.name}</span>
                                      {sub.quantity != null && sub.quantity > 1 ? (
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
                                </SwipeToDeleteRow>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const acc = packingGroupAccent(group.id);
                    return (
                      <div key={group.id} className="space-y-3">
                        {group.weatherDependent ? (
                          <p className="text-[11px] font-medium text-on-surface-variant">视天气</p>
                        ) : null}
                        <SwipeToDeleteRow onDelete={() => removeGroup(group.id)}>
                          <div className={`border-l-4 py-0.5 pl-3 pr-1 ${acc.border}`}>
                            <label className="group flex min-h-[44px] cursor-pointer items-center gap-3">
                              <input
                                type="checkbox"
                                checked={Boolean(group.checked)}
                                onChange={() =>
                                  toggleLeaf(group.id, null, Boolean(group.checked))
                                }
                                className="h-5 w-5 shrink-0 rounded border-outline text-primary focus:ring-primary"
                              />
                              <span
                                className={`text-sm transition-colors group-hover:text-primary ${acc.title}`}
                              >
                                {group.name}
                              </span>
                            </label>
                          </div>
                        </SwipeToDeleteRow>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
