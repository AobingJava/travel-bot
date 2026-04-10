import { NextRequest, NextResponse } from "next/server";
import type { TripTask } from "@/lib/types";
import { createId } from "@/lib/utils";
import { getFallbackMapPins } from "@/lib/planner";

type StoredCheckinTask = TripTask & { isUserCheckin?: boolean };

// 内存存储用户打卡点
const checkinTasks = new Map<string, StoredCheckinTask[]>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { lat, lng } = body;

    if (!lat || !lng) {
      return NextResponse.json({ error: "缺少位置信息" }, { status: 400 });
    }

    // 查找最近的景点
    const allPins = getAllMapPins();
    const nearestPin = findNearestPin(lat, lng, allPins);

    // 生成打卡任务
    const checkinTask = {
      id: createId("checkin"),
      title: `打卡：${nearestPin?.name || "当前位置"}`,
      notes: `基于您的实时定位 (${lat.toFixed(4)}, ${lng.toFixed(4)}) 生成的打卡点。`,
      phase: "during" as const,
      label: "suggestion" as const,
      status: "open" as const,
      dayIndex: 0,
      dayLabel: "今天",
      sortOrder: 999,
      source: "manual" as const,
      lat: nearestPin?.lat || lat,
      lng: nearestPin?.lng || lng,
      locationName: nearestPin?.name || "自定义打卡点",
      scheduledTime: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      durationMinutes: 60,
      travelMinutes: 0,
      travelMode: "walk" as const,
      routeHint: "这是基于您当前定位推荐的打卡地点。",
      isUserCheckin: true,
    };

    // 存储打卡任务
    const existingCheckins = checkinTasks.get(tripId) || [];
    existingCheckins.push(checkinTask);
    checkinTasks.set(tripId, existingCheckins);

    return NextResponse.json({
      success: true,
      task: checkinTask,
    });
  } catch (error) {
    console.error("创建打卡点失败:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  const checkins = checkinTasks.get(tripId) || [];
  return NextResponse.json({ checkins });
}

// 获取所有景点数据
function getAllMapPins() {
  const destinations = [
    "日本", "东京", "大阪", "京都",
    "韩国", "首尔",
    "泰国", "曼谷", "普吉岛",
    "巴厘岛",
    "新加坡",
    "马尔代夫",
    "澳大利亚", "悉尼",
    "美国", "纽约", "洛杉矶",
    "法国", "巴黎",
    "意大利", "罗马",
    "英国", "伦敦",
    "瑞士",
    "新西兰",
    "北京", "上海", "西安", "成都", "重庆", "杭州", "三亚",
  ];

  const pins: Array<{ lat: number; lng: number; name: string }> = [];
  for (const dest of destinations) {
    const destPins = getFallbackMapPins(dest);
    pins.push(...destPins);
  }
  return pins;
}

// 查找最近的景点
function findNearestPin(userLat: number, userLng: number, pins: Array<{ lat: number; lng: number; name: string }>) {
  if (pins.length === 0) return null;

  let nearest = pins[0];
  let minDistance = Number.MAX_SAFE_INTEGER;

  for (const pin of pins) {
    const distance = calculateDistance(userLat, userLng, pin.lat, pin.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = pin;
    }
  }

  return nearest;
}

// 计算两点之间的距离（Haversine 公式，单位：公里）
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 地球半径（公里）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
