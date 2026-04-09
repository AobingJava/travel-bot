"use client";

import { useState } from "react";
import type { TripDocument, PackingListItem, PackingCategory } from "@/lib/types";
import { InviteMemberForm } from "@/components/invite-member-form";

const categoryConfig: Record<PackingCategory, { label: string; icon: string; color: string }> = {
  core: { label: "核心必备", icon: "🎒", color: "bg-orange-50 border-orange-200 text-orange-700" },
  documents: { label: "证件文件", icon: "📄", color: "bg-blue-50 border-blue-200 text-blue-700" },
  clothing: { label: "衣物", icon: "👕", color: "bg-purple-50 border-purple-200 text-purple-700" },
  weather: { label: "天气相关", icon: "🌦️", color: "bg-cyan-50 border-cyan-200 text-cyan-700" },
  electronics: { label: "数码电子", icon: "🔌", color: "bg-gray-50 border-gray-200 text-gray-700" },
  toiletries: { label: "个护健康", icon: "🧴", color: "bg-green-50 border-green-200 text-green-700" },
};

function isPackingListItem(item: string | PackingListItem): item is PackingListItem {
  return typeof item !== "string";
}

export function TripOverview({ trip, canInvite }: { trip: TripDocument; canInvite: boolean }) {
  const [packingItems, setPackingItems] = useState<PackingListItem[]>(() => {
    if (!trip.packingList) return [];
    return trip.packingList.map((item, index) =>
      isPackingListItem(item)
        ? { ...item, checked: item.checked ?? false }
        : {
            id: `pack-${index}`,
            name: item,
            category: "core" as PackingCategory,
            checked: false,
          },
    );
  });

  const handleToggleItem = (itemId: string) => {
    setPackingItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  // 按分类组织物品
  const itemsByCategory = packingItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<PackingCategory, PackingListItem[]>,
  );

  return (
    <section className="space-y-3">
      {/* 邀请旅伴卡片 - 置顶 */}
      {canInvite && <InviteMemberForm trip={trip} />}

      {/* 装备清单 - 按分类显示 */}
      {packingItems.length > 0 && (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-400">装备清单</p>
            <span className="text-[11px] text-slate-500">
              {packingItems.filter((item) => item.checked).length}/{packingItems.length} 已准备
            </span>
          </div>
          <div className="space-y-3">
            {Object.entries(itemsByCategory).map(([category, items]) => {
              const config = categoryConfig[category as PackingCategory];
              if (!items.length) return null;

              return (
                <div key={category}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[14px]">{config.icon}</span>
                    <span className="text-[13px] font-semibold text-slate-700">{config.label}</span>
                    {items.some((item) => item.weatherDependent) && (
                      <span className="text-[10px] text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded-full">
                        天气相关
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-all ${
                          item.checked
                            ? "bg-emerald-50 border border-emerald-200"
                            : "bg-slate-50 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                            item.checked
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-slate-300"
                          }`}
                        >
                          {item.checked && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <span
                          className={`text-[12px] font-medium ${
                            item.checked ? "text-emerald-700 line-through" : "text-slate-700"
                          }`}
                        >
                          {item.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
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
