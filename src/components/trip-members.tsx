"use client";

import { useEffect, useRef, useState } from "react";
import type { TripDocument, TripMember } from "@/lib/types";
import Script from "next/script";

const statusLabel = {
  confirmed: "已确认",
  pending: "待确认",
} as const;

// 高德地图容器组件
function AMapComponent({
  members,
  destination,
}: {
  members: TripMember[];
  destination: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [memberLocations, setMemberLocations] = useState<
    Array<{
      member: TripMember;
      lat: number;
      lng: number;
      status: string;
      statusType: "arrived" | "late" | "not-out" | "unknown";
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 初始化地图
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    const initMap = () => {
      if (!window.AMap) {
        setLoading(false);
        return;
      }

      // 默认显示目的地中心（北京）
      const defaultCenter = [116.405285, 39.904989];

      mapInstanceRef.current = new window.AMap.Map(mapRef.current!, {
        zoom: 15,
        center: defaultCenter,
        viewMode: "3D",
      });

      // 添加缩放控件
      window.AMap.plugin(["AMap.Scale", "AMap.ToolBar"], () => {
        mapInstanceRef.current.addControl(new window.AMap.Scale());
        mapInstanceRef.current.addControl(new window.AMap.ToolBar());
      });

      setLoading(false);
    };

    // 如果 AMap 还没加载，等待一下
    if (window.AMap) {
      initMap();
    } else {
      const checkAMap = setInterval(() => {
        if (window.AMap) {
          clearInterval(checkAMap);
          initMap();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkAMap);
        setLoading(false);
      }, 5000);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, []);

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

  // 模拟旅伴位置（实际应该从后端获取）
  useEffect(() => {
    if (!userLocation) return;

    // 为每个旅伴生成一个模拟位置（在用户附近）
    const locations = members.map((member, index) => {
      const offset = (index + 1) * 0.005; // 约 500 米偏移
      const mockLat = userLocation.lat + (Math.random() - 0.5) * offset;
      const mockLng = userLocation.lng + (Math.random() - 0.5) * offset;

      const distance = Math.sqrt(
        Math.pow(mockLat - userLocation.lat, 2) + Math.pow(mockLng - userLocation.lng, 2)
      ) * 111000; // 转换为米

      const statusType: "arrived" | "late" | "not-out" =
        distance < 100
          ? "arrived"
          : distance < 500
          ? "late"
          : "not-out";

      const status =
        statusType === "arrived"
          ? "已到达"
          : statusType === "late"
          ? `${Math.round(distance / 16.67)} 分钟到达`
          : "还未出门";

      return {
        member,
        lat: mockLat,
        lng: mockLng,
        status,
        statusType,
      };
    });

    setMemberLocations(locations);
  }, [members, userLocation]);

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
          avatar: loc.member.avatarText,
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
              loc.statusType === "arrived"
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
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto" />
              <p className="mt-2 text-sm text-slate-500">加载地图中...</p>
            </div>
          </div>
        )}
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-600">
              {loc.member.avatarText}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-[14px] font-semibold text-slate-950">
                  {loc.member.name}
                </h3>
                {loc.statusType === "arrived" && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                    已到
                  </span>
                )}
              </div>
              <p className="text-[12px] text-slate-500">{loc.status}</p>
            </div>
            <span
              className={`h-2 w-2 rounded-full ${
                loc.statusType === "arrived"
                  ? "bg-emerald-500"
                  : loc.statusType === "late"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-slate-300"
              }`}
            />
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
  const [showLocationPermission, setShowLocationPermission] = useState(false);

  return (
    <>
      {/* 高德地图 JS API */}
      <Script
        src={`https://webapi.amap.com/maps?v=2.0&key=${process.env.NEXT_PUBLIC_AMAP_KEY || "your-amap-key"}`}
        strategy="lazyOnload"
      />

      <section className="space-y-3 pb-20">
        {/* 高德地图组件 */}
        <AMapComponent members={trip.members} destination={trip.destination} />

        {/* 集合信息卡片 */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="font-bold text-xl text-slate-800 leading-tight">
                {trip.destination}
              </h2>
              <p className="text-slate-500 text-sm mt-1">"别让大家等你哦。"</p>
            </div>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
              进行中
            </span>
          </div>
        </div>

        {/* 旅伴列表 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
            旅伴详情
          </h3>
          {trip.members.map((member) => (
            <article
              key={member.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-600">
                {member.avatarText}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-[14px] font-semibold text-slate-950">
                    {member.name}
                  </h3>
                  {member.role === "owner" ? (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                      发起人
                    </span>
                  ) : null}
                </div>
                <p className="text-[12px] text-slate-400">{member.email}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  member.inviteStatus === "confirmed"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {statusLabel[member.inviteStatus]}
              </span>
            </article>
          ))}
        </div>

        {/* 呼叫伙伴按钮 */}
        <button className="w-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-5 rounded-2xl shadow-lg flex items-center justify-between group active:scale-95 transition-all">
          <div className="text-left">
            <p className="font-bold text-lg">呼叫伙伴</p>
            <p className="text-xs text-white/80">
              {trip.travelerCount} 位好友在线
            </p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
        </button>
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
