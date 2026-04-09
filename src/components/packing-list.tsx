"use client";

import { useEffect, useState } from "react";
import type { PackingListItem, PackingCategory } from "@/lib/types";
import { getPackingCategoryLabel, getPackingCategoryIcon } from "@/lib/packing-list";

interface PackingListProps {
  tripId: string;
}

const categoryOrder: PackingCategory[] = ["core", "documents", "clothing", "electronics", "toiletries", "weather"];

export function PackingList({ tripId }: PackingListProps) {
  const [packingList, setPackingList] = useState<PackingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<PackingCategory, boolean>>({
    core: true,
    documents: true,
    clothing: true,
    electronics: true,
    toiletries: true,
    weather: false,
  });

  useEffect(() => {
    fetch(`/api/trips/${tripId}/packing-list`)
      .then((res) => res.json())
      .then((data) => {
        setPackingList(data.packingList || []);
        setLoading(false);
      })
      .catch(console.error);
  }, [tripId]);

  const toggleItem = async (itemId: string, currentChecked: boolean) => {
    const newChecked = !currentChecked;

    // 乐观更新
    setPackingList((prev) =>
      prev.map((item) => (typeof item === "string" || item.id !== itemId ? item : { ...item, checked: newChecked }))
    );

    try {
      await fetch(`/api/trips/${tripId}/packing-list`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, checked: newChecked }),
      });
    } catch (error) {
      // 失败时回滚
      setPackingList((prev) =>
        prev.map((item) => (typeof item === "string" || item.id !== itemId ? item : { ...item, checked: currentChecked }))
      );
      console.error("更新装备清单失败:", error);
    }
  };

  const toggleCategory = (category: PackingCategory) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  // 按分类分组
  const groupedItems = packingList.reduce((acc, item) => {
    if (typeof item === "string") return acc;
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<PackingCategory, PackingListItem[]>);

  // 计算进度
  const totalItems = packingList.filter((item) => typeof item !== "string").length;
  const checkedItems = packingList.filter((item) => typeof item !== "string" && item.checked).length;
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 rounded-full border-2 border-slate-200 border-t-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 进度条 */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-600">已打包</span>
          <span className="text-xs font-semibold text-emerald-700">{checkedItems}/{totalItems} ({progress}%)</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 分类列表 */}
      {categoryOrder.map((category) => {
        const items = groupedItems[category] || [];
        if (items.length === 0) return null;

        const isExpanded = expandedCategories[category];
        const categoryChecked = items.filter((item) => item.checked).length;

        return (
          <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-sm text-slate-600">
                    {getPackingCategoryIcon(category)}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-700">{getPackingCategoryLabel(category)}</p>
                  <p className="text-xs text-slate-500">{categoryChecked}/{items.length} 已准备</p>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked || false}
                      onChange={() => toggleItem(item.id, item.checked || false)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={`text-sm flex-1 ${item.checked ? "text-slate-400 line-through" : "text-slate-700"}`}>
                      {item.name}
                    </span>
                    {item.weatherDependent && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        天气
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {packingList.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          暂无装备清单
        </div>
      )}
    </div>
  );
}
