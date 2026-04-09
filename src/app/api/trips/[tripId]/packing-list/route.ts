import { NextRequest, NextResponse } from "next/server";
import { getTripWithViewer } from "@/lib/app-service";
import type { PackingListItem } from "@/lib/types";

// 使用内存存储装备清单（生产环境应该使用数据库）
const packingLists = new Map<string, PackingListItem[]>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const { trip } = await getTripWithViewer(tripId);

    if (!trip) {
      return NextResponse.json({ error: "行程不存在" }, { status: 404 });
    }

    // 优先使用存储的装备清单，否则使用 trip 中的
    const storedList = packingLists.get(tripId);
    if (storedList) {
      return NextResponse.json({ packingList: storedList });
    }

    return NextResponse.json({ packingList: trip.packingList || [] });
  } catch (error) {
    console.error("获取装备清单失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const { trip } = await getTripWithViewer(tripId);

    if (!trip) {
      return NextResponse.json({ error: "行程不存在" }, { status: 404 });
    }

    const body = await request.json();
    const { packingList } = body;

    if (!Array.isArray(packingList)) {
      return NextResponse.json({ error: " invalid data" }, { status: 400 });
    }

    // 存储到内存中
    packingLists.set(tripId, packingList);

    return NextResponse.json({ success: true, packingList });
  } catch (error) {
    console.error("保存装备清单失败:", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const { trip } = await getTripWithViewer(tripId);

    if (!trip) {
      return NextResponse.json({ error: "行程不存在" }, { status: 404 });
    }

    const body = await request.json();
    const { itemId, checked } = body;

    if (!itemId || typeof checked !== "boolean") {
      return NextResponse.json({ error: "invalid data" }, { status: 400 });
    }

    let packingList = packingLists.get(tripId) || trip.packingList || [];

    const updatedList = packingList.map((item) =>
      typeof item === "string"
        ? item
        : { ...item, checked: item.id === itemId ? checked : item.checked }
    ) as PackingListItem[];

    packingLists.set(tripId, updatedList);

    return NextResponse.json({ success: true, packingList: updatedList });
  } catch (error) {
    console.error("更新装备清单失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
