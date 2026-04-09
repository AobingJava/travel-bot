"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const items = [
  { key: "overview", label: "规划" },
  { key: "tasks", label: "任务" },
  { key: "companions", label: "旅伴" },
  { key: "meeting", label: "回忆" },
] as const;

export function MobileNav({ tripId }: { tripId: string }) {
  const searchParams = useSearchParams();
  const activeView = searchParams.get("view") ?? "meeting";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/60">
      <div className="mx-auto flex max-w-[430px] gap-1 px-3 pt-2 pb-[calc(0.5rem+var(--safe-bottom))]">
        {items.map((item) => {
          const isActive = item.key === activeView;

          return (
            <Link
              key={item.key}
              href={`/trips/${tripId}?view=${item.key}`}
              className={`flex-1 rounded-xl py-2 text-center text-[13px] font-semibold transition active:scale-[0.96] ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
