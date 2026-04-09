"use client";

import { useMemo, useState, useRef } from "react";

import { ReplanButton } from "@/components/replan-button";
import { TripMap } from "@/components/trip-map";
import { TaskToggleButton } from "@/components/task-toggle-button";
import type { TaskPhase, TripTask } from "@/lib/types";
import { getTaskLabelClass, getTaskLabelText, getTravelModeText } from "@/lib/utils";

const phases: Array<{ key: TaskPhase; label: string }> = [
  { key: "during", label: "旅途打卡" },
  { key: "post", label: "旅后总结" },
];

export function TaskBoard({
  tripId,
  tasks,
}: {
  tripId: string;
  tasks: TripTask[];
}) {
  const [activePhase, setActivePhase] = useState<TaskPhase>("during");
  const [taskPhotos, setTaskPhotos] = useState<Record<string, string[]>>({});
  const [userCheckinTasks, setUserCheckinTasks] = useState<TripTask[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const duringTasks = useMemo(
    () => tasks.filter((task) => task.phase === "during"),
    [tasks],
  );

  const visibleTasks = useMemo(
    () => {
      const baseTasks = tasks.filter((task) => task.phase === activePhase);
      // 在"旅途打卡"tab 显示 AI 生成的 during 任务 + 用户打卡任务
      if (activePhase === "during") {
        return [...baseTasks, ...userCheckinTasks];
      }
      return baseTasks;
    },
    [activePhase, tasks, userCheckinTasks],
  );

  const handlePhotoUpload = async (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await fetch(`/api/trips/${tripId}/tasks/${taskId}/photos`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setTaskPhotos((prev) => ({ ...prev, [taskId]: data.photos || [] }));
        // 更新 TripMap 组件
        window.dispatchEvent(
          new CustomEvent("task-photo-updated", {
            detail: { taskId, photos: data.photos },
          })
        );
      }
    } catch (error) {
      console.error("上传照片失败:", error);
    }
  };

  const handlePhotoDelete = async (taskId: string, photoUrl: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/tasks/${taskId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setTaskPhotos((prev) => ({ ...prev, [taskId]: data.photos || [] }));
        window.dispatchEvent(
          new CustomEvent("task-photo-updated", {
            detail: { taskId, photos: data.photos },
          })
        );
      }
    } catch (error) {
      console.error("删除照片失败:", error);
    }
  };

  // 一键打卡：获取当前位置并找到最近的景点
  const handleQuickCheckin = async () => {
    setIsGettingLocation(true);

    try {
      // 获取当前定位
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        });
      });

      const { latitude, longitude } = position.coords;

      // 调用 API 创建打卡点
      const response = await fetch(`/api/trips/${tripId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: latitude,
          lng: longitude,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // 添加新生成的打卡任务
        setUserCheckinTasks((prev) => [...prev, data.task]);
      }
    } catch (error) {
      console.error("获取位置失败:", error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)]">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold">打卡进度</h2>
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

      {activePhase === "during" && <TripMap tasks={duringTasks} taskPhotos={taskPhotos} />}

      <div className="space-y-2">
        {visibleTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            tripId={tripId}
            activePhase={activePhase}
            photos={taskPhotos[task.id] || []}
            onPhotoUpload={handlePhotoUpload}
            onPhotoDelete={handlePhotoDelete}
            isUserCheckin={userCheckinTasks.some((t) => t.id === task.id)}
          />
        ))}

        {/* 一键打卡按钮 */}
        {activePhase === "during" && (
          <button
            onClick={handleQuickCheckin}
            disabled={isGettingLocation}
            className="w-full rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-4 text-center transition hover:bg-emerald-50 hover:border-emerald-400 active:scale-[0.98]"
          >
            <div className="flex items-center justify-center gap-2">
              {isGettingLocation ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  <span className="text-[14px] font-semibold text-emerald-700">正在获取位置...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[14px] font-semibold text-emerald-700">一键打卡</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-emerald-600/70 mt-1">基于当前位置生成附近景点打卡</p>
          </button>
        )}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  tripId,
  activePhase,
  photos,
  onPhotoUpload,
  onPhotoDelete,
  isUserCheckin,
}: {
  task: TripTask;
  tripId: string;
  activePhase: TaskPhase;
  photos: string[];
  onPhotoUpload: (taskId: string, file: File) => void;
  onPhotoDelete: (taskId: string, photoUrl: string) => void;
  isUserCheckin?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoUpload(task.id, file);
      e.target.value = "";
    }
  };

  return (
    <article
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

          {/* 照片上传区域 */}
          {activePhase === "during" && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  添加照片
                </button>
              </div>

              {/* 照片缩略图 - 只读，无删除按钮 */}
              {photos.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {photos.map((photoUrl, index) => (
                    <div
                      key={index}
                      className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200"
                    >
                      <img
                        src={photoUrl}
                        alt={`照片 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
