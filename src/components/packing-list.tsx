"use client";

import { useEffect, useState } from "react";
import type { PackingListItem, PackingCategory, PackingSubItem } from "@/lib/types";
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
      setPackingList((prev) =>
        prev.map((item) => (typeof item === "string" || item.id !== itemId ? item : { ...item, checked: currentChecked }))
      );
      console.error("更新装备清单失败:", error);
    }
  };

  const toggleSubItem = async (itemId: string, subItemName: string, currentChecked: boolean) => {
    const newChecked = !currentChecked;
    setPackingList((prev) =>
      prev.map((item) => {
        if (typeof item === "string" || item.id !== itemId || !item.subItems) return item;
        return {
          ...item,
          subItems: item.subItems.map((sub) =>
            sub.name === subItemName ? { ...sub, checked: newChecked } : sub
          ),
        };
      })
    );
    try {
      await fetch(`/api/trips/${tripId}/packing-list`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, subItemName, checked: newChecked }),
      });
    } catch (error) {
      console.error("更新子物品失败:", error);
    }
  };

  const toggleCategory = (category: PackingCategory) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const groupedItems = packingList.reduce((acc, item) => {
    if (typeof item === "string") return acc;
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<PackingCategory, PackingListItem[]>);

  const totalItems = packingList.filter((item) => typeof item !== "string").length;
  const checkedItems = packingList.reduce((sum, item) => {
    if (typeof item === "string") return sum;
    if (item.subItems && item.subItems.length > 0) {
      return sum + item.subItems.filter((sub) => sub.checked).length;
    }
    return sum + (item.checked ? 1 : 0);
  }, 0);
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
                  <div key={item.id} className="px-4 py-3">
                    {/* 分类标题 */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-slate-600">
                          {getPackingCategoryIcon(item.category)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                    </div>
                    {/* 子物品列表 */}
                    {item.subItems && item.subItems.length > 0 && (
                      <div className="flex flex-wrap gap-2 ml-11">
                        {item.subItems.map((subItem) => (
                          <button
                            key={subItem.id || subItem.name}
                            type="button"
                            onClick={() => toggleSubItem(item.id, subItem.name, subItem.checked || false)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              subItem.checked
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {subItem.checked ? (
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {subItem.name}
                              </span>
                            ) : (
                              subItem.name
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
