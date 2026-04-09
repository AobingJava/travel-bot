import { NextResponse } from "next/server";

import { getTripWithViewer, updateTripStage } from "@/lib/app-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;

  try {
    const { trip } = await getTripWithViewer(tripId);

    if (!trip) {
      return NextResponse.json({ error: "行程不存在" }, { status: 404 });
    }

    const updatedTrip = await updateTripStage(tripId, "completed");

    return NextResponse.json({ success: true, trip: updatedTrip });
  } catch (error) {
    console.error("Failed to end trip", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "结束行程失败" },
      { status: 500 }
    );
  }
}
