import { NextResponse } from "next/server";

import { completeTripFullPlan } from "@/lib/app-service";

/** 允许较长时间的大模型合并（Vercel Fluid / 自建 Node 可调大） */
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    const { tripId } = await params;
    const result = await completeTripFullPlan(tripId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "complete-plan failed";
    const status =
      message.includes("行程不存在") ? 404 : message.includes("只有发起人可以") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
