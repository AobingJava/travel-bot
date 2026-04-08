"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import type { TaskStatus } from "@/lib/types";

export function TaskToggleButton({
  taskId,
  status,
}: {
  taskId: string;
  status: TaskStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          await fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: status === "done" ? "open" : "done",
            }),
          });

          router.refresh();
        });
      }}
      disabled={isPending}
      className={`mt-1 h-6 w-6 shrink-0 rounded-full border transition ${
        status === "done"
          ? "border-emerald-500 bg-emerald-400"
          : "border-slate-300 bg-white"
      } ${isPending ? "opacity-60" : ""}`}
      aria-label={status === "done" ? "标记为未完成" : "标记为已完成"}
    />
  );
}
