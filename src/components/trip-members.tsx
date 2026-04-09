"use client";

import { useEffect, useRef, useState } from "react";
import type { TripDocument, TripMember, MemberLocationStatus } from "@/lib/types";
import Script from "next/script";

const statusLabel = {
  confirmed: "已确认",
  pending: "待确认",
} as const;

// 从头文件中提取的头像 URL
const avatarUrls = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCh_LcVaiR78y_NwdjuEnImne9semxAlEQ272m37WfdDtJpXHoNgSlAjMi0JM1JGzRouUROKxfwUepaSJfGCm-s9Za8QUyrf5hZgSMH5waLSLKYLV52jZYIu1LHALIVX8afl4SffKud1t8iHbVVyJRnrp6NRv5RASPRwYTFR9Trz9lKw7mvyLUa5Js-BbokzPmsHVT7K_HFrgkcXdgXyGissigH5pvSXU_sLfYF1446OngQK9kwWj_H0Uuxz1zNDrbEeet2pJl0rtg5",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCQwUb-w5g57wLmkzYGflW9SWZZCcRXXb9aSqAZWesTUBwaE4fuyRTGeaTTLjpKxiRHLeBtOTp2oqM0o1PNPJMozm32sW9eMGI5QnQgdwWqsZTn8gwi-zs8nRjxaCNM-4d4H7iNXPq3b2oT3EbpXeXpUqA2O3xoJI8X2aFC6h_bnFhl6K8DY5rHrIkYn456IJcvfg7hTEW9KxJXWI2gUTZcitZuvxEy1xHV_MHrhzkycKZMinfaX_hQ4CjgHkzi5TIRhNRrA4YzG3Gz",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCFdypkcJxbwFOfFfca1Y0sx1AaAEFGqid5CEAuKTNysZHu5YDncd0tzm5DqBBsP8N4XRqDE-9MbSCR-oAbnKgcuVdZRl-fAc1IpP0VbYQh_1ufm0bPf4w6LynGcxMRPLjQFNRKvsxK611Rh1ORvNIyf0dp31NZxSGWFDtnEIWcT73JHxhjzsPuiXcC7PfjgrWwpznnyw5guH9Mybwtcjo3likSBtWRrhBuq8-sgT_7UXRzNh1Uq-3615kLPQ2ruqM8Vq0wFn6G1KSp",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCMKvbpNKJG8j1JmkB4GxJHVe-ax-wvSx3mtudIp3uZwCNJA_lzrsUT10qujZVcJ46kAYpYhuB2hYfdAmPHRsQhw4QDJ2z03UbcaJ_UqwD_Scb6OHuQw6sBe4eqcLCC_OifVCj-KE8zOVR99App8_2FCCJi0-dHo1lMO5XK_-BVOplltb11yxg0LMBkhJEVykzrIK1Bfr3_PjJ9zP-W-dSn7bZFhBYDSUcQHnVS8QVrWkVukXK9cFS_jJiJybWRyJVtk_6lAXI6Jd2h",
];

function getAvatarUrl(index: number): string {
  return avatarUrls[index % avatarUrls.length];
}

// 高德地图容器组件
function AMapComponent({
  memberLocations,
  onCallClick,
}: {
  memberLocations: MemberLocationStatus[];
  onCallClick: (member: TripMember) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 获取用户当前位置
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("您的浏览器不支持定位");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // 更新地图中心到用户位置
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter([longitude, latitude]);
        }
      },
      (error) => {
        console.warn("获取位置失败:", error);
        setLocationError("无法获取您的位置");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  // 更新地图标记
  useEffect(() => {
    if (!mapInstanceRef.current || memberLocations.length === 0) return;

    const map = mapInstanceRef.current;
    map.clearMap();

    // 添加旅伴标记
    memberLocations.forEach((loc) => {
      const marker = new window.AMap.Marker({
        position: [loc.lng, loc.lat],
        title: loc.member.name,
        extData: {
          type: "member",
          statusType: loc.statusType,
          name: loc.member.name,
          status: loc.status,
        },
      });

      marker.setMap(map);

      // 添加信息窗体
      const infoWindow = new window.AMap.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 120px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">
              ${loc.member.name}
            </div>
            <div style="font-size: 12px; color: ${
              loc.statusType === "arrived" || loc.statusType === "at-destination"
                ? "#10b981"
                : loc.statusType === "late"
                ? "#f59e0b"
                : "#6b7280"
            };">
              ${loc.status}
            </div>
          </div>
        `,
        offset: new window.AMap.Pixel(0, -10),
      });

      marker.on("click", () => {
        infoWindow.open(map, marker.getPosition());
      });
    });

    // 添加用户位置标记
    if (userLocation) {
      const userMarker = new window.AMap.Marker({
        position: [userLocation.lng, userLocation.lat],
        title: "我的位置",
        extData: { type: "user" },
      });
      userMarker.setMap(map);
    }
  }, [memberLocations, userLocation]);

  return (
    <>
      <div className="relative h-[400px] w-full overflow-hidden rounded-2xl bg-slate-100">
        {locationError && !userLocation && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <div className="text-center p-4">
              <svg className="h-12 w-12 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-slate-500">{locationError}</p>
              <p className="text-xs text-slate-400 mt-1">地图将显示默认位置</p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* 旅伴状态列表 */}
      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
          旅伴位置
        </h3>
        {memberLocations.map((loc) => (
          <article
            key={loc.member.id}
            className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
          >
            {/* 头像 - 带状态圆环 */}
            <div className="relative">
              {loc.statusType === "late" && (
                <div className="absolute -inset-1 bg-amber-400/40 rounded-full animate-ping" />
              )}
              <div
                className={`relative h-12 w-12 rounded-full overflow-hidden shadow-md ${
                  loc.statusType === "arrived" || loc.statusType === "at-destination"
                    ? "ring-4 ring-emerald-400"
                    : loc.statusType === "late"
                    ? "ring-4 ring-amber-400"
                    : "ring-4 ring-slate-300"
                }`}
              >
                {loc.member.avatarUrl ? (
                  <img
                    src={loc.member.avatarUrl}
                    alt={loc.member.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={getAvatarUrl(0)}
                    alt={loc.member.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
            {/* 信息区域 */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-[14px] font-semibold text-slate-950">
                  {loc.member.name}
                </h3>
                {(loc.statusType === "arrived" || loc.statusType === "at-destination") && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                    已到
                  </span>
                )}
                {loc.statusType === "late" && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                    迟到
                  </span>
                )}
              </div>
              <p className="text-[12px] text-slate-500">{loc.status}</p>
            </div>
            {/* 电话按钮 */}
            <button
              onClick={() => onCallClick(loc.member)}
              className="shrink-0 w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 active:scale-95 transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            </button>
          </article>
        ))}
      </div>
    </>
  );
}

export function TripMembers({
  trip,
}: {
  trip: TripDocument;
}) {
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TripMember | null>(null);
  const [memberLocations, setMemberLocations] = useState<MemberLocationStatus[]>([]);
  const [showCallUI, setShowCallUI] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reminderLevel, setReminderLevel] = useState<"low" | "medium" | "high">("low");

  const reminderLevelLabels = {
    low: "轻度提醒",
    medium: "中度提醒",
    high: "强烈提醒",
  };

  // 获取用户位置
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      () => {
        console.warn("获取位置失败");
      }
    );
  }, []);

  // 调用 AI 动态接口获取旅伴位置状态
  useEffect(() => {
    async function fetchMemberLocations() {
      try {
        const response = await fetch(`/api/trips/${trip.id}/members-location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userLocation,
            currentLocation: userLocation, // 当前定位
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setMemberLocations(data.memberLocations);
          setShowCallUI(data.showCallUI);
        }
      } catch (error) {
        console.error("获取旅伴位置失败:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (userLocation) {
      fetchMemberLocations();
    }
  }, [trip.id, userLocation]);

  const handleCallClick = (member: TripMember) => {
    setSelectedMember(member);
    setShowCallModal(true);
  };

  const handleReminderLevel = (level: "low" | "medium" | "high") => {
    setReminderLevel(level);
    console.log(`发送${level}等级提醒给${selectedMember?.name}`);
    setShowCallModal(false);
  };

  return (
    <>
      {/* 高德地图 JS API */}
      <Script
        src={`https://webapi.amap.com/maps?v=2.0&key=${process.env.NEXT_PUBLIC_AMAP_KEY || "your-amap-key"}`}
        strategy="lazyOnload"
      />

      <section className="space-y-3 pb-20">
        {/* 高德地图组件 */}
        {isLoading ? (
          <div className="relative h-[400px] w-full overflow-hidden rounded-2xl bg-slate-100 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-slate-300 border-t-orange-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">正在获取位置信息...</p>
            </div>
          </div>
        ) : (
          <AMapComponent memberLocations={memberLocations} onCallClick={handleCallClick} />
        )}

        {/* 集合信息卡片 */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="font-bold text-xl text-slate-800 leading-tight">
                {trip.destination}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {showCallUI ? "别让大家等你哦。" : "享受旅途吧！"}
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
              {trip.stage === "ongoing" ? "进行中" : "准备中"}
            </span>
          </div>
        </div>

        {/* 提示等级按钮 - 仅在需要时显示 */}
        {showCallUI && (
          <>
            <button
              onClick={() => setShowCallModal(true)}
              className="w-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-5 rounded-2xl shadow-lg flex items-center justify-between group active:scale-95 transition-all"
            >
              <div className="text-left">
                <p className="font-bold text-lg">{reminderLevelLabels[reminderLevel]}</p>
                <p className="text-xs text-white/80">
                  点击选择提醒强度
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </button>

            {/* 电话提醒弹窗 - 三挡选择 */}
            {showCallModal && (
              <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-sm rounded-t-3xl md:rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800">
                      {selectedMember ? `提醒${selectedMember.name}` : "选择提醒强度"}
                    </h3>
                    <button
                      onClick={() => {
                        setShowCallModal(false);
                        setSelectedMember(null);
                      }}
                      className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
                    >
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* 初级提醒 */}
                    <button
                      onClick={() => handleReminderLevel("low")}
                      className={`w-full rounded-2xl border-2 p-4 flex items-center gap-4 transition ${
                        reminderLevel === "low"
                          ? "border-slate-800 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        reminderLevel === "low" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-semibold ${reminderLevel === "low" ? "text-slate-900" : "text-slate-800"}`}>轻度提醒</p>
                        <p className="text-xs text-slate-500">发送一条友好的文字通知</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        reminderLevel === "low" ? "bg-slate-800" : "bg-slate-300"
                      }`} />
                    </button>

                    {/* 中级提醒 */}
                    <button
                      onClick={() => handleReminderLevel("medium")}
                      className={`w-full rounded-2xl border-2 p-4 flex items-center gap-4 transition ${
                        reminderLevel === "medium"
                          ? "border-amber-600 bg-amber-50"
                          : "border-amber-200 hover:border-amber-300 hover:bg-amber-50"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        reminderLevel === "medium" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-600"
                      }`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-semibold ${reminderLevel === "medium" ? "text-amber-900" : "text-amber-800"}`}>中度提醒</p>
                        <p className="text-xs text-amber-600">发送通知并播放提示音</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        reminderLevel === "medium" ? "bg-amber-600" : "bg-amber-500"
                      }`} />
                    </button>

                    {/* 高级提醒 */}
                    <button
                      onClick={() => handleReminderLevel("high")}
                      className={`w-full rounded-2xl border-2 p-4 flex items-center gap-4 transition ${
                        reminderLevel === "high"
                          ? "border-rose-600 bg-rose-50"
                          : "border-rose-200 hover:border-rose-300 hover:bg-rose-50"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        reminderLevel === "high" ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-600"
                      }`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-semibold ${reminderLevel === "high" ? "text-rose-900" : "text-rose-800"}`}>强烈提醒</p>
                        <p className="text-xs text-rose-600">连续通知直到对方确认</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        reminderLevel === "high" ? "bg-rose-600 animate-pulse" : "bg-rose-500"
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

// 扩展 Window 接口以包含 AMap
declare global {
  interface Window {
    AMap: any;
  }
}
