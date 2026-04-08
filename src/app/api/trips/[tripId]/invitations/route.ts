import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { inviteMember } from "@/lib/app-service";
import { inviteMemberSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ tripId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { tripId } = await context.params;
    const payload = inviteMemberSchema.parse(await request.json());
    const trip = await inviteMember(tripId, payload);

    return NextResponse.json({ trip });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "输入不合法。" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "邀请失败。" },
      { status: 500 },
    );
  }
}
