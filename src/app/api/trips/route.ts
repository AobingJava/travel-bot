import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createTrip, getHomeBootstrap } from "@/lib/app-service";
import { createTripSchema } from "@/lib/validators";

export async function GET() {
  const bootstrap = await getHomeBootstrap();
  return NextResponse.json({
    trips: bootstrap.trips,
    currentUser: bootstrap.currentUser,
    dataSource: bootstrap.dataSource,
  });
}

export async function POST(request: Request) {
  try {
    const payload = createTripSchema.parse(await request.json());
    const trip = await createTrip(payload);
    return NextResponse.json({ tripId: trip.id, trip });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "输入不合法。" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建失败。" },
      { status: 500 },
    );
  }
}
