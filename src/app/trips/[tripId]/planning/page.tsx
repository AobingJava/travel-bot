"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/** 旧链接兼容：装备清单已在首页流式生成，完整规划在待办页触发。 */
export default function PlanningRedirectPage() {
  const router = useRouter();
  const params = useParams<{ tripId: string }>();
  const tripId = params.tripId;

  useEffect(() => {
    router.replace(`/trips/${tripId}?view=todos`);
  }, [tripId, router]);

  return (
    <main className="mx-auto flex min-h-[40vh] w-full max-w-[430px] flex-col items-center justify-center px-4">
      <p className="text-sm text-slate-500">正在进入行程…</p>
    </main>
  );
}
