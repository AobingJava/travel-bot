import { NextResponse } from "next/server";

import { getHomeBootstrap } from "@/lib/app-service";

export async function GET() {
  const bootstrap = await getHomeBootstrap();
  const notifications = bootstrap.trips
    .flatMap((trip) => trip.notifications)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return NextResponse.json({
    notifications,
    unreadCount: notifications.filter((notice) => !notice.readAt).length,
  });
}
