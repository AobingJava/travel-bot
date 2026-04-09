import type { TripDocument, TripTask } from "@/lib/types";
import { InviteMemberForm } from "@/components/invite-member-form";
import { getTaskLabelClass, getTaskLabelText } from "@/lib/utils";

export function TodoList({ trip, canInvite }: { trip: TripDocument; canInvite: boolean }) {
  const preTasks = trip.tasks.filter((task) => task.phase === "pre");
  const progress = preTasks.length > 0
    ? Math.round((preTasks.filter((t) => t.status === "done").length / preTasks.length) * 100)
    : 0;

  // 计算距离出发的天数
  const daysUntilDeparture = Math.ceil(
    (new Date(trip.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <section className="space-y-3">
      {/* 行程动态卡片 */}
      <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-950">行程动态</h3>
            <p className="text-sm text-slate-500 mt-1">
              {daysUntilDeparture > 0
                ? `大家已准备就绪。距离出发还有${daysUntilDeparture}天！`
                : "旅程正在进行中！"}
            </p>
          </div>
        </div>

        {/* 主题标签 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {trip.themes.map((theme) => (
            <span
              key={theme}
              className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700"
            >
              {theme === "culture" && "文化古迹"}
              {theme === "food" && "美食探店"}
              {theme === "shopping" && "购物"}
              {theme === "nature" && "自然风景"}
              {theme === "nightlife" && "夜生活"}
              {theme === "family" && "亲子游"}
            </span>
          ))}
        </div>

        {/* 旅伴信息 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMKvbpNKJG8j1JmkB4GxJHVe-ax-wvSx3mtudIp3uZwCNJA_lzrsUT10qujZVcJ46kAYpYhuB2hYfdAmPHRsQhw4QDJ2z03UbcaJ_UqwD_Scb6OHuQw6sBe4eqcLCC_OifVCj-KE8zOVR99App8_2FCCJi0-dHo1lMO5XK_-BVOplltb11yxg0LMBkhJEVykzrIK1Bfr3_PjJ9zP-W-dSn7bZFhBYDSUcQHnVS8QVrWkVukXK9cFS_jJiJybWRyJVtk_6lAXI6Jd2h"
                alt="发起者"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs text-slate-500">
              <p className="font-medium text-slate-700">{trip.ownerName}</p>
              <p>{trip.travelerCount} 人同行</p>
            </div>
          </div>
          {canInvite && <InviteMemberForm trip={trip} />}
        </div>

        {/* 进度条 */}
        <div className="mt-4">
          <div className="h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-600" style={{ width: `${progress}%` }} />
        </div>
      </article>

      {/* 代办清单 */}
      {preTasks.length > 0 && (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-400">待办清单</p>
            <span className="text-[11px] text-slate-500">
              {preTasks.filter((t) => t.status === "done").length}/{preTasks.length} 已完成
            </span>
          </div>
          <div className="space-y-2">
            {preTasks.map((task) => (
              <div
                key={task.id}
                className={`rounded-xl border p-3.5 transition hover:shadow-md ${
                  task.status === "done"
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
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
                  </div>
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
