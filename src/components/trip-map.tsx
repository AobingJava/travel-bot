"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { loadAmap } from "@/lib/amap-loader";
import type { TripTask } from "@/lib/types";
import { getTravelModeText } from "@/lib/utils";

type TripMapProps = {
  tasks: TripTask[];
  taskPhotos?: Record<string, string[]>;
};

const labelColors: Record<string, string> = {
  suggestion: "#10b981",
  food: "#f59e0b",
  backup: "#6366f1",
  transport: "#3b82f6",
  lodging: "#8b5cf6",
  default: "#475569",
};

function getMarkerColor(label?: string) {
  return labelColors[label ?? "default"] ?? labelColors.default;
}

export function TripMap({ tasks, taskPhotos = {} }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [photos, setPhotos] = useState<Record<string, string[]>>(taskPhotos);

  // 监听照片更新事件
  useEffect(() => {
    const handlePhotoUpdate = (event: CustomEvent<{ taskId: string; photos: string[] }>) => {
      setPhotos((prev) => ({ ...prev, [event.detail.taskId]: event.detail.photos }));
      // 重新渲染地图标记
      if (mapInstanceRef.current) {
        renderMapMarkers();
      }
    };

    window.addEventListener("task-photo-updated", handlePhotoUpdate as EventListener);
    return () => window.removeEventListener("task-photo-updated", handlePhotoUpdate as EventListener);
  }, []);

  // 同步外部传入的照片
  useEffect(() => {
    setPhotos(taskPhotos);
  }, [taskPhotos]);

  const mapTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.lat != null && task.lng != null)
        .sort((left, right) => {
          if ((left.dayIndex ?? 0) !== (right.dayIndex ?? 0)) {
            return (left.dayIndex ?? 0) - (right.dayIndex ?? 0);
          }

          return left.sortOrder - right.sortOrder;
        }),
    [tasks],
  );
  const totalMinutes = mapTasks.reduce(
    (sum, task) => sum + (task.durationMinutes ?? 0) + (task.travelMinutes ?? 0),
    0,
  );

  const renderMapMarkers = () => {
    if (!mapInstanceRef.current) return;

    const AMap = window.AMap;
    const map = mapInstanceRef.current as any;

    map.clearMap();

    const infoWindow = new AMap.InfoWindow({
      isCustom: false,
      offset: new AMap.Pixel(0, -28),
    });

    const markers = mapTasks.map((task, index) => {
      const color = getMarkerColor(task.label);
      const taskPhotos = photos[task.id] || [];

      // 如果有照片，在标记上显示第一张照片的缩略图
      const photoThumb = taskPhotos.length > 0
        ? `<div style="
            position:absolute;
            bottom:-4px;
            right:-4px;
            width:20px;
            height:20px;
            border-radius:4px;
            overflow:hidden;
            border:2px solid ${color};
            box-shadow:0 2px 8px rgba(15,23,42,0.2);
          ">
            <img src="${taskPhotos[0]}" style="width:100%;height:100%;object:cover;" />
          </div>`
        : "";

      const content = `<div style="
        display:flex;align-items:center;gap:8px;
        background:#ffffff;color:#0f172a;
        padding:6px 10px 6px 6px;border-radius:18px;
        font-size:11px;font-weight:700;white-space:nowrap;
        box-shadow:0 8px 24px rgba(15,23,42,0.16);
        border:1px solid rgba(226,232,240,0.95);
        position:relative;
      ">
        <span style="
          display:flex;align-items:center;justify-content:center;
          width:22px;height:22px;border-radius:999px;
          background:${color};color:#fff;font-size:11px;font-weight:700;
        ">${index + 1}</span>
        <span>${task.locationName ?? task.title}</span>
        ${photoThumb}
      </div>`;

      const marker = new AMap.Marker({
        position: new AMap.LngLat(task.lng!, task.lat!),
        content,
        offset: new AMap.Pixel(-30, -24),
        title: task.title,
      });

      marker.on("click", () => {
        const photosHtml = taskPhotos.length > 0
          ? `<div style="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap;">
              ${taskPhotos.map((url) => `
                <div style="width:40px;height:40px;border-radius:6px;overflow:hidden;">
                  <img src="${url}" style="width:100%;height:100%;object:cover;" />
                </div>
              `).join("")}
            </div>`
          : "";

        infoWindow.setContent(`
          <div style="padding:6px 4px;min-width:180px;">
            <div style="font-size:13px;font-weight:700;color:#0f172a;">${task.title}</div>
            <div style="margin-top:4px;font-size:12px;color:#475569;">${task.locationName ?? "待确认地点"}</div>
            <div style="margin-top:6px;font-size:12px;color:#0f172a;">
              ${task.scheduledTime ? `${task.scheduledTime} 出发` : "时间待定"}
              ${task.durationMinutes ? ` · 停留约 ${task.durationMinutes} 分钟` : ""}
            </div>
            ${
              task.routeHint
                ? `<div style="margin-top:6px;font-size:12px;line-height:1.5;color:#64748b;">${task.routeHint}</div>`
                : ""
            }
            ${photosHtml}
          </div>
        `);
        infoWindow.open(map, marker.getPosition());
      });

      return marker;
    });

    const routePath = mapTasks.map((task) => [task.lng!, task.lat!]);
    const polyline =
      routePath.length > 1
        ? new AMap.Polyline({
            path: routePath,
            strokeColor: "#0f172a",
            strokeWeight: 4,
            strokeOpacity: 0.72,
            strokeStyle: "solid",
            lineJoin: "round",
            showDir: true,
          })
        : null;

    map.add(markers);
    if (polyline) {
      map.add(polyline);
    }

    setTimeout(() => {
      map.setFitView(polyline ? [...markers, polyline] : markers, false, [
        42,
        42,
        42,
        42,
      ]);
    }, 200);
  };

  useEffect(() => {
    if (mapTasks.length === 0) {
      return;
    }

    let destroyed = false;

    loadAmap()
      .then(() => {
        if (destroyed || !containerRef.current) return;

        const AMap = window.AMap;
        if (!AMap) {
          throw new Error("AMap SDK not available");
        }

        const map = new AMap.Map(containerRef.current, {
          viewMode: "2D",
          zoom: 11,
          resizeEnable: true,
          mapStyle: "amap://styles/whitesmoke",
        });

        mapInstanceRef.current = map;
        renderMapMarkers();
        setStatus("ready");
      })
      .catch((err: Error) => {
        if (!destroyed) {
          setErrorMsg(err.message || "地图加载失败");
          setStatus("error");
        }
      });

    return () => {
      destroyed = true;
      if (mapInstanceRef.current) {
        try {
          (mapInstanceRef.current as { destroy: () => void }).destroy();
        } catch {
          // ignore cleanup errors
        }
        mapInstanceRef.current = null;
      }
    };
  }, [mapTasks, photos]);

  if (mapTasks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
        <p className="text-[13px] font-medium text-slate-400">暂无位置信息</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
        <p className="text-[13px] font-medium text-slate-400">
          {errorMsg === "暂无位置信息" ? errorMsg : "地图暂不可用"}
        </p>
        {mapTasks.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {mapTasks.map((task, index) => (
              <span
                key={task.id}
                className="rounded-full bg-slate-200/80 px-2.5 py-1 text-[11px] text-slate-500"
              >
                {index + 1}. {task.title}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[13px] font-semibold text-slate-950">地图与路线建议</p>
            <p className="text-[12px] leading-5 text-slate-500">
              用编号标出推荐顺序，并给出每一段建议时间和通勤方式。
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
            约 {Math.max(totalMinutes, 90)} 分钟
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100">
        <div ref={containerRef} style={{ height: 300, width: "100%" }} />
        {status === "loading" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
              <p className="text-[12px] text-slate-400">加载地图…</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function getTravelModeLabel(mode?: TripTask["travelMode"]) {
  const text = getTravelModeText(mode);
  return text ? `${text} ` : "";
}
