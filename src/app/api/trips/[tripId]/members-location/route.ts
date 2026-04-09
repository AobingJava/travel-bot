import { NextResponse } from "next/server";
import { getTripWithViewer } from "@/lib/app-service";
import type { MemberLocationStatus, TripMember } from "@/lib/types";

// 计算两点间距离（Haversine 公式）
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // 地球半径（米）
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

// 根据目的地获取大致坐标（简化版，实际应该调用地理编码 API）
function getDestinationCoordinates(destination: string): { lat: number; lng: number } | null {
  // 简化处理：根据常见目的地返回坐标
  const coordinates: Record<string, { lat: number; lng: number }> = {
    "日本": { lat: 35.6762, lng: 139.6503 }, // 东京
    "东京": { lat: 35.6762, lng: 139.6503 },
    "大阪": { lat: 34.6937, lng: 135.5023 },
    "京都": { lat: 35.0116, lng: 135.7681 },
    "泰国": { lat: 13.7563, lng: 100.5018 }, // 曼谷
    "曼谷": { lat: 13.7563, lng: 100.5018 },
    "韩国": { lat: 37.5665, lng: 126.978 }, // 首尔
    "首尔": { lat: 37.5665, lng: 126.978 },
    "美国": { lat: 40.7128, lng: -74.006 }, // 纽约
    "纽约": { lat: 40.7128, lng: -74.006 },
    "洛杉矶": { lat: 34.0522, lng: -118.2437 },
    "旧金山": { lat: 37.7749, lng: -122.4194 },
    "巴黎": { lat: 48.8566, lng: 2.3522 },
    "伦敦": { lat: 51.5074, lng: -0.1278 },
    "新加坡": { lat: 1.3521, lng: 103.8198 },
    "澳洲": { lat: -33.8688, lng: 151.2093 }, // 悉尼
    "悉尼": { lat: -33.8688, lng: 151.2093 },
  };

  // 匹配目的地
  for (const [key, coords] of Object.entries(coordinates)) {
    if (destination.toLowerCase().includes(key.toLowerCase())) {
      return coords;
    }
  }

  return null;
}

// 模拟旅伴位置数据（实际应该从数据库或实时位置服务获取）
function generateMemberLocations(
  members: TripMember[],
  userLocation: { lat: number; lng: number } | null,
  destination: string,
  startDate: string,
  currentLocation: { lat: number; lng: number } | null
): MemberLocationStatus[] {
  const now = new Date();
  const tripStart = new Date(startDate);
  const daysUntilStart = Math.ceil((tripStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isBeforeTrip = daysUntilStart > 0;

  // 获取目的地坐标
  const destCoords = getDestinationCoordinates(destination);

  // 检查是否在目的地国家/城市（简化判断：距离目的地 50km 内）
  const isAtDestination =
    currentLocation &&
    destCoords &&
    calculateDistance(currentLocation.lat, currentLocation.lng, destCoords.lat, destCoords.lng) < 50000;

  return members.map((member, index) => {
    let mockLat: number;
    let mockLng: number;
    let statusType: MemberLocationStatus["statusType"];
    let status: string;
    let distance: number | undefined;
    let estimatedArrival: number | undefined;

    if (isBeforeTrip && !isAtDestination) {
      // 行程还未开始 - 显示离高铁站/火车站的距离
      // 模拟一个集合点（比如市中心或交通枢纽）
      const gatheringPoint = userLocation
        ? { lat: userLocation.lat + 0.02, lng: userLocation.lng + 0.02 }
        : { lat: 39.9042, lng: 116.4074 }; // 默认北京

      const offset = (index + 1) * 0.01;
      mockLat = gatheringPoint.lat + (Math.random() - 0.5) * offset;
      mockLng = gatheringPoint.lng + (Math.random() - 0.5) * offset;

      distance = calculateDistance(mockLat, mockLng, gatheringPoint.lat, gatheringPoint.lng);
      const walkingMinutes = Math.round(distance / 80); // 步行速度约 80 米/分钟

      if (distance < 200) {
        statusType = "arrived";
        status = "已到达集合点";
      } else if (distance < 2000) {
        statusType = "late";
        status = `距集合点 ${Math.round(distance)} 米，约${walkingMinutes}分钟`;
        estimatedArrival = walkingMinutes;
      } else {
        statusType = "not-out";
        status = `距集合点 ${(distance / 1000).toFixed(1)} 公里`;
      }
    } else if (isAtDestination) {
      // 已在目的地 - 展示当前位置状态
      const offset = (index + 1) * 0.008;
      mockLat = currentLocation
        ? currentLocation.lat + (Math.random() - 0.5) * offset
        : (destCoords?.lat || 0) + (Math.random() - 0.5) * offset;
      mockLng = currentLocation
        ? currentLocation.lng + (Math.random() - 0.5) * offset
        : (destCoords?.lng || 0) + (Math.random() - 0.5) * offset;

      // 模拟不同的游玩状态
      const activities = [
        { name: "在酒店休息", statusType: "arrived" as const },
        { name: "附近探索中", statusType: "late" as const },
        { name: "外出购物", statusType: "not-out" as const },
        { name: "景点打卡", statusType: "at-destination" as const },
      ];
      const activity = activities[index % activities.length];
      statusType = activity.statusType;
      status = activity.name;
      distance = undefined;
      estimatedArrival = undefined;
    } else {
      // 在路途中
      const offset = (index + 1) * 0.005;
      mockLat = userLocation
        ? userLocation.lat + (Math.random() - 0.5) * offset
        : (destCoords?.lat || 0) + (Math.random() - 0.5) * offset;
      mockLng = userLocation
        ? userLocation.lng + (Math.random() - 0.5) * offset
        : (destCoords?.lng || 0) + (Math.random() - 0.5) * offset;

      if (userLocation) {
        distance = calculateDistance(mockLat, mockLng, userLocation.lat, userLocation.lng);
        const drivingMinutes = Math.round(distance / 500); // 驾车速度约 500 米/分钟

        if (distance < 100) {
          statusType = "arrived";
          status = "已汇合";
        } else if (distance < 3000) {
          statusType = "late";
          status = `距你 ${(distance / 1000).toFixed(1)} 公里，约${drivingMinutes}分钟`;
          estimatedArrival = drivingMinutes;
        } else {
          statusType = "not-out";
          status = `距你 ${(distance / 1000).toFixed(1)} 公里`;
        }
      } else {
        statusType = "unknown";
        status = "位置未知";
      }
    }

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
      status,
      statusType,
      distance,
      estimatedArrival,
    };
  });
}

export async function POST(request: Request, context: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await context.params;
    const body = await request.json();
    const { userLocation, currentLocation } = body;

    // 获取行程信息
    const { trip } = await getTripWithViewer(tripId);

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // 生成旅伴位置状态
    const memberLocations = generateMemberLocations(
      trip.members,
      userLocation,
      trip.destination,
      trip.startDate,
      currentLocation
    );

    // 判断是否显示提醒界面
    const isAtDestination = memberLocations.some((loc) => loc.statusType === "at-destination");
    const showCallUI = !isAtDestination;

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
