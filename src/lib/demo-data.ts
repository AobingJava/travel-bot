import type { AppBootstrap, MagicLinkRecord, SessionUser, TripDocument } from "@/lib/types";

const now = new Date("2026-04-08T09:00:00+08:00").toISOString();

function clone<T>(value: T) {
  return structuredClone(value);
}

const demoUser: SessionUser = {
  email: "aihe@example.com",
  name: "Aihe",
  avatarText: "你",
};

const seedTrip: TripDocument = {
  id: "trip_kyoto_osaka",
  slug: "kyoto-osaka-7d",
  name: "京都 + 大阪 7 日游",
  destination: "京都 + 大阪",
  startDate: "2026-05-10",
  endDate: "2026-05-17",
  travelerCount: 4,
  themes: ["culture", "food", "shopping", "nature"],
  ownerEmail: demoUser.email,
  ownerName: demoUser.name,
  stage: "planning",
  tasks: [
    {
      id: "task_pre_1",
      title: "抵达关西机场，兑换交通 IC 卡",
      notes: "建议提前在机场一次性完成交通准备。",
      phase: "pre",
      label: "transport",
      status: "done",
      sortOrder: 1,
      source: "ai",
    },
    {
      id: "task_pre_2",
      title: "办理酒店入住，确认京都站前 ANA",
      notes: "核对入住时间和行李寄存说明。",
      phase: "pre",
      label: "lodging",
      status: "done",
      sortOrder: 2,
      source: "ai",
    },
    {
      id: "task_pre_3",
      title: "预约伏见稻荷大社参观时段",
      notes: "建议 16:00 前到，避开人流。",
      phase: "pre",
      label: "suggestion",
      status: "open",
      sortOrder: 3,
      source: "ai",
    },
    {
      id: "task_pre_4",
      title: "晚餐先预订锦市场附近 Omen 乌冬",
      notes: "适合第一晚轻松落地。",
      phase: "pre",
      label: "food",
      status: "open",
      sortOrder: 4,
      source: "ai",
    },
    {
      id: "task_during_1",
      title: "岚山竹林 + 天龙寺",
      notes: "09:00 出发，尽量抢早。",
      phase: "during",
      label: "suggestion",
      status: "open",
      dayIndex: 1,
      dayLabel: "明日",
      dueDate: "2026-05-13",
      sortOrder: 1,
      source: "replan",
      lat: 35.0170,
      lng: 135.6713,
      locationName: "岚山竹林",
      scheduledTime: "09:00",
      durationMinutes: 150,
      travelMode: "train",
      travelMinutes: 28,
      routeHint: "上午先去户外，避开午后降雨窗口。",
    },
    {
      id: "task_during_2",
      title: "下午雨天备选：京都铁道博物馆",
      notes: "如果午后降雨加强，直接切到室内路线。",
      phase: "during",
      label: "backup",
      status: "open",
      dayIndex: 1,
      dayLabel: "明日",
      dueDate: "2026-05-13",
      sortOrder: 2,
      source: "replan",
      lat: 35.0145,
      lng: 135.7414,
      locationName: "京都铁道博物馆",
      scheduledTime: "13:30",
      durationMinutes: 110,
      travelMode: "walk",
      travelMinutes: 16,
      routeHint: "如果雨势加强，直接切到室内，不需要回酒店二次折返。",
    },
    {
      id: "task_during_3",
      title: "道顿堀晚间散步 + 章鱼烧打卡",
      notes: "雨停后切到大阪夜间路线。",
      phase: "during",
      label: "food",
      status: "open",
      dayIndex: 2,
      dayLabel: "后日",
      dueDate: "2026-05-14",
      sortOrder: 3,
      source: "ai",
      lat: 34.6686,
      lng: 135.5010,
      locationName: "道顿堀",
      scheduledTime: "18:20",
      durationMinutes: 135,
      travelMode: "subway",
      travelMinutes: 24,
      routeHint: "傍晚进场，街区氛围和餐饮密度更适合夜间打卡。",
    },
    {
      id: "task_post_1",
      title: "整理这次旅行的照片与票据",
      notes: "回程后 24 小时内完成，记忆最完整。",
      phase: "post",
      label: "summary",
      status: "open",
      sortOrder: 1,
      source: "ai",
    },
    {
      id: "task_post_2",
      title: "请 AI 生成旅后总结与下次建议",
      notes: "自动汇总高光时刻、踩坑和预算复盘。",
      phase: "post",
      label: "summary",
      status: "open",
      sortOrder: 2,
      source: "ai",
    },
  ],
  members: [
    {
      id: "member_owner",
      email: demoUser.email,
      name: demoUser.name,
      avatarText: "你",
      role: "owner",
      inviteStatus: "confirmed",
      invitedAt: now,
      confirmedAt: now,
    },
    {
      id: "member_zhang",
      email: "zhang@example.com",
      name: "张明远",
      avatarText: "张",
      role: "traveler",
      inviteStatus: "confirmed",
      invitedAt: now,
      confirmedAt: now,
    },
    {
      id: "member_li",
      email: "li@example.com",
      name: "李晓雯",
      avatarText: "李",
      role: "traveler",
      inviteStatus: "pending",
      invitedAt: now,
    },
    {
      id: "member_wang",
      email: "wang@example.com",
      name: "王芳",
      avatarText: "王",
      role: "traveler",
      inviteStatus: "confirmed",
      invitedAt: now,
      confirmedAt: now,
    },
  ],
  dailySuggestions: [
    {
      id: "day_1",
      dayIndex: 0,
      label: "5月10日",
      title: "京都站周边轻松落地",
      summary: "优先安顿交通与入住，晚餐留给锦市场一带，给团队一个轻松的第一晚。",
    },
    {
      id: "day_2",
      dayIndex: 1,
      label: "5月13日",
      title: "岚山上午户外，下午留室内备选",
      summary: "天气窗口更适合上午去竹林和天龙寺，午后如遇降雨则切换到铁道博物馆。",
    },
    {
      id: "day_3",
      dayIndex: 2,
      label: "5月14日",
      title: "大阪夜间节奏拉满",
      summary: "道顿堀夜游和小吃打卡安排在后半程，留足弹性给购物和城市漫游。",
    },
  ],
  banner: {
    title: "AI 已根据天气调整明日安排",
    body: "天气预报显示 5 月 13 日午后有雨，已将岚山竹林提前到上午，并补充京都铁道博物馆作为室内备选。",
    tone: "weather",
    updatedAt: now,
  },
  events: [
    {
      id: "event_1",
      type: "trip_replanned",
      title: "行程变更提醒",
      body: "13 日下午因天气调整，铁道博物馆替换岚山小火车，并通知所有成员。",
      actorName: "Wander AI",
      createdAt: "2026-04-08T09:10:00+08:00",
    },
    {
      id: "event_2",
      type: "task_completed",
      title: "小张完成了任务",
      body: "「预订大阪热门市场午餐餐厅」已标记完成。",
      actorName: "张明远",
      createdAt: "2026-04-08T07:00:00+08:00",
    },
    {
      id: "event_3",
      type: "member_joined",
      title: "小李接受了邀请",
      body: "李晓雯加入了京都大阪 7 日游，欢迎！",
      actorName: "Wander AI",
      createdAt: "2026-04-07T20:30:00+08:00",
    },
  ],
  notifications: [
    {
      id: "notice_1",
      tripId: "trip_kyoto_osaka",
      title: "明日行程已更新",
      body: "岚山安排提前，已同步新增室内备选。",
      createdAt: "2026-04-08T09:10:00+08:00",
    },
    {
      id: "notice_2",
      tripId: "trip_kyoto_osaka",
      title: "张明远完成了一项预订任务",
      body: "大阪午餐已确认，不需要重复预约。",
      createdAt: "2026-04-08T07:00:00+08:00",
    },
  ],
  createdAt: now,
  updatedAt: now,
};

export interface DemoState {
  trips: TripDocument[];
  magicLinks: MagicLinkRecord[];
}

declare global {
  var __travelBotDemoState__: DemoState | undefined;
}

export function getDemoState() {
  if (!globalThis.__travelBotDemoState__) {
    globalThis.__travelBotDemoState__ = {
      trips: [],
      magicLinks: [],
    };
  } else {
    globalThis.__travelBotDemoState__ = syncSeedTrip(globalThis.__travelBotDemoState__);
  }

  return globalThis.__travelBotDemoState__;
}

export function getDemoBootstrap(currentUser: SessionUser | null): AppBootstrap {
  const state = getDemoState();
  const unreadCount = state.trips
    .flatMap((trip) => trip.notifications)
    .filter((notice) => !notice.readAt).length;

  return {
    trips: clone(state.trips),
    featuredTripId: state.trips[0]?.id,
    currentUser: currentUser ?? demoUser,
    unreadCount,
    dataSource: "demo",
  };
}

export function getDefaultDemoUser() {
  return demoUser;
}

function syncSeedTrip(state: DemoState): DemoState {
  const seedIndex = state.trips.findIndex((trip) => trip.id === seedTrip.id);

  if (seedIndex === -1) {
    return {
      ...state,
      trips: [clone(seedTrip), ...state.trips],
    };
  }

  const current = state.trips[seedIndex];
  const seedTaskMap = new Map(seedTrip.tasks.map((task) => [task.id, task]));

  const mergedTrip: TripDocument = {
    ...clone(seedTrip),
    ...current,
    tasks: current.tasks.map((task) => ({
      ...seedTaskMap.get(task.id),
      ...task,
    })),
  };

  const trips = [...state.trips];
  trips[seedIndex] = mergedTrip;

  return {
    ...state,
    trips,
  };
}
