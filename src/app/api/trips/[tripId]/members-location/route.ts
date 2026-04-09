import { NextResponse } from "next/server";
import { getTripWithViewer } from "@/lib/app-service";
import type { MemberLocationStatus, TripMember } from "@/lib/types";

// 计算两点间距离（Haversine 公式）
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
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

// 根据目的地获取大致坐标
function getDestinationCoordinates(destination: string): { lat: number; lng: number } {
  const coordinates: Record<string, { lat: number; lng: number }> = {
    "日本": { lat: 35.6762, lng: 139.6503 },
    "东京": { lat: 35.6762, lng: 139.6503 },
    "大阪": { lat: 34.6937, lng: 135.5023 },
    "京都": { lat: 35.0116, lng: 135.7681 },
    "泰国": { lat: 13.7563, lng: 100.5018 },
    "曼谷": { lat: 13.7563, lng: 100.5018 },
    "韩国": { lat: 37.5665, lng: 126.978 },
    "首尔": { lat: 37.5665, lng: 126.978 },
    "美国": { lat: 40.7128, lng: -74.006 },
    "纽约": { lat: 40.7128, lng: -74.006 },
    "洛杉矶": { lat: 34.0522, lng: -118.2437 },
    "旧金山": { lat: 37.7749, lng: -122.4194 },
    "巴黎": { lat: 48.8566, lng: 2.3522 },
    "伦敦": { lat: 51.5074, lng: -0.1278 },
    "新加坡": { lat: 1.3521, lng: 103.8198 },
    "澳洲": { lat: -33.8688, lng: 151.2093 },
    "悉尼": { lat: -33.8688, lng: 151.2093 },
    "北京": { lat: 39.9042, lng: 116.4074 },
    "上海": { lat: 31.2304, lng: 121.4737 },
    "广州": { lat: 23.1291, lng: 113.2644 },
    "深圳": { lat: 22.5431, lng: 114.0579 },
    "成都": { lat: 30.5728, lng: 104.0668 },
    "重庆": { lat: 29.4316, lng: 106.9123 },
    "西安": { lat: 34.3416, lng: 108.9398 },
    "杭州": { lat: 30.2741, lng: 120.1551 },
    "南京": { lat: 32.0603, lng: 118.7969 },
    "武汉": { lat: 30.5928, lng: 114.3055 },
    "厦门": { lat: 24.4798, lng: 118.0894 },
    "三亚": { lat: 18.4066, lng: 109.7460 },
    "丽江": { lat: 26.8721, lng: 100.2278 },
    "大理": { lat: 25.6065, lng: 100.2678 },
    "香格里拉": { lat: 27.8269, lng: 99.7075 },
  };

  for (const [key, coords] of Object.entries(coordinates)) {
    if (destination.toLowerCase().includes(key.toLowerCase())) {
      return coords;
    }
  }

  // 默认返回东京
  return { lat: 35.6762, lng: 139.6503 };
}

// 生成旅伴位置数据 - 始终显示在目的地
function generateMemberLocations(
  members: TripMember[],
  destination: string
): MemberLocationStatus[] {
  const destCoords = getDestinationCoordinates(destination);

  return members.map((member, index) => {
    // 在目的地附近生成一个小的随机偏移，让每个伴侣位置略有不同
    const offset = 0.005; // 大约 500 米范围
    const mockLat = destCoords.lat + (Math.random() - 0.5) * offset;
    const mockLng = destCoords.lng + (Math.random() - 0.5) * offset;

    // 模拟不同的状态
    const statuses = [
      { statusType: "at-destination" as const, status: "在目的地" },
      { statusType: "arrived" as const, status: "已到达" },
      { statusType: "late" as const, status: "探索中" },
    ];
    const statusInfo = statuses[index % statuses.length];

    return {
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        avatarText: member.avatarText,
        avatarUrl: member.avatarUrl,
        role: member.role,
        inviteStatus: member.inviteStatus,
        invitedAt: member.invitedAt,
      },
      lat: mockLat,
      lng: mockLng,
      status: statusInfo.status,
      statusType: statusInfo.statusType,
      distance: undefined,
      estimatedArrival: undefined,
    };
  });
}

export async function POST(request: Request, context: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await context.params;

    // 获取行程信息
    const { trip } = await getTripWithViewer(tripId);

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // 生成旅伴位置状态 - 始终显示在目的地
    const memberLocations = generateMemberLocations(
      trip.members,
      trip.destination
    );

    // 始终显示提醒 UI
    const showCallUI = true;

    return NextResponse.json({
      memberLocations,
      showCallUI,
      destination: trip.destination,
      startDate: trip.startDate,
    });
  } catch (error) {
    console.error("获取旅伴位置失败:", error);
    return NextResponse.json({ error: "获取旅伴位置失败" }, { status: 500 });
  }
}
