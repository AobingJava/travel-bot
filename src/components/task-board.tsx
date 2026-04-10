"use client";

import { useMemo, useState, useRef } from "react";

import { TripMap } from "@/components/trip-map";
import { TaskToggleButton } from "@/components/task-toggle-button";
import type { TripBanner, TripTask } from "@/lib/types";
import { getTaskLabelClass, getTaskLabelText, getTravelModeText } from "@/lib/utils";

export function TaskBoard({
  tripId,
  tasks,
  banner,
}: {
  tripId: string;
  tasks: TripTask[];
  banner: TripBanner;
}) {
  const [taskPhotos, setTaskPhotos] = useState<Record<string, string[]>>({});
  const [taskVoices, setTaskVoices] = useState<Record<string, { url: string; createdAt: string; duration?: number; userEmail?: string; userName?: string; userAvatarUrl?: string; transcript?: string }[]>>({});
  const [userCheckinTasks, setUserCheckinTasks] = useState<TripTask[]>([]);
  const [recordingTaskId, setRecordingTaskId] = useState<string | null>(null);

  const duringTasks = useMemo(
    () => tasks.filter((task) => task.phase === "during"),
    [tasks],
  );

  // 合并 AI 生成任务和用户打卡任务
  const visibleTasks = useMemo(
    () => [...duringTasks, ...userCheckinTasks],
    [duringTasks, userCheckinTasks],
  );

  // 计算打卡进度
  const completedCount = visibleTasks.filter((task) => task.status === "done").length;
  const totalCount = visibleTasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 加载任务照片
  useMemo(() => {
    visibleTasks.forEach((task) => {
      if (!taskPhotos[task.id]) {
        fetch(`/api/trips/${tripId}/tasks/${task.id}/photos`)
          .then((res) => res.json())
          .then((data) => {
            setTaskPhotos((prev) => ({ ...prev, [task.id]: data.photos || [] }));
          })
          .catch(console.error);
      }
      if (!taskVoices[task.id]) {
        fetch(`/api/trips/${tripId}/tasks/${task.id}/voice`)
          .then((res) => res.json())
          .then((data) => {
            setTaskVoices((prev) => ({ ...prev, [task.id]: data.voices || [] }));
          })
          .catch(console.error);
      }
    });
  }, [visibleTasks, tripId, taskPhotos, taskVoices]);

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

  const handleQuickCheckin = async () => {
    if (!navigator.geolocation) {
      alert("您的浏览器不支持定位功能");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(`/api/trips/${tripId}/checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });

          if (response.ok) {
            const data = await response.json();
            setUserCheckinTasks((prev) => [...prev, data.task]);
            setTaskPhotos((prev) => ({ ...prev, [data.task.id]: [] }));
            window.dispatchEvent(
              new CustomEvent("task-photo-updated", {
                detail: { taskId: data.task.id, photos: [] },
              })
            );
          }
        } catch (error) {
          console.error("创建打卡任务失败:", error);
        }
      },
      (error) => {
        console.error("获取位置失败:", error);
        alert("无法获取您的位置信息，请检查浏览器权限设置");
      }
    );
  };

  const handleVoiceRecord = async (taskId: string, audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("voice", audioBlob, "recording.webm");

    try {
      const response = await fetch(`/api/trips/${tripId}/tasks/${taskId}/voice`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setTaskVoices((prev) => ({ ...prev, [taskId]: data.voices || [] }));
      }
    } catch (error) {
      console.error("上传语音失败:", error);
    }
  };

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-[18px] font-bold text-slate-950">打卡进度</p>
            <p className="text-[12px] leading-5 text-slate-500">{banner.body}</p>
          </div>
          <span className="rounded-full bg-mint-100 px-2.5 py-0.5 text-[11px] font-semibold text-mint-700">
            AI
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-medium text-slate-600">
              已完成 {completedCount}/{totalCount}
            </span>
            <span className="text-[12px] font-semibold text-emerald-700">{progress}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <TripMap tripId={tripId} tasks={duringTasks} taskPhotos={taskPhotos} />

      <div className="space-y-2">
        {visibleTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            tripId={tripId}
            photos={taskPhotos[task.id] || []}
            voices={taskVoices[task.id] || []}
            onPhotoUpload={handlePhotoUpload}
            onVoiceRecord={handleVoiceRecord}
            isRecording={recordingTaskId === task.id}
            onStartRecording={() => setRecordingTaskId(task.id)}
            onStopRecording={() => setRecordingTaskId(null)}
          />
        ))}
      </div>

      {/* 一键打卡按钮 - 在最后一条动态下面 */}
      <button
        onClick={handleQuickCheckin}
        className="w-full rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 py-4 text-[14px] font-semibold text-emerald-700 hover:bg-emerald-100 transition"
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          一键打卡
        </span>
      </button>
    </section>
  );
}

function TaskCard({
  task,
  tripId,
  photos,
  voices,
  onPhotoUpload,
  onVoiceRecord,
  isRecording,
  onStartRecording,
  onStopRecording,
}: {
  task: TripTask;
  tripId: string;
  photos: string[];
  voices: { url: string; createdAt: string; duration?: number; userEmail?: string; userName?: string; userAvatarUrl?: string; transcript?: string }[];
  onPhotoUpload: (taskId: string, file: File) => void;
  onVoiceRecord: (taskId: string, audioBlob: Blob) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoUpload(task.id, file);
      e.target.value = "";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onVoiceRecord(task.id, blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      onStartRecording();
    } catch (error) {
      console.error("开始录音失败:", error);
      alert("无法访问麦克风，请检查权限设置");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      onStopRecording();
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
                    ? "text-slate-400"
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
          {task.scheduledTime || task.locationName || task.durationMinutes ? (
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
          {task.routeHint ? (
            <p className="text-[12px] leading-5 text-slate-600">{task.routeHint}</p>
          ) : null}
          {task.travelMinutes ? (
            <p className="text-[11px] font-medium text-emerald-700">
              下一段建议：{getTravelModeText(task.travelMode) || "通勤"} {task.travelMinutes}
              分钟
            </p>
          ) : null}

          {/* 照片和语音上传区域 */}
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
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                {isRecording ? "松开结束" : "按住说话"}
              </button>
            </div>

            {/* 照片缩略图 */}
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

            {/* 语音列表 */}
            {voices.length > 0 && (
              <div className="space-y-2 mt-2">
                {voices.map((voice, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 bg-slate-50 rounded-lg p-2"
                  >
                    {/* 用户头像 */}
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                      <img
                        src={voice.userAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(voice.userName || "User")}&background=random`}
                        alt={voice.userName || "用户"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <audio
                          controls
                          src={voice.url}
                          className="h-8 flex-1"
                        />
                      </div>
                      {voice.transcript && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          {voice.userName}: {voice.transcript}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
