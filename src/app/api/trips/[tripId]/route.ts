import { NextRequest, NextResponse } from "next/server";

import { getTripWithViewer, updateTripBasicInfo } from "@/lib/app-service";
import type { PackingCategory, TripStage } from "@/lib/types";

const PACKING_CAT: PackingCategory[] = [
  "core",
  "documents",
  "clothing",
  "electronics",
  "toiletries",
  "weather",
  "gear",
];

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { tripId } = await context.params;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validStages: TripStage[] = ["draft", "planning", "ongoing", "completed"];
    const stageRaw = body.stage;
    const stage =
      typeof stageRaw === "string" && validStages.includes(stageRaw as TripStage)
        ? (stageRaw as TripStage)
        : undefined;

    const travelerRaw = body.travelerCount;
    const travelerCount =
      typeof travelerRaw === "number"
        ? travelerRaw
        : typeof travelerRaw === "string"
          ? Number.parseInt(travelerRaw, 10)
          : undefined;

    let packingCategoryLabels: Partial<Record<PackingCategory, string | null>> | undefined;
    const labelsRaw = body.packingCategoryLabels;
    if (labelsRaw != null && typeof labelsRaw === "object" && !Array.isArray(labelsRaw)) {
      packingCategoryLabels = {};
      for (const key of PACKING_CAT) {
        if (!Object.prototype.hasOwnProperty.call(labelsRaw, key)) continue;
        const v = (labelsRaw as Record<string, unknown>)[key];
        if (v === null) {
          packingCategoryLabels[key] = null;
        } else if (typeof v === "string") {
          packingCategoryLabels[key] = v;
        }
      }
      if (Object.keys(packingCategoryLabels).length === 0) {
        packingCategoryLabels = undefined;
      }
    }

    const trip = await updateTripBasicInfo(tripId, {
      name: typeof body.name === "string" ? body.name : undefined,
      destination: typeof body.destination === "string" ? body.destination : undefined,
      startDate: typeof body.startDate === "string" ? body.startDate : undefined,
      endDate: typeof body.endDate === "string" ? body.endDate : undefined,
      travelerCount: Number.isFinite(travelerCount) ? travelerCount : undefined,
      stage,
      packingCategoryLabels,
    });

    return NextResponse.json({ trip });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新失败";
    if (message === "行程不存在") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === "只有发起人可以修改行程。") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === "无效的状态") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("PATCH trip:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
