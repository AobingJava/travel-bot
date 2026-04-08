import { NextResponse } from "next/server";

import { triggerReplan } from "@/lib/app-service";

type RouteContext = {
  params: Promise<{ tripId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { tripId } = await context.params;
    const trip = await triggerReplan(tripId);
    return NextResponse.json({ trip });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "重排失败。" },
      { status: 400 },
    );
  }
}
