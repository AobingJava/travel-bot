import { NextResponse } from "next/server";

import { purgeAllTripsData } from "@/lib/app-service";
import { appEnv } from "@/lib/env";

/**
 * 删除所有行程（trip_documents + member_locations）及进程内装备清单缓存。
 * 鉴权与 cron 一致：Header `Authorization: Bearer <CRON_SECRET>` 或 Vercel Cron。
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronHeader = request.headers.get("x-vercel-cron");
  const isAuthorized =
    authHeader === `Bearer ${appEnv.cronSecret}` || cronHeader === "1";

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await purgeAllTripsData();
    return NextResponse.json({
      ok: true,
      ...result,
      hint:
        result.storage === "demo"
          ? "Demo 模式：数据仅在当前 Node 进程内存中；重启 dev 也会清空。"
          : "已从 D1 删除 trip_documents 与 member_locations。",
    });
  } catch (e) {
    console.error("purge-trips failed", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Purge failed" },
      { status: 500 },
    );
  }
}
