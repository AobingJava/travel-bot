import { NextResponse } from "next/server";

import { acceptInvitation } from "@/lib/app-service";

type RouteContext = {
  params: Promise<{ tripId: string; inviteId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { tripId, inviteId } = await context.params;
    const trip = await acceptInvitation(tripId, inviteId);
    return NextResponse.json({ trip });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "接受邀请失败。" },
      { status: 400 },
    );
  }
}
