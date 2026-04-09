"use client";

import { useMemo, useState } from "react";

import { ReplanButton } from "@/components/replan-button";
import { TripMap } from "@/components/trip-map";
import { TaskToggleButton } from "@/components/task-toggle-button";
import type { TaskPhase, TripBanner, TripTask } from "@/lib/types";
import {
  getProgress,
  getTaskLabelClass,
  getTaskLabelText,
  getTravelModeText,
} from "@/lib/utils";

const phases: Array<{ key: TaskPhase; label: string }> = [
  { key: "during", label: "旅途打卡" },
  { key: "pre", label: "代办清单" },
  { key: "post", label: "旅后总结" },
];

export function TaskBoard({
  tripId,
  tasks,
  banner,
}: {
  tripId: string;
  tasks: TripTask[];
  banner: TripBanner;
}) {
  const duringTasks = useMemo(
    () => tasks.filter((task) => task.phase === "during"),
    [tasks],
  );
  const [activePhase, setActivePhase] = useState<TaskPhase>("during");

  const visibleTasks = useMemo(
    () => tasks.filter((task) => task.phase === activePhase),
    [activePhase, tasks],
  );
  const progress = getProgress(tasks, activePhase);

  return (
    <section className="space-y-3">
      {/* 行程动态卡片 - 置顶 */}
      <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
        <div className="mb-3">
          <h3 className="text-base font-bold text-slate-950">行程动态</h3>
          <p className="text-sm text-slate-500 mt-1">{banner.body}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-mint-100 px-2.5 py-0.5 text-[11px] font-semibold text-mint-700">
            AI
          </span>
          <span className="text-[11px] text-slate-400">{banner.updatedAt ? new Date(banner.updatedAt).toLocaleDateString("zh-CN") : ""}</span>
        </div>
      </article>

      <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)]">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="inline-flex rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
              动态调整中
            </span>
            <h2 className="text-xl font-bold">TODO 看板</h2>
          </div>
          <ReplanButton tripId={tripId} />
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {phases.map((phase) => {
            const isActive = activePhase === phase.key;
            return (
              <button
                key={phase.key}
                type="button"
                onClick={() => setActivePhase(phase.key)}
                className={`rounded-xl px-3 py-2.5 text-[13px] font-semibold transition active:scale-[0.97] ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "bg-white/8 text-white/70 hover:text-white/85"
                }`}
              >
                {phase.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-[13px] font-semibold text-slate-950">{banner.title}</p>
            <p className="text-[12px] leading-5 text-slate-500">{banner.body}</p>
          </div>
          <span className="rounded-full bg-mint-100 px-2.5 py-0.5 text-[11px] font-semibold text-mint-700">
            AI
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[12px] text-slate-400">
            <span>
              {progress.completed} / {progress.total} 已完成
            </span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {activePhase === "during" ? (
        <TripMap tasks={duringTasks} />
      ) : null}

      <div className="space-y-2">
        {visibleTasks.map((task) => (
          <article
            key={task.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]"
          >
            <div className="flex gap-3">
              <TaskToggleButton taskId={task.id} status={task.status} />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    {task.dayLabel ? (
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                        {task.dayLabel}
                      </p>
                    ) : null}
                    <h3
                      className={`text-[14px] font-semibold leading-snug ${
                        task.status === "done"
                          ? "text-slate-400 line-through"
                          : "text-slate-950"
                      }`}
                    >
                      {task.title}
                    </h3>
                  </div>
                    <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getTaskLabelClass(task.label)}`}
                  >
                    {getTaskLabelText(task.label)}
                  </span>
                </div>
                {activePhase === "during" &&
                (task.scheduledTime || task.locationName || task.durationMinutes) ? (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-400">
                    {task.scheduledTime ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                        {task.scheduledTime} 出发
                      </span>
                    ) : null}
                    {task.locationName ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                        {task.locationName}
                      </span>
                    ) : null}
                    {task.durationMinutes ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                        停留约 {task.durationMinutes} 分钟
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {task.notes ? (
                  <p className="text-[12px] leading-5 text-slate-500">{task.notes}</p>
                ) : null}
                {activePhase === "during" && task.routeHint ? (
                  <p className="text-[12px] leading-5 text-slate-600">{task.routeHint}</p>
                ) : null}
                {activePhase === "during" && task.travelMinutes ? (
                  <p className="text-[11px] font-medium text-emerald-700">
                    下一段建议：{getTravelModeText(task.travelMode) || "通勤"} {task.travelMinutes}
                    分钟
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
