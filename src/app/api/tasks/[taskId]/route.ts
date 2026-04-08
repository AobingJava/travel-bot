import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { updateTaskStatus } from "@/lib/app-service";
import { updateTaskSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { taskId } = await context.params;
    const payload = updateTaskSchema.parse(await request.json());
    const trip = await updateTaskStatus(taskId, payload.status);
    return NextResponse.json({ trip });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "输入不合法。" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新失败。" },
      { status: 400 },
    );
  }
}
