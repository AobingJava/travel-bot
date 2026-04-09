"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export function InviteMemberForm({ tripId }: { tripId: string }) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

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
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // user cancelled
      }
    } else {
      // fallback to copy
      handleCopy();
    }
  };

  return (
    <div className="space-y-3 rounded-[24px] border border-dashed border-slate-300 bg-white p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-950">邀请更多旅伴加入</p>
        <p className="text-xs text-slate-500">分享链接给旅伴，对方登录后即可确认同行。</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-[0.98]"
        >
          {copied ? "已复制" : "复制邀请链接"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
        >
          {shared ? "已分享" : "分享行程"}
        </button>
      </div>
    </div>
  );
}
