"use client";

import { useState } from "react";
import type { TripDocument, TripTask } from "@/lib/types";
import { InviteMemberForm } from "@/components/invite-member-form";
import { TripPackingChecklist } from "@/components/trip-packing-checklist";
import { getTaskLabelClass, getTaskLabelText } from "@/lib/utils";

export function TodoList({ trip, canInvite }: { trip: TripDocument; canInvite: boolean }) {
  const preTasks = trip.tasks.filter((task) => task.phase === "pre");
  const [tasks, setTasks] = useState<TripTask[]>(preTasks);

  // 计算进度
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleTaskStatus = async (taskId: string, currentStatus: TripTask["status"]) => {
    const newStatus: TripTask["status"] = currentStatus === "done" ? "open" : "done";

    // 乐观更新
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      // 失败时回滚
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: currentStatus } : t)));
      console.error("更新任务状态失败:", error);
    }
  };

  return (
    <section className="space-y-3">
      {/* 卡片样式在 InviteMemberForm 根节点，此处不再套一层避免双边框 */}
      {canInvite ? <InviteMemberForm trip={trip} /> : null}

      {trip.packingList && trip.packingList.length > 0 ? (
        <TripPackingChecklist
          tripId={trip.id}
          packingList={trip.packingList}
          startDate={trip.startDate}
          endDate={trip.endDate}
        />
      ) : null}

      {/* 代办清单 */}
      {tasks.length > 0 && (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-400">待办清单</p>
            <span className="text-[11px] text-slate-500">
              {completedCount}/{totalCount} 已完成
            </span>
          </div>

          {/* 进度条 */}
          <div className="mb-4">
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`rounded-xl border p-3.5 transition hover:shadow-md ${
                  task.status === "done"
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      task.status === "done"
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-slate-300"
                    }`}
                  >
                    {task.status === "done" && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="space-y-0.5">
                        <p className="text-[14px] font-semibold leading-snug text-slate-950">
                          {task.title}
                        </p>
                        {task.notes && (
                          <p className="text-[12px] leading-5 text-slate-500 mt-1.5">{task.notes}</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getTaskLabelClass(task.label)}`}
                      >
                        {getTaskLabelText(task.label)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      )}

    </section>
  );
}
