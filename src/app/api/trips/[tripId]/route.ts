import { NextResponse } from "next/server";

import { getTripWithViewer } from "@/lib/app-service";

type RouteContext = {
  params: Promise<{ tripId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { tripId } = await context.params;
  const data = await getTripWithViewer(tripId);

  if (!data.trip) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  return NextResponse.json(data);
}
