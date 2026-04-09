"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { TripDocument } from "@/lib/types";

function daysUntil(dateString: string): number {
  const now = new Date();
  const target = new Date(dateString);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function InviteMemberForm({ trip }: { trip: TripDocument }) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const daysLeft = daysUntil(trip.startDate);

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}${pathname}`
    : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "旅行邀请",
          url: inviteUrl,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // user cancelled
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  // 显示前 4 个旅伴头像
  const visibleMembers = trip.members.slice(0, 4);
  const remainingCount = trip.members.length - 4;

  return (
    <div className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
      {/* 行程动态内容 */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-950">行程动态</h3>
          <p className="text-sm text-slate-500">
            大家已准备就绪。距离出发还有{daysLeft}天！
          </p>
        </div>
        {/* 旅伴头像列表 */}
        <div className="flex -space-x-2">
          {visibleMembers.map((member, index) => (
            <div
              key={member.id}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-[11px] font-bold text-slate-600 ring-2 ring-white"
              style={{ zIndex: 4 - index }}
            >
              {member.avatarText}
            </div>
          ))}
          {remainingCount > 0 && (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 ring-2 ring-white"
              style={{ zIndex: 0 }}
            >
              +{remainingCount}
            </div>
          )}
        </div>
        {/* 进度条 */}
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all"
            style={{ width: `${Math.min(100, (1 - daysLeft / 14) * 100)}%` }}
          />
        </div>
      </div>

      {/* 邀请好友浮动按钮 */}
      <button
        type="button"
        onClick={handleShare}
        className="absolute -bottom-3 -right-3 bg-gradient-to-br from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7h4v3H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm-9 4c0-2.66 5.33-4 8-4s8 1.34 8 4v2H6v-2z"/>
        </svg>
        <span className="text-sm font-bold">邀请好友</span>
      </button>

      {/* 复制成功提示 */}
      {copied && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
          链接已复制
        </div>
      )}
    </div>
  );
}
