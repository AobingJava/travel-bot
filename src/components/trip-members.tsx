"use client";

import { InviteMemberForm } from "@/components/invite-member-form";
import type { TripDocument } from "@/lib/types";

const statusLabel = {
  confirmed: "已确认",
  pending: "待确认",
} as const;

// 模拟旅伴位置数据
const mockLocations = [
  { memberId: "1", lat: 39.9042, lng: 116.4074, status: "已到达", statusType: "arrived", delay: "" },
  { memberId: "2", lat: 39.9052, lng: 116.4084, status: "还有 8 分钟到达", statusType: "late", delay: "迟到" },
  { memberId: "3", lat: 39.9032, lng: 116.4064, status: "还未出门", statusType: "not-out", delay: "" },
];

export function TripMembers({
  trip,
  canInvite,
}: {
  trip: TripDocument;
  canInvite: boolean;
}) {
  return (
    <section className="space-y-3 pb-20">
      {/* 地图区域 */}
      <div className="relative h-[400px] w-full overflow-hidden rounded-2xl bg-surface-container-low shadow-lg">
        {/* 地图背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50">
          <svg className="w-full h-full opacity-30" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#a63400" strokeWidth="0.5" opacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <path d="M 0 100 Q 100 80 200 120 T 400 100" stroke="#fe5e1e" strokeWidth="2" fill="none" opacity="0.3"/>
            <path d="M 0 200 Q 150 180 250 220 T 400 200" stroke="#fe5e1e" strokeWidth="2" fill="none" opacity="0.3"/>
            <path d="M 100 0 Q 120 150 100 400" stroke="#fe5e1e" strokeWidth="2" fill="none" opacity="0.3"/>
            <path d="M 300 0 Q 280 200 300 400" stroke="#fe5e1e" strokeWidth="2" fill="none" opacity="0.3"/>
          </svg>
        </div>

        {/* 旅伴位置标记 */}
        <div className="absolute inset-0">
          {trip.members.map((member, index) => {
            const location = mockLocations[index];
            if (!location) return null;

            const positions = [
              { top: "25%", left: "35%" },
              { top: "50%", left: "65%" },
              { top: "65%", left: "25%" },
            ];
            const pos = positions[index] || { top: "50%", left: "50%" };

            const borderColors = {
              arrived: "border-secondary",
              late: "border-error-container",
              "not-out": "border-outline-variant",
            };

            return (
              <div
                key={member.id}
                className="absolute"
                style={{ top: pos.top, left: pos.left }}
              >
                <div className="relative">
                  {/* 迟到动画效果 */}
                  {location.statusType === "late" && (
                    <div className="absolute -inset-4 rounded-full border-2 border-error-container/40 animate-ping" />
                  )}

                  {/* 头像圆圈 */}
                  <div
                    className={`relative w-14 h-14 rounded-full border-4 p-0.5 bg-surface-container-lowest shadow-lg cursor-pointer transition hover:scale-110 ${borderColors[location.statusType as keyof typeof borderColors]}`}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-600">
                      {member.avatarText}
                    </div>
                  </div>

                  {/* 状态标签 */}
                  {location.statusType === "late" && (
                    <div className="absolute -right-32 -top-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-full shadow-md border border-outline-variant/20">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-error">
                        {location.delay}
                      </span>
                      <span className="text-xs font-bold block whitespace-nowrap text-slate-700">
                        {member.name}: {location.status}
                      </span>
                    </div>
                  )}

                  {location.statusType === "arrived" && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-secondary text-white px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                      <span className="text-xs font-bold">{member.name}: {location.status}</span>
                    </div>
                  )}

                  {location.statusType === "not-out" && (
                    <div className="absolute -right-24 top-1/2 -translate-y-1/2 bg-surface-container-high px-3 py-1.5 rounded-full shadow-sm border border-outline-variant/20">
                      <span className="text-xs font-semibold text-on-surface-variant italic">
                        {member.name}: {location.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* 用户自己的位置 */}
          <div className="absolute bottom-1/4 right-1/3">
            <div className="w-5 h-5 bg-primary rounded-full border-4 border-white shadow-xl animate-bounce" />
            <div className="mt-1.5 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-md text-center">
              你
            </div>
          </div>
        </div>

        {/* 地图控制按钮 */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-primary hover:bg-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-primary hover:bg-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 集合信息卡片 */}
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-headline font-extrabold text-xl text-slate-800 leading-tight">
              {trip.destination}
            </h2>
            <p className="text-slate-500 text-sm mt-1">"别让大家等你哦。"</p>
          </div>
          <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-xs font-black">
            进行中
          </span>
        </div>

        {/* 进度条 */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>预计到达：14:30</span>
            <span className="text-primary">剩余 3.2km</span>
          </div>
          <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-tertiary-fixed w-2/3 rounded-full" />
          </div>
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
      <button className="w-full bg-gradient-to-br from-primary to-primary-container text-white p-5 rounded-2xl shadow-[0px_20px_40px_rgba(166,52,0,0.3)] flex items-center justify-between group active:scale-95 transition-all">
        <div className="text-left">
          <p className="font-headline font-extrabold text-lg uppercase tracking-tight">
            呼叫伙伴
          </p>
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

      {canInvite ? <InviteMemberForm tripId={trip.id} /> : null}
    </section>
  );
}
