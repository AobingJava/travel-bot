"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function ReplanButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          await fetch(`/api/trips/${tripId}/replan`, {
            method: "POST",
          });
          router.refresh();
        });
      }}
      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
      disabled={isPending}
    >
      {isPending ? "重排中..." : "AI 重新调整"}
    </button>
  );
}
