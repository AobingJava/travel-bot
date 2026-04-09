"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const items = [
  {
    key: "overview",
    label: "规划",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    key: "tasks",
    label: "任务",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: "companions",
    label: "旅伴",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    key: "meeting",
    label: "回忆",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
] as const;

export function MobileNav({ tripId }: { tripId: string }) {
  const searchParams = useSearchParams();
  const activeView = searchParams.get("view") ?? "overview";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/60">
      <div className="mx-auto flex max-w-[430px] gap-1.5 px-3 pt-2 pb-[calc(0.5rem+var(--safe-bottom))]">
        {items.map((item, index) => {
          const isActive = item.key === activeView;

          return (
            <div key={item.key} className="flex-1">
              <Link
                href={`/trips/${tripId}?view=${item.key}`}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-center text-[11px] font-semibold transition active:scale-[0.96] ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <span className={isActive ? "text-white" : ""}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
