import "server-only";

import { addHours } from "@/lib/date";
import { getSessionUser, hashToken } from "@/lib/auth";
import { appEnv } from "@/lib/env";
import { sendMail } from "@/lib/mailer";
import {
  generateFullPlanAndMergeIntoTrip,
  generateTripDocument,
  replanTripDocument,
} from "@/lib/planner";
import { clearPackingListMemory } from "@/lib/packing-list-memory";
import { getRepository } from "@/lib/repository";
import type {
  AppBootstrap,
  CreateTripInput,
  InviteMemberInput,
  PackingCategory,
  SessionUser,
  TaskStatus,
  TripDocument,
  TripEvent,
  TripMember,
  TripStage,
} from "@/lib/types";
import { createAvatarText, createId } from "@/lib/utils";

export async function getHomeBootstrap(): Promise<AppBootstrap> {
  const currentUser = await getSessionUser();
  try {
    return await getRepository().getBootstrap(currentUser);
  } catch (error) {
    console.error(
      "getHomeBootstrap failed (often D1/network/keys); using empty trips. Check CLOUDFLARE_* / D1_PROXY_* in .env.local",
      error,
    );
    return {
      trips: [],
      featuredTripId: undefined,
      currentUser: currentUser ?? getRepositoryFallbackUser(),
      unreadCount: 0,
      dataSource: "demo",
    };
  }
}

/** 在装备清单就绪后补全完整规划（任务、每日建议、横幅等），保持 trip id 与 packingList 不变。 */
export async function completeTripFullPlan(tripId: string) {
  const repository = getRepository();
  const viewer = (await getSessionUser()) ?? getRepositoryFallbackUser();
  const trip = await repository.getTrip(tripId);

  if (!trip) {
    throw new Error("行程不存在");
  }

  assertCanMutateTrip(trip, viewer, repository.mode === "demo");

  if (trip.banner.fullPlanReady !== false) {
    return { ok: true as const, alreadyComplete: true as const };
  }

  const input: CreateTripInput = {
    name: trip.name,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    travelerCount: trip.travelerCount,
    themes: trip.themes,
    customTags: trip.customTags,
  };

  const merged = await generateFullPlanAndMergeIntoTrip(trip, input, viewer);
  await repository.saveTrip(merged);
  return { ok: true as const, alreadyComplete: false as const };
}

/** 清空全部行程数据（D1 上为物理删除），并清空装备清单内存缓存。需通过受保护 API 调用。 */
export async function purgeAllTripsData() {
  const repository = getRepository();
  const { tripsRemoved } = await repository.deleteAllTrips();
  clearPackingListMemory();
  return { tripsRemoved, storage: repository.mode };
}

export async function getTripWithViewer(tripId: string) {
  const currentUser = await getSessionUser();
  const trip = await getRepository().getTrip(tripId);

  return {
    trip,
    currentUser,
  };
}

export async function createTrip(input: CreateTripInput) {
  const repository = getRepository();
  const currentUser =
    (await getSessionUser()) ?? getRepositoryFallbackUser();
  const trip = await generateTripDocument(input, currentUser);
  await repository.createTrip(trip);
  return trip;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const repository = getRepository();
  const trip = await repository.findTripByTaskId(taskId);

  if (!trip) {
    throw new Error("Task not found.");
  }

  const viewer = (await getSessionUser()) ?? getRepositoryFallbackUser();
  assertCanMutateTrip(trip, viewer, repository.mode === "demo");

  const nextTasks = trip.tasks.map((task) =>
    task.id === taskId ? { ...task, status } : task,
  );
  const eventTitle = status === "done" ? "任务已完成" : "任务被重新打开";

  const nextTrip: TripDocument = {
    ...trip,
    tasks: nextTasks,
    notifications: [
      {
        id: createId("notice"),
        tripId: trip.id,
        title: eventTitle,
        body: `${viewer.name} 更新了任务状态。`,
        createdAt: new Date().toISOString(),
      },
      ...trip.notifications,
    ],
    events: [
      makeEvent({
        type: "task_completed",
        actorName: viewer.name,
        title: eventTitle,
        body: `${viewer.name} 更新了「${trip.tasks.find((task) => task.id === taskId)?.title ?? "任务"}」的状态。`,
      }),
      ...trip.events,
    ],
    updatedAt: new Date().toISOString(),
  };

  await repository.saveTrip(nextTrip);
  return nextTrip;
}

export async function inviteMember(tripId: string, input: InviteMemberInput) {
  const repository = getRepository();
  const trip = await repository.getTrip(tripId);

  if (!trip) {
    throw new Error("Trip not found.");
  }

  const viewer = (await getSessionUser()) ?? getRepositoryFallbackUser();
  assertCanMutateTrip(trip, viewer, repository.mode === "demo");

  const email = input.email.toLowerCase();
  const existing = trip.members.find((member) => member.email === email);
  if (existing) {
    return trip;
  }

  const member: TripMember = {
    id: createId("member"),
    email,
    name: input.name?.trim() || email.split("@")[0] || "新旅伴",
    avatarText: createAvatarText(input.name?.trim() || email),
    role: "traveler",
    inviteStatus: "pending",
    invitedAt: new Date().toISOString(),
  };

  const nextTrip: TripDocument = {
    ...trip,
    members: [...trip.members, member],
    notifications: [
      {
        id: createId("notice"),
        tripId: trip.id,
        title: "已发出新的旅伴邀请",
        body: `${viewer.name} 邀请了 ${member.name}。`,
        createdAt: new Date().toISOString(),
      },
      ...trip.notifications,
    ],
    events: [
      makeEvent({
        type: "member_invited",
        actorName: viewer.name,
        title: "新增旅伴邀请",
        body: `${member.name} 已被邀请加入本次行程。`,
      }),
      ...trip.events,
    ],
    updatedAt: new Date().toISOString(),
  };

  await repository.saveTrip(nextTrip);
  await sendMail({
    to: email,
    subject: `邀请加入 ${trip.name}`,
    text: `${viewer.name} 邀请你加入 ${trip.name}。登录后即可查看和确认行程。`,
    html: `<p>${viewer.name} 邀请你加入 <strong>${trip.name}</strong>。</p><p>登录后即可查看和确认行程。</p>`,
  });

  return nextTrip;
}

export async function acceptInvitation(tripId: string, inviteId: string) {
  const repository = getRepository();
  const trip = await repository.getTrip(tripId);

  if (!trip) {
    throw new Error("Trip not found.");
  }

  const viewer = await getSessionUser();
  if (!viewer) {
    throw new Error("请先登录后接受邀请。");
  }

  const nextMembers = trip.members.map((member) =>
    member.id === inviteId && member.email.toLowerCase() === viewer.email.toLowerCase()
      ? {
          ...member,
          inviteStatus: "confirmed" as const,
          confirmedAt: new Date().toISOString(),
          name: viewer.name,
          avatarText: viewer.avatarText,
        }
      : member,
  );

  const nextTrip: TripDocument = {
    ...trip,
    members: nextMembers,
    events: [
      makeEvent({
        type: "member_confirmed",
        actorName: viewer.name,
        title: "旅伴已确认加入",
        body: `${viewer.name} 确认了本次同行邀请。`,
      }),
      ...trip.events,
    ],
    notifications: [
      {
        id: createId("notice"),
        tripId: trip.id,
        title: "新的旅伴已确认",
        body: `${viewer.name} 已确认加入 ${trip.name}。`,
        createdAt: new Date().toISOString(),
      },
      ...trip.notifications,
    ],
    updatedAt: new Date().toISOString(),
  };

  await repository.saveTrip(nextTrip);
  return nextTrip;
}

export async function triggerReplan(tripId: string) {
  const repository = getRepository();
  const trip = await repository.getTrip(tripId);
  if (!trip) {
    throw new Error("Trip not found.");
  }

  const viewer = (await getSessionUser()) ?? getRepositoryFallbackUser();
  assertCanMutateTrip(trip, viewer, repository.mode === "demo");

  const nextTrip = await replanTripDocument(trip);
  await repository.saveTrip(nextTrip);
  return nextTrip;
}

export async function runScheduledReplans() {
  const repository = getRepository();
  const trips = await repository.listTripsForCron();
  let updated = 0;

  for (const trip of trips) {
    if (trip.stage === "planning" || trip.stage === "ongoing") {
      const nextTrip = await replanTripDocument(trip);
      await repository.saveTrip(nextTrip);
      updated += 1;
    }
  }

  return updated;
}

export async function requestMagicLink({
  email,
  name,
  redirectTo,
}: {
  email: string;
  name?: string;
  redirectTo?: string;
}) {
  const token = crypto.randomUUID().replaceAll("-", "");
  const now = new Date();
  const repository = getRepository();

  await repository.upsertMagicLink({
    tokenHash: hashToken(token),
    email: email.toLowerCase(),
    name: name?.trim() || email.split("@")[0] || "旅伴",
    redirectTo: redirectTo?.startsWith("/") ? redirectTo : "/",
    expiresAt: addHours(now, 1).toISOString(),
    createdAt: now.toISOString(),
  });

  const verifyUrl = new URL("/auth/verify", appEnv.appUrl);
  verifyUrl.searchParams.set("token", token);
  verifyUrl.searchParams.set("redirect", redirectTo?.startsWith("/") ? redirectTo : "/");

  await sendMail({
    to: email,
    subject: "你的 Wander 登录链接",
    text: `点击此链接登录：${verifyUrl.toString()}`,
    html: `<p>点击下方链接登录 Wander：</p><p><a href="${verifyUrl.toString()}">${verifyUrl.toString()}</a></p>`,
  });

  return verifyUrl.toString();
}

const PACKING_CATEGORY_KEYS: PackingCategory[] = [
  "core",
  "documents",
  "clothing",
  "electronics",
  "toiletries",
  "weather",
  "gear",
];

export async function updateTripBasicInfo(
  tripId: string,
  patch: Partial<{
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    travelerCount: number;
    stage: TripStage;
    packingCategoryLabels: Partial<Record<PackingCategory, string | null>>;
  }>,
) {
  const repository = getRepository();
  const trip = await repository.getTrip(tripId);

  if (!trip) {
    throw new Error("行程不存在");
  }

  const viewer = (await getSessionUser()) ?? getRepositoryFallbackUser();
  assertCanMutateTrip(trip, viewer, repository.mode === "demo");

  const validStages: TripStage[] = ["draft", "planning", "ongoing", "completed"];
  if (patch.stage != null && !validStages.includes(patch.stage)) {
    throw new Error("无效的状态");
  }

  let nextBanner = trip.banner;
  if (patch.packingCategoryLabels != null) {
    const prev = trip.banner.packingCategoryLabels ?? {};
    const merged: Partial<Record<PackingCategory, string>> = { ...prev };
    for (const [rawKey, rawVal] of Object.entries(patch.packingCategoryLabels)) {
      if (!PACKING_CATEGORY_KEYS.includes(rawKey as PackingCategory)) continue;
      const key = rawKey as PackingCategory;
      if (rawVal == null || String(rawVal).trim() === "") {
        delete merged[key];
      } else {
        merged[key] = String(rawVal).trim();
      }
    }
    nextBanner = {
      ...trip.banner,
      packingCategoryLabels: Object.keys(merged).length > 0 ? merged : undefined,
    };
  }

  const nextTrip: TripDocument = {
    ...trip,
    name: typeof patch.name === "string" ? patch.name.trim() || trip.name : trip.name,
    destination:
      typeof patch.destination === "string"
        ? patch.destination.trim() || trip.destination
        : trip.destination,
    startDate: typeof patch.startDate === "string" ? patch.startDate : trip.startDate,
    endDate: typeof patch.endDate === "string" ? patch.endDate : trip.endDate,
    travelerCount:
      typeof patch.travelerCount === "number" && Number.isFinite(patch.travelerCount)
        ? Math.max(1, Math.floor(patch.travelerCount))
        : trip.travelerCount,
    stage: patch.stage ?? trip.stage,
    banner: nextBanner,
    updatedAt: new Date().toISOString(),
  };

  await repository.saveTrip(nextTrip);
  return nextTrip;
}

export async function updateTripStage(tripId: string, stage: TripStage) {
  const repository = getRepository();
  const trip = await repository.getTrip(tripId);

  if (!trip) {
    throw new Error("行程不存在");
  }

  const viewer = (await getSessionUser()) ?? getRepositoryFallbackUser();
  assertCanMutateTrip(trip, viewer, repository.mode === "demo");

  const nextTrip: TripDocument = {
    ...trip,
    stage,
    events: [
      makeEvent({
        type: "trip_created",
        actorName: viewer.name,
        title: "行程已结束",
        body: `${viewer.name} 将行程状态更新为已结束。`,
      }),
      ...trip.events,
    ],
    notifications: [
      {
        id: createId("notice"),
        tripId: trip.id,
        title: "行程状态已更新",
        body: `${viewer.name} 将行程标记为已结束。`,
        createdAt: new Date().toISOString(),
      },
      ...trip.notifications,
    ],
    updatedAt: new Date().toISOString(),
  };

  await repository.saveTrip(nextTrip);
  return nextTrip;
}

export async function consumeMagicLink(token: string) {
  const repository = getRepository();
  const record = await repository.consumeMagicLink(hashToken(token));

  if (!record) {
    throw new Error("登录链接无效或已使用。");
  }

  if (new Date(record.expiresAt) < new Date()) {
    throw new Error("登录链接已过期。");
  }

  return {
    user: {
      email: record.email,
      name: record.name,
      avatarText: createAvatarText(record.name),
    } satisfies SessionUser,
    redirectTo: record.redirectTo,
  };
}

function makeEvent({
  type,
  actorName,
  title,
  body,
}: {
  type: TripEvent["type"];
  actorName: string;
  title: string;
  body: string;
}) {
  return {
    id: createId("event"),
    type,
    actorName,
    title,
    body,
    createdAt: new Date().toISOString(),
  } satisfies TripEvent;
}

export function getRepositoryFallbackUser() {
  return {
    email: "aihe@example.com",
    name: "Aihe",
    avatarText: "你",
  } satisfies SessionUser;
}

function assertCanMutateTrip(
  trip: TripDocument,
  viewer: SessionUser,
  allowDemoFallback: boolean,
) {
  const isOwner = trip.ownerEmail.toLowerCase() === viewer.email.toLowerCase();

  if (!isOwner && !allowDemoFallback) {
    throw new Error("只有发起人可以修改行程。");
  }
}
