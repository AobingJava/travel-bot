import { NextResponse } from "next/server";

import { appEnv } from "@/lib/env";
import { runScheduledReplans } from "@/lib/app-service";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronHeader = request.headers.get("x-vercel-cron");
  const isAuthorized =
    authHeader === `Bearer ${appEnv.cronSecret}` || cronHeader === "1";

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updated = await runScheduledReplans();
  return NextResponse.json({ updated });
}
