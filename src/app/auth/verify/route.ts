import { NextResponse } from "next/server";

import { consumeMagicLink } from "@/lib/app-service";
import { setSessionCookie } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const redirectParam = url.searchParams.get("redirect");
  const redirectTo =
    redirectParam && redirectParam.startsWith("/") ? redirectParam : "/";

  if (!token) {
    return NextResponse.redirect(new URL("/auth?error=missing-token", url));
  }

  try {
    const result = await consumeMagicLink(token);
    await setSessionCookie(result.user);
    return NextResponse.redirect(new URL(result.redirectTo || redirectTo, url));
  } catch {
    return NextResponse.redirect(new URL("/auth?error=invalid-token", url));
  }
}
