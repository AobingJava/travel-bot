import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requestMagicLink } from "@/lib/app-service";
import { magicLinkRequestSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = magicLinkRequestSchema.parse(await request.json());
    const devLoginUrl = await requestMagicLink(payload);

    return NextResponse.json({
      message: "登录链接已发送，请查收邮箱。",
      devLoginUrl:
        process.env.NODE_ENV === "development" ? devLoginUrl : undefined,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "输入不合法。" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "发送失败。" },
      { status: 500 },
    );
  }
}
