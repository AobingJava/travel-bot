"use client";

import { useState } from "react";
import { TripDocument } from "@/lib/types";

interface MemoryViewProps {
  trip: TripDocument;
}

export function MemoryView({ trip }: MemoryViewProps) {
  const [isEndingTrip, setIsEndingTrip] = useState(false);

  // 从 trip 任务中计算行程天数
  const tripDays = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // 从 trip 任务中计算打卡地点数量
  const visitedPlaces = trip.tasks.filter((t) => t.phase === "during").length;

  // 模拟卡路里消耗数据
  const caloriesBurned = 2450;

  const endTrip = async () => {
    if (!confirm("确定要结束这个行程吗？结束后将无法修改。")) return;

    setIsEndingTrip(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        globalThis.location.reload();
      }
    } catch (error) {
      console.error("结束行程失败", error);
      alert("结束行程失败，请稍后再试");
    } finally {
      setIsEndingTrip(false);
    }
  };

  const generateMemory = () => {
    globalThis.location.href = `/trips/${trip.id}/memory/result`;
  };

  return (
    <section className="space-y-6 pb-8">
      {/* 行程统计卡片 - 置顶 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-indigo-100 p-4 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-bold uppercase opacity-70 text-indigo-700 mb-1">总行程</p>
          <div className="flex items-center gap-1">
            <h4 className="text-xl font-black italic text-indigo-900">{tripDays}天</h4>
          </div>
          <svg className="h-5 w-5 text-indigo-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="rounded-xl bg-amber-100 p-4 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-bold opacity-70 text-amber-700 mb-1">消耗卡路里</p>
          <h4 className="text-xl font-black text-amber-900">{caloriesBurned}</h4>
          <svg className="h-5 w-5 text-amber-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657L8 9l-2 2m2-2l10 10m0 0l-2-2m2 2V9" />
          </svg>
        </div>
        <div className="rounded-xl bg-emerald-100 p-4 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-bold uppercase text-emerald-700 mb-1">打卡新地点</p>
          <h4 className="text-xl font-black text-emerald-900">{visitedPlaces}</h4>
          <svg className="h-5 w-5 text-emerald-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>

      {/* 动态列表区域 */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800">行程动态</h2>

        <div className="space-y-2">
          {trip.events.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[14px] font-semibold text-slate-950">{event.title}</p>
                  <p className="text-[13px] leading-6 text-slate-500">{event.body}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                  {event.actorName}
                </span>
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                {new Intl.DateTimeFormat("zh-CN", {
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(event.createdAt))}
              </p>
            </article>
          ))}
        </div>
      </div>

      {/* 生成回忆按钮 */}
      <button
        onClick={generateMemory}
        className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 p-5 text-white shadow-lg shadow-rose-500/30 transition hover:scale-[1.02] active:scale-95"
      >
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="font-bold text-lg">生成回忆</p>
            <p className="text-sm opacity-90">生成小红书风格的旅行回忆卡片</p>
          </div>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </button>

      {/* 结束行程按钮 - 页面最下方 */}
      {trip.stage !== "completed" && (
        <div className="pt-4">
          <button
            onClick={endTrip}
            disabled={isEndingTrip}
            className="w-full rounded-2xl border-2 border-rose-200 bg-rose-50 py-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEndingTrip ? "处理中..." : "结束行程"}
          </button>
        </div>
      )}
    </section>
  );
}
