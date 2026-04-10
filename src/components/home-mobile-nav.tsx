"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
};

export function HomeMobileNav() {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/", label: "探索", icon: "explore", active: pathname === "/" },
    { href: "#ongoing", label: "行程", icon: "travel_explore" },
    { href: "#", label: "收藏", icon: "bookmark" },
    { href: "/auth", label: "我的", icon: "person", active: pathname === "/auth" },
  ];

  return (
    <nav className="fixed bottom-0 z-50 flex h-20 w-full items-center justify-around rounded-t-[1.5rem] bg-[#fbf9f7]/70 px-4 pb-[max(12px,var(--safe-bottom))] shadow-[0_-4px_40px_rgba(27,28,27,0.06)] backdrop-blur-md">
      {items.map((item) => {
        const isActive = Boolean(item.active);
        const className = isActive
          ? "flex flex-col items-center justify-center rounded-full bg-[#f26419] px-4 py-1 text-white transition-transform active:scale-90"
          : "flex flex-col items-center justify-center text-slate-500 transition-colors active:scale-90 hover:text-[#a03b00]";

        return (
          <Link key={item.label} href={item.href} className={className}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
