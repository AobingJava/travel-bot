"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { TripDocument } from "@/lib/types";

/** 若行程仅含装备清单（fullPlanReady === false），在行程任意 tab 加载时触发 complete-plan，无需先勾选完待办项。 */
export function TripFullPlanLoader({
  trip,
}: {
  readonly trip: Pick<TripDocument, "id" | "banner">;
}) {
  const router = useRouter();
  const ran = useRef(false);
  const [retryTick, setRetryTick] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const needsContinuation = trip.banner.fullPlanReady === false;

  useEffect(() => {
    if (!needsContinuation) {
      ran.current = false;
      return;
    }
    if (ran.current) {
      return;
    }
    ran.current = true;
    setStatus("loading");
    setErrMsg(null);

    void (async () => {
      try {
        const res = await fetch(`/api/trips/${trip.id}/complete-plan`, { method: "POST" });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          alreadyComplete?: boolean;
          error?: string;
        };
        if (!res.ok) {
          setStatus("error");
          setErrMsg(data.error ?? `请求失败 (${res.status})`);
          ran.current = false;
          return;
        }
        router.refresh();
        setStatus("idle");
      } catch (e) {
        setStatus("error");
        setErrMsg(e instanceof Error ? e.message : "网络错误");
        ran.current = false;
      }
    })();
  }, [needsContinuation, trip.id, router, retryTick]);

  if (!needsContinuation && status !== "error") {
    return null;
  }

  if (status === "error") {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        <p className="font-medium">完整行程生成失败</p>
        <p className="mt-1 text-rose-700">{errMsg}</p>
        <button
          type="button"
          onClick={() => {
            ran.current = false;
            setRetryTick((t) => t + 1);
          }}
          className="mt-2 text-sm font-semibold text-rose-900 underline"
        >
          重试
        </button>
      </div>
    );
  }

  if (!needsContinuation) {
    return null;
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
      <p className="flex items-center gap-2 font-medium">
        <span className="inline-block size-2 animate-pulse rounded-full bg-orange-500" />
        正在生成任务、路线与每日建议（与创建装备清单分开请求，可等待数分钟）…
      </p>
    </div>
  );
}
