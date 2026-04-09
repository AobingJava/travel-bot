"use client";

import { useEffect, useRef, useState } from "react";
import type { TripDocument, TripMember, MemberLocationStatus, SessionUser } from "@/lib/types";
import { loadAmap } from "@/lib/amap-loader";

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
  currentUser,
  onCallClick,
}: {
  memberLocations: MemberLocationStatus[];
  currentUser: SessionUser | null;
  onCallClick: (member: TripMember) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [amapLoaded, setAmapLoaded] = useState(false);

  // 加载高德地图
  useEffect(() => {
    let destroyed = false;

    loadAmap()
      .then(() => {
        if (!destroyed) {
          setAmapLoaded(true);
        }
      })
      .catch((err: Error) => {
        if (!destroyed) {
          console.error("加载高德地图失败:", err);
          setLocationError(err.message || "地图加载失败");
        }
      });

    return () => {
      destroyed = true;
    };
  }, []);

  // 初始化地图
  useEffect(() => {
    if (!mapRef.current || !amapLoaded) return;

    try {
      const map = new window.AMap.Map(mapRef.current, {
        zoom: 12,
        center: userLocation ? [userLocation.lng, userLocation.lat] : [139.6917, 35.6895], // 默认东京
      });
      mapInstanceRef.current = map;
    } catch (error) {
      console.error("初始化地图失败:", error);
      setLocationError("地图初始化失败");
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [amapLoaded]);

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

    // 添加用户位置标记（带头像）
    if (userLocation) {
      const avatarUrl = currentUser?.avatarUrl || getAvatarUrl(0);
      // 创建自定义头像标记内容
      const userContent = `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid #10b981;
          box-shadow: 0 2px 8px rgba(15,23,42,0.3);
          background: #fff;
        ">
          <img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
      `;

      const userMarker = new window.AMap.Marker({
        position: [userLocation.lng, userLocation.lat],
        content: userContent,
        offset: new window.AMap.Pixel(-20, -20),
        title: currentUser?.name || "我的位置",
        extData: { type: "user" },
      });
      userMarker.setMap(map);
    }
  }, [memberLocations, userLocation, currentUser]);

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
  currentUser,
}: {
  trip: TripDocument;
  currentUser: SessionUser | null;
}) {
  const [selectedMember, setSelectedMember] = useState<TripMember | null>(null);
  const [memberLocations, setMemberLocations] = useState<MemberLocationStatus[]>([]);
  const [showCallUI, setShowCallUI] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reminderLevel, setReminderLevel] = useState<"low" | "medium" | "high">("low");
  const [showReminderCard, setShowReminderCard] = useState(false);

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
  };

  const handleReminderLevel = (level: "low" | "medium" | "high") => {
    setReminderLevel(level);
    setShowReminderCard(true);
  };

  const reminderLevels = [
    {
      level: "low" as const,
      label: "轻度",
      sublabel: "友好询问",
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      icon: "📍",
      title: "宝，你到底在哪？",
      subtitle: "紧急通讯",
      buttonLabel: "共享实时位置",
    },
    {
      level: "medium" as const,
      label: "中度",
      sublabel: "表达焦虑",
      color: "bg-amber-500",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      icon: "⏰",
      title: "为什么还没出门？",
      subtitle: "登机口 14:45 关闭",
      buttonLabel: "我现在就出门",
    },
    {
      level: "high" as const,
      label: "重度",
      sublabel: "最后通牒",
      color: "bg-rose-600",
      textColor: "text-rose-700",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      icon: "🚫",
      title: "还没出就别出来了",
      subtitle: "最后通牒",
      buttonLabel: "我已经车上了",
    },
  ];

  const currentReminder = reminderLevels.find((r) => r.level === reminderLevel) || reminderLevels[0];

  return (
    <>
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
          <AMapComponent memberLocations={memberLocations} currentUser={currentUser} onCallClick={handleCallClick} />
        )}

        {/* 提示等级选择器 - 一行三个 */}
        {showCallUI && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {reminderLevels.map((item) => (
                <button
                  key={item.level}
                  onClick={() => handleReminderLevel(item.level)}
                  className={`relative overflow-hidden rounded-2xl p-3.5 text-center transition-all active:scale-95 ${
                    reminderLevel === item.level
                      ? `${item.color} text-white shadow-lg scale-105`
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span className="text-xl mb-1 block">{item.icon}</span>
                  <p className={`text-[11px] font-bold ${reminderLevel === item.level ? "text-white" : "text-slate-600"}`}>
                    {item.label}
                  </p>
                  <p className={`text-[9px] ${reminderLevel === item.level ? "text-white/80" : "text-slate-400"}`}>
                    {item.sublabel}
                  </p>
                  {reminderLevel === item.level && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30" />
                  )}
                </button>
              ))}
            </div>

            {/* 提醒卡片 - 点击后才展开 */}
            {showReminderCard && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dim to-primary-container p-6 text-white shadow-2xl animate-in slide-in-from-top-4 duration-300">
                {/* 顶部标签 */}
                <div className="inline-block bg-primary-container/50 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-4">
                  {currentReminder.subtitle}
                </div>

                {/* 主标题 */}
                <h2 className="font-headline text-5xl font-black leading-tight tracking-tighter mb-6">
                  {currentReminder.title}
                </h2>

                {/* 进度条 */}
                <div className={`w-20 h-2 ${currentReminder.level === "high" ? "bg-error" : "bg-tertiary-fixed"} rounded-full mb-8`} />

                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      console.log(`发送${currentReminder.label}提醒给${selectedMember?.name}`);
                      setShowReminderCard(false);
                    }}
                    className="flex-1 py-4 rounded-xl bg-white text-primary font-headline font-extrabold text-lg shadow-xl active:scale-95 transition-transform"
                  >
                    {currentReminder.buttonLabel}
                  </button>
                  <button
                    onClick={() => setShowReminderCard(false)}
                    className={`w-14 py-4 rounded-xl flex items-center justify-center shadow-xl ${
                      currentReminder.level === "high"
                        ? "bg-primary-dim text-white"
                        : "bg-primary-container/30 text-white"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 底部状态 */}
                {selectedMember && (
                  <div className="mt-4 flex items-center gap-3 pt-4 border-t border-white/20">
                    <div className="w-8 h-8 rounded-full bg-white/20 overflow-hidden">
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMKvbpNKJG8j1JmkB4GxJHVe-ax-wvSx3mtudIp3uZwCNJA_lzrsUT10qujZVcJ46kAYpYhuB2hYfdAmPHRsQhw4QDJ2z03UbcaJ_UqwD_Scb6OHuQw6sBe4eqcLCC_OifVCj-KE8zOVR99App8_2FCCJi0-dHo1lMO5XK_-BVOplltb11yxg0LMBkhJEVykzrIK1Bfr3_PjJ9zP-W-dSn7bZFhBYDSUcQHnVS8QVrWkVukXK9cFS_jJiJybWRyJVtk_6lAXI6Jd2h"
                        alt={selectedMember.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white/80">正在提醒 {selectedMember.name}</p>
                      <p className="text-[10px] text-white/50">PlanBuddy System</p>
                    </div>
                    {currentReminder.level === "high" && (
                      <span className="bg-error text-on-error px-2 py-1 rounded-full text-[9px] font-black animate-pulse">
                        极其紧急
                      </span>
                    )}
                  </div>
                )}
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
