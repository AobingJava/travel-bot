"use client";

import { usePathname } from "next/navigation";
import type { TripDocument } from "@/lib/types";
import { getThemeLabel } from "@/lib/utils";
import { useState } from "react";

function daysUntil(dateString: string): number {
  const now = new Date();
  const target = new Date(dateString);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// 从头文件中提取的头像 URL
const avatarUrls = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCh_LcVaiR78y_NwdjuEnImne9semxAlEQ272m37WfdDtJpXHoNgSlAjMi0JM1JGzRouUROKxfwUepaSJfGCm-s9Za8QUyrf5hZgSMH5waLSLKYLV52jZYIu1LHALIVX8afl4SffKud1t8iHbVVyJRnrp6NRv5RASPRwYTFR9Trz9lKw7mvyLUa5Js-BbokzPmsHVT7K_HFrgkcXdgXyGissigH5pvSXU_sLfYF1446OngQK9kwWj_H0Uuxz1zNDrbEeet2pJl0rtg5",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCQwUb-w5g57wLmkzYGflW9SWZZCcRXXb9aSqAZWesTUBwaE4fuyRTGeaTTLjpKxiRHLeBtOTp2oqM0o1PNPJMozm32sW9eMGI5QnQgdwWqsZTn8gwi-zs8nRjxaCNM-4d4H7iNXPq3b2oT3EbpXeXpUqA2O3xoJI8X2aFC6h_bnFhl6K8DY5rHrIkYn456IJcvfg7hTEW9KxJXWI2gUTZcitZuvxEy1xHV_MHrhzkycKZMinfaX_hQ4CjgHkzi5TIRhNRrA4YzG3Gz",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCFdypkcJxbwFOfFfca1Y0sx1AaAEFGqid5CEAuKTNysZHu5YDncd0tzm5DqBBsP8N4XRqDE-9MbSCR-oAbnKgcuVdZRl-fAc1IpP0VbYQh_1ufm0bPf4w6LynGcxMRPLjQFNRKvsxK611Rh1ORvNIyf0dp31NZxSGWFDtnEIWcT73JHxhjzsPuiXcC7PfjgrWwpznnyw5guH9Mybwtcjo3likSBtWRrhBuq8-sgT_7UXRzNh1Uq-3615kLPQ2ruqM8Vq0wFn6G1KSp",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCMKvbpNKJG8j1JmkB4GxJHVe-ax-wvSx3mtudIp3uZwCNJA_lzrsUT10qujZVcJ46kAYpYhuB2hYfdAmPHRsQhw4QDJ2z03UbcaJ_UqwD_Scb6OHuQw6sBe4eqcLCC_OifVCj-KE8zOVR99App8_2FCCJi0-dHo1lMO5XK_-BVOplltb11yxg0LMBkhJEVykzrIK1Bfr3_PjJ9zP-W-dSn7bZFhBYDSUcQHnVS8QVrWkVukXK9cFS_jJiJybWRyJVtk_6lAXI6Jd2h",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD6RKo8fYHqwHqxqGm8bR7zqJxKjLp8vCz5TnQjKz9xVqJm3Yw8Lp6nRq4sT2vU5wX7yZ9aB1cD3eF5gH7iJ9kL1mN3oP5qR7sT9uV1wX3yZ5aB7cD9eF1gH3i",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBnC4dE6fG8hI0jK2lM4nO6pQ8rS0tU2vW4xY6zA8bC0dE2fG4hI6jK8lM0nO2pQ4rS6tU8vW0xY2zA4bC6dE8fG0hI2jK4lM6nO8pQ0rS2tU4vW6xY8zA0bC",
];

function getAvatarUrl(index: number): string {
  return avatarUrls[index % avatarUrls.length];
}

function readTripInvitedFlag(tripId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`trip_${tripId}_invited`) === "true";
}

export function InviteMemberForm({ trip }: { trip: TripDocument }) {
  const pathname = usePathname();
  const [hasInvited, setHasInvited] = useState(() => readTripInvitedFlag(trip.id));
  const daysLeft = daysUntil(trip.startDate);

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}${pathname}`
    : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      localStorage.setItem(`trip_${trip.id}_invited`, "true");
      setHasInvited(true);
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
        localStorage.setItem(`trip_${trip.id}_invited`, "true");
        setHasInvited(true);
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  // 显示前 6 个旅伴头像
  const visibleMembers = trip.members.slice(0, 6);
  const remainingCount = trip.members.length - 6;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-950">行程动态</h3>
          <p className="text-sm text-slate-500">
            大家已准备就绪。距离出发还有{daysLeft}天！
          </p>
          {trip.themes && trip.themes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {trip.themes.map((theme) => (
                <span
                  key={theme}
                  className="rounded-full bg-mint-100 px-2.5 py-1.5 text-[10px] font-semibold text-mint-700"
                >
                  {getThemeLabel(theme)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {visibleMembers.map((member, index) => (
              <div
                key={member.id}
                className="relative h-10 w-10 rounded-full ring-2 ring-white overflow-hidden bg-slate-100"
                style={{ zIndex: 4 - index }}
              >
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={getAvatarUrl(index)}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                )}
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
          <button
            type="button"
            onClick={handleShare}
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7h4v3H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm-9 4c0-2.66 5.33-4 8-4s8 1.34 8 4v2H6v-2z"/>
            </svg>
            <span className="text-xs font-bold">{hasInvited ? "已邀请" : "邀请好友"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
