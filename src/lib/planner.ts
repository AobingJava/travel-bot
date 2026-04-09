import "server-only";

import { z } from "zod";

import { hasLlmConfig } from "@/lib/env";
import { requestCompletionText } from "@/lib/llm";
import type {
  CreateTripInput,
  GeneratedTripPlan,
  SessionUser,
  ThemeKey,
  TravelMode,
  TripBanner,
  TripDocument,
  TripEvent,
  TripStage,
  TripDailySuggestion,
  TripTask,
} from "@/lib/types";
import {
  createId,
  extractJsonObject,
  formatDateLabel,
  getThemeLabel,
  sortTasks,
} from "@/lib/utils";

const taskLabelSchema = z.enum([
  "suggestion",
  "backup",
  "food",
  "transport",
  "lodging",
  "summary",
]);

const travelModeSchema = z.enum(["walk", "subway", "train", "bus", "taxi"]);

const taskSchema = z.object({
  title: z.string().min(4),
  notes: z.string().optional(),
  phase: z.enum(["pre", "during", "post"]),
  label: taskLabelSchema.optional(),
  status: z.enum(["open", "done"]).default("open"),
  dayIndex: z.number().int().optional(),
  dayLabel: z.string().optional(),
  dueDate: z.string().optional(),
  sortOrder: z.number().int(),
  assigneeEmail: z.string().optional(),
  assigneeName: z.string().optional(),
  source: z.enum(["ai", "manual", "replan"]).default("ai"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  locationName: z.string().optional(),
  scheduledTime: z.string().optional(),
  durationMinutes: z.number().int().optional(),
  travelMinutes: z.number().int().optional(),
  travelMode: travelModeSchema.optional(),
  routeHint: z.string().optional(),
});

const dailySuggestionSchema = z.object({
  dayIndex: z.number().int(),
  label: z.string(),
  title: z.string(),
  summary: z.string(),
});

const bannerSchema = z.object({
  title: z.string(),
  body: z.string(),
  tone: z.enum(["neutral", "weather", "timing"]),
  updatedAt: z.string().optional(),
});

const planSchema = z.object({
  name: z.string().min(4),
  stage: z.enum(["draft", "planning", "ongoing", "completed"]),
  tasks: z.array(taskSchema),
  dailySuggestions: z.array(dailySuggestionSchema),
  banner: bannerSchema,
  packingList: z.union([
    z.array(z.string()),
    z.array(z.object({
      id: z.string(),
      name: z.string(),
      category: z.enum(["core", "clothing", "electronics", "toiletries", "documents", "weather"]),
      checked: z.boolean().optional(),
      weatherDependent: z.boolean().optional(),
    })),
  ]).optional(),
});

const replanSchema = z.object({
  banner: bannerSchema,
  eventTitle: z.string(),
  eventBody: z.string(),
  taskUpdates: z.array(
    z.object({
      referenceId: z.string(),
      title: z.string().min(4).optional(),
      notes: z.string().optional(),
      label: taskLabelSchema.optional(),
      sortOrder: z.number().int(),
      dayIndex: z.number().int().optional(),
      dayLabel: z.string().optional(),
      dueDate: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      locationName: z.string().optional(),
      scheduledTime: z.string().optional(),
      durationMinutes: z.number().int().optional(),
      travelMinutes: z.number().int().optional(),
      travelMode: travelModeSchema.optional(),
      routeHint: z.string().optional(),
    }),
  ),
});

export type PlanningStep =
  | "analyzing"
  | "weather"
  | "attractions"
  | "tasks"
  | "route"
  | "packing"
  | "finalizing";

export async function generateTripDocument(
  input: CreateTripInput,
  owner: SessionUser,
  onProgress?: (step: PlanningStep, message: string) => void | Promise<void>,
): Promise<TripDocument> {
  const llmEnabled = hasLlmConfig();

  onProgress?.("analyzing", "正在分析目的地特色与旅行主题...");

  const generated = llmEnabled
    ? await generateWithModel(input).catch((error) => {
        console.error("generateWithModel failed", error);
        onProgress?.("tasks", "LLM 生成失败，使用备用方案...");
        return null;
      })
    : null;

  onProgress?.("tasks", "正在生成行前准备清单...");
  const plan = normalizeGeneratedPlan(input, generated ?? fallbackPlan(input));

  onProgress?.("packing", "正在整理装备清单...");
  const now = new Date().toISOString();
  const tripId = createId("trip");

  onProgress?.("finalizing", "正在完成最终规划...");

  return {
    id: tripId,
    slug: slugify(`${input.destination}-${tripId.slice(-6)}`),
    name: input.name || plan.name,
    destination: input.destination,
    startDate: input.startDate,
    endDate: input.endDate,
    travelerCount: input.travelerCount ?? 1,
    themes: input.themes,
    customTags: input.customTags,
    packingList: plan.packingList,
    ownerEmail: owner.email,
    ownerName: owner.name,
    stage: plan.stage,
    tasks: sortTasks(
      plan.tasks.map((task) => ({
        ...task,
        id: task.id || createId("task"),
      })),
    ),
    members: [
      {
        id: createId("member"),
        email: owner.email,
        name: owner.name,
        avatarText: owner.avatarText,
        role: "owner",
        inviteStatus: "confirmed",
        invitedAt: now,
        confirmedAt: now,
      },
    ],
    dailySuggestions: plan.dailySuggestions.map((suggestion) => ({
      ...suggestion,
      id: suggestion.id || createId("day"),
    })),
    banner: {
      ...plan.banner,
      updatedAt: now,
    },
    events: [
      createEvent({
        type: "trip_created",
        actorName: owner.name,
        title: "AI 已生成首版旅行计划",
        body: `围绕 ${input.destination} 生成了行前、旅途、旅后三阶段 TODO。`,
      }),
    ],
    notifications: [
      {
        id: createId("notice"),
        tripId,
        title: "旅行计划已生成",
        body: `已为 ${input.destination} 生成首版 TODO 与每日建议。`,
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export async function replanTripDocument(trip: TripDocument) {
  const replanned = hasLlmConfig()
    ? await replanWithModel(trip).catch((error) => {
        console.error("replanWithModel failed", error);
        return null;
      })
    : null;
  if (replanned) {
    return replanned;
  }

  const now = new Date().toISOString();
  const updatedTasks = [...trip.tasks];
  const target = updatedTasks.find(
    (task) => task.phase === "during" && task.status === "open",
  );

  if (target) {
    target.sortOrder = 1;
    target.label = target.label ?? "suggestion";
    target.notes = `${target.notes ?? ""} 已根据天气与拥挤度重新排到优先级更高的位置。`.trim();
  }

  const backupTask = updatedTasks.find(
    (task) => task.phase === "during" && task.label === "backup",
  );

  if (!backupTask) {
    updatedTasks.push({
      id: createId("task"),
      title: "新增室内备选：车站附近博物馆或咖啡馆",
      notes: "天气波动时可无缝切换，不影响整体节奏。",
      phase: "during",
      label: "backup",
      status: "open",
      dayIndex: 1,
      dayLabel: "明日",
      dueDate: trip.startDate,
      sortOrder: 2,
      source: "replan",
    });
  }

  const banner: TripBanner = {
    title: "AI 已重新梳理明日优先级",
    body: "结合最新天气和临近出发状态，已把户外任务提前，并补充了不受天气影响的备选项。",
    tone: "weather",
    updatedAt: now,
  };

  const event = createEvent({
    type: "trip_replanned",
    actorName: "Wander AI",
    title: "行程顺序已更新",
    body: "基于最新天气与时间窗口，AI 已调整旅途中任务顺序。",
  });

  return {
    ...trip,
    tasks: sortTasks(normalizeRouteTasks(updatedTasks, trip.destination)),
    banner,
    notifications: [
      {
        id: createId("notice"),
        tripId: trip.id,
        title: "AI 已更新行程",
        body: banner.body,
        createdAt: now,
      },
      ...trip.notifications,
    ],
    events: [event, ...trip.events],
    updatedAt: now,
  };
}

function createEvent({
  type,
  actorName,
  title,
  body,
}: {
  type: TripEvent["type"];
  actorName: string;
  title: string;
  body: string;
}): TripEvent {
  return {
    id: createId("event"),
    type,
    actorName,
    title,
    body,
    createdAt: new Date().toISOString(),
  };
}

async function generateWithModel(input: CreateTripInput): Promise<GeneratedTripPlan> {
  const themeList = input.themes.map((theme) => getThemeLabel(theme)).join("、");

  const raw = await requestCompletionText({
    messages: [
      {
        role: "system",
        content:
          "你是一个专业的中文旅行规划助手。请只输出合法 JSON，不要任何解释或额外文字。返回完整的旅行计划，包含：\n\n1. **行程名称**：结合目的地和主题特色，8-20 字\n2. **3 阶段任务**（8-12 个）：\n   - 行前准备（pre 阶段 3-4 个）：证件办理、机票酒店、物品准备、预约预订等\n   - 旅途打卡（during 阶段 3-4 个）：景点游览、美食体验、购物娱乐，必须包含具体景点名称、locationName、scheduledTime(HH:mm)、durationMinutes、travelMode、travelMinutes、routeHint，以及 lat/lng 坐标（十进制度数）\n   - 旅后总结（post 阶段 1-2 个）：照片整理、预算复盘等\n3. **每日建议**：每天的行程概要\n4. **顶部 banner**：行程亮点提示\n5. **装备清单**：按 6 类组织（core/clothing/electronics/toiletries/documents/weather），每类 2-4 个物品，共 12-18 个。天气相关物品设置 weatherDependent:true\n\n任务必须具体可执行，包含真实景点名称和合理的时间安排。",
      },
      {
        role: "user",
        content: `请为这次旅行生成完整计划：\n- 目的地：${input.destination}\n- 日期：${input.startDate} 到 ${input.endDate}\n- 人数：${input.travelerCount ?? 1}人\n- 主题：${themeList}\n\n要求：\n1. 旅途中任务必须包含具体景点名称和坐标，例如"富士山五合目"、"清水寺"等真实景点\n2. 行前准备任务要详细：证件/签证、机票酒店、交通卡、网络、保险、预约景点等\n3. 根据目的地天气和季节生成装备清单，雨季加雨具，海边加防晒，城市加购物袋\n4. 所有任务时间安排合理，符合真实旅行逻辑`,
      },
    ],
    temperature: 0.7,
    thinkingEnabled: false,
  });

  return parsePlanCompletion(raw, input);
}

async function replanWithModel(trip: TripDocument): Promise<TripDocument> {
  const now = new Date().toISOString();
  const duringTasks = sortTasks(trip.tasks).filter((task) => task.phase === "during");

  if (!duringTasks.length) {
    throw new Error("Trip does not contain during tasks.");
  }

  const raw = await requestCompletionText({
    messages: [
      {
        role: "system",
        content:
          "你是一个中文旅行调度助手。只输出合法 JSON，不要附加解释。你会收到当前旅途中任务列表，请只重排和微调这些旅途中任务，不要改动行前和旅后任务。每个 taskUpdates 项都必须保留 referenceId，并尽量补齐 scheduledTime、locationName、durationMinutes、travelMode、travelMinutes、routeHint、lat、lng。重排结果要像一条真实可执行的时间路线。",
      },
      {
        role: "user",
        content: `请重排行程：目的地 ${trip.destination}，日期 ${trip.startDate} 到 ${trip.endDate}。当前旅途中任务如下：${JSON.stringify(
          duringTasks.map((task) => ({
            referenceId: task.id,
            title: task.title,
            notes: task.notes,
            label: task.label,
            dayIndex: task.dayIndex,
            dayLabel: task.dayLabel,
            dueDate: task.dueDate,
            sortOrder: task.sortOrder,
            lat: task.lat,
            lng: task.lng,
            locationName: task.locationName,
            scheduledTime: task.scheduledTime,
            durationMinutes: task.durationMinutes,
            travelMinutes: task.travelMinutes,
            travelMode: task.travelMode,
            routeHint: task.routeHint,
          })),
        )}`,
      },
    ],
  });
  const result = parseReplanCompletion(raw, trip, duringTasks);

  const updateMap = new Map(
    result.taskUpdates.map((task) => [task.referenceId, task] as const),
  );

  const nextTasks = trip.tasks.map((task) => {
    if (task.phase !== "during") {
      return task;
    }

    const update = updateMap.get(task.id);
    if (!update) {
      return task;
    }

    return {
      ...task,
      title: update.title ?? task.title,
      notes: update.notes ?? task.notes,
      label: update.label ?? task.label,
      sortOrder: update.sortOrder,
      dayIndex: update.dayIndex ?? task.dayIndex,
      dayLabel: update.dayLabel ?? task.dayLabel,
      dueDate: update.dueDate ?? task.dueDate,
      lat: update.lat ?? task.lat,
      lng: update.lng ?? task.lng,
      locationName: update.locationName ?? task.locationName,
      scheduledTime: update.scheduledTime ?? task.scheduledTime,
      durationMinutes: update.durationMinutes ?? task.durationMinutes,
      travelMinutes: update.travelMinutes ?? task.travelMinutes,
      travelMode: update.travelMode ?? task.travelMode,
      routeHint: update.routeHint ?? task.routeHint,
      source: "replan" as const,
    };
  });

  const banner = {
    ...result.banner,
    updatedAt: now,
  };
  const event = createEvent({
    type: "trip_replanned",
    actorName: "Wander AI",
    title: result.eventTitle,
    body: result.eventBody,
  });

  return {
    ...trip,
    tasks: sortTasks(normalizeRouteTasks(nextTasks, trip.destination)),
    banner,
    notifications: [
      {
        id: createId("notice"),
        tripId: trip.id,
        title: "AI 已更新行程",
        body: banner.body,
        createdAt: now,
      },
      ...trip.notifications,
    ],
    events: [event, ...trip.events],
    updatedAt: now,
  };
}

function parsePlanCompletion(
  raw: string,
  input: CreateTripInput,
): GeneratedTripPlan {
  const payload = parseModelPayload(raw);
  const strict = planSchema.safeParse(payload);

  if (strict.success) {
    return finalizeGeneratedPlan(strict.data);
  }

  const loose = parseLoosePlanPayload(payload, input);
  if (loose) {
    return loose;
  }
  throw new Error("Model plan response did not match supported structures.");
}

function parseReplanCompletion(
  raw: string,
  trip: TripDocument,
  duringTasks: TripTask[],
): z.infer<typeof replanSchema> {
  const payload = parseModelPayload(raw);
  const strict = replanSchema.safeParse(payload);

  if (strict.success) {
    return strict.data;
  }

  const phases = getLoosePhaseLists(payload);
  const sourceTodos: unknown[] = phases.during.length ? phases.during : duringTasks;
  const taskUpdates = sourceTodos
    .slice(0, duringTasks.length)
    .map((todo: unknown, index: number) => {
      const reference = duringTasks[index];
      if (!reference) {
        return null;
      }

      return {
        referenceId: reference.id,
        title: readString(todo, ["title", "task"]) ?? reference.title,
        notes: readString(todo, ["content", "description", "notes"]) ?? reference.notes,
        label: readTaskLabel(todo, "during") ?? reference.label,
        sortOrder: index + 1,
        dayIndex: readNumber(todo, ["dayIndex"]) ?? reference.dayIndex,
        dayLabel: readString(todo, ["dayLabel"]) ?? reference.dayLabel,
        dueDate: readString(todo, ["dueDate"]) ?? reference.dueDate,
        lat: readNumber(todo, ["lat"]) ?? reference.lat,
        lng: readNumber(todo, ["lng"]) ?? reference.lng,
        locationName:
          readString(todo, ["locationName", "location"]) ?? reference.locationName,
        scheduledTime: readString(todo, ["scheduledTime"]) ?? reference.scheduledTime,
        durationMinutes:
          readNumber(todo, ["durationMinutes"]) ?? reference.durationMinutes,
        travelMinutes:
          readNumber(todo, ["travelMinutes"]) ?? reference.travelMinutes,
        travelMode:
          readTravelMode(todo, ["travelMode"]) ?? reference.travelMode,
        routeHint: readString(todo, ["routeHint"]) ?? reference.routeHint,
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));

  if (!taskUpdates.length) {
    throw new Error("Model replan response did not include usable task updates.");
  }

  const banner = buildLooseBanner(payload, trip.destination, {
    title: "AI 已重新梳理路线建议",
    body: "已结合新的时间顺序重新安排旅途中任务。",
  });

  return {
    banner,
    eventTitle: readString(payload, ["eventTitle"]) ?? "行程顺序已更新",
    eventBody:
      readString(payload, ["eventBody"]) ?? `${banner.title}，${banner.body}`,
    taskUpdates,
  };
}

function finalizeGeneratedPlan(
  plan: z.infer<typeof planSchema>,
): GeneratedTripPlan {
  return {
    ...plan,
    name: plan.name,
    stage: plan.stage,
    tasks: plan.tasks.map((task) => ({
      ...task,
      id: createId("task"),
      source: task.source ?? "ai",
      travelMode: task.travelMode,
    })),
    dailySuggestions: plan.dailySuggestions.map((suggestion) => ({
      ...suggestion,
      id: createId("day"),
    })),
    banner: {
      ...plan.banner,
      updatedAt: plan.banner.updatedAt ?? new Date().toISOString(),
    },
    packingList: plan.packingList,
  };
}

function parseLoosePlanPayload(
  payload: unknown,
  input: CreateTripInput,
): GeneratedTripPlan | null {
  const phases = getLoosePhaseLists(payload);
  if (!phases.before.length && !phases.during.length && !phases.after.length) {
    return null;
  }

  const dates = enumerateDates(input.startDate, input.endDate);
  const duringTasks = phases.during.map((todo: unknown, index: number) =>
    buildLooseTask(todo, "during", index, dates),
  );

  const tasks: TripTask[] = [
    ...phases.before.map((todo: unknown, index: number) =>
      buildLooseTask(todo, "before", index, dates),
    ),
    ...duringTasks,
    ...phases.after.map((todo: unknown, index: number) =>
      buildLooseTask(todo, "after", index, dates),
    ),
  ];

  const dailySuggestions = buildLooseDailySuggestions(payload, input, duringTasks);
  const banner = buildLooseBanner(payload, input.destination, {
    title: `${input.destination} ${dates.length} 日游`,
    body: `已围绕 ${input.destination} 生成行前、旅途、旅后三阶段任务。`,
  });

  return {
    name: banner.title || `${input.destination} ${dates.length} 日游`,
    stage: pickStage(input.startDate, input.endDate),
    tasks,
    dailySuggestions,
    banner,
  };
}

function parseModelPayload(raw: string) {
  return JSON.parse(extractJsonObject(raw)) as unknown;
}

function getLoosePhaseLists(payload: unknown) {
  const empty = {
    before: [] as unknown[],
    during: [] as unknown[],
    after: [] as unknown[],
  };

  if (!payload || typeof payload !== "object") {
    return empty;
  }

  const source = payload as Record<string, unknown>;
  const phases = source.phases;

  if (Array.isArray(phases)) {
    return phases.reduce((bucket, item) => {
      if (!item || typeof item !== "object") {
        return bucket;
      }

      const phaseName = normalizeLoosePhase(
        readString(item, ["phase", "key", "name"]),
      );
      const todos = readArray(item, ["todos", "tasks", "items"]);

      if (phaseName) {
        bucket[phaseName] = todos;
      }

      return bucket;
    }, empty);
  }

  if (phases && typeof phases === "object") {
    return {
      before: readArray(phases, ["before", "pre"]),
      during: readArray(phases, ["during"]),
      after: readArray(phases, ["after", "post"]),
    };
  }

  const todos = readArray(source, ["todos", "tasks"]);
  if (todos.length) {
    return todos.reduce((bucket, item) => {
      const phaseName = normalizeLoosePhase(readString(item, ["phase"]));
      if (phaseName) {
        bucket[phaseName].push(item);
      }
      return bucket;
    }, empty);
  }

  return empty;
}

function buildLooseTask(
  source: unknown,
  phaseName: "before" | "during" | "after",
  index: number,
  dates: string[],
): TripTask {
  const phase = mapLoosePhaseName(phaseName);
  const dayIndex = phase === "during" ? readNumber(source, ["dayIndex"]) ?? index : undefined;
  const dueDate =
    phase === "during" ? dates[Math.min(dayIndex ?? 0, dates.length - 1)] : undefined;

  return {
    id: createId("task"),
    title:
      readString(source, ["title", "task", "name"]) ??
      `${phase === "pre" ? "行前任务" : phase === "during" ? "旅途任务" : "旅后任务"} ${index + 1}`,
    notes: readString(source, ["content", "description", "notes"]),
    phase,
    label: readTaskLabel(source, phaseName),
    status: "open",
    dayIndex,
    dayLabel:
      phase === "during"
        ? readString(source, ["dayLabel"]) ?? getDefaultDayLabel(dayIndex ?? index)
        : undefined,
    dueDate,
    sortOrder: index + 1,
    source: "ai",
    lat: readNumber(source, ["lat"]),
    lng: readNumber(source, ["lng"]),
    locationName: readString(source, ["locationName", "location"]),
    scheduledTime: readString(source, ["scheduledTime"]),
    durationMinutes: readNumber(source, ["durationMinutes"]),
    travelMinutes: readNumber(source, ["travelMinutes"]),
    travelMode: readTravelMode(source, ["travelMode"]),
    routeHint: readString(source, ["routeHint"]),
  };
}

function buildLooseDailySuggestions(
  payload: unknown,
  input: CreateTripInput,
  duringTasks: TripTask[],
): TripDailySuggestion[] {
  const dates = enumerateDates(input.startDate, input.endDate);
  const source = readArray(payload, ["dailySuggestions", "dailyPlans"]);

  if (source.length) {
    return source.slice(0, 5).map((item, index) => {
      const rawSummary =
        (typeof item === "string" ? item : null) ??
        readString(item, ["summary", "content", "description"]) ??
        duringTasks[index]?.routeHint ??
        duringTasks[index]?.notes ??
        "按当前路线推进即可。";
      const summary = rawSummary
        .replace(/^Day\s*\d+\s*\(([\d./-]+)\)\s*[:：]\s*/i, "")
        .trim();
      const dayMatch = rawSummary.match(/\(([\d./-]+)\)/);

      return {
        id: createId("day"),
        dayIndex: index,
        label: dayMatch?.[1] ?? readString(item, ["label", "date"]) ?? formatDateLabel(dates[Math.min(index, dates.length - 1)]),
        title:
          readString(item, ["title"]) ??
          summary.split(/[，。]/)[0]?.slice(0, 24) ??
          `第 ${index + 1} 天`,
        summary,
      };
    });
  }

  return duringTasks.slice(0, 3).map((task, index) => ({
    id: createId("day"),
    dayIndex: index,
    label: formatDateLabel(dates[Math.min(index, dates.length - 1)]),
    title: task.title,
    summary: task.routeHint ?? task.notes ?? "按当前路线推进即可。",
  }));
}

function buildLooseBanner(
  payload: unknown,
  destination: string,
  fallback: { title: string; body: string },
): TripBanner {
  const title =
    readString(payload, ["banner.title", "title"]) ??
    fallback.title;
  const bodyParts = [
    readString(payload, ["banner.body"]),
    readString(payload, ["banner.subtitle"]),
    readString(payload, ["banner.dateRange"]),
    readString(payload, ["banner.destination"]),
    readString(payload, ["banner.dates"]),
  ].filter(Boolean);

  const toneValue = readString(payload, ["banner.tone"]);

  return {
    title,
    body: bodyParts.join(" · ") || fallback.body,
    tone:
      toneValue === "weather" || toneValue === "timing" ? toneValue : "neutral",
    updatedAt: new Date().toISOString(),
  };
}

function mapLoosePhaseName(phaseName: "before" | "during" | "after") {
  switch (phaseName) {
    case "before":
      return "pre" as const;
    case "after":
      return "post" as const;
    default:
      return "during" as const;
  }
}

function normalizeLoosePhase(value?: string) {
  switch ((value ?? "").toLowerCase()) {
    case "before":
    case "pre":
      return "before" as const;
    case "after":
    case "post":
      return "after" as const;
    case "during":
      return "during" as const;
    default:
      return null;
  }
}

function readTaskLabel(
  source: unknown,
  phaseName: "before" | "during" | "after",
): TripTask["label"] {
  const explicit = readString(source, ["label", "tag"]);
  if (explicit) {
    const normalized = explicit.toLowerCase();
    if (
      normalized === "suggestion" ||
      normalized === "backup" ||
      normalized === "food" ||
      normalized === "transport" ||
      normalized === "lodging" ||
      normalized === "summary"
    ) {
      return normalized;
    }
  }

  const text = [
    readString(source, ["title", "task"]),
    readString(source, ["content", "description", "notes"]),
  ]
    .filter(Boolean)
    .join(" ");

  if (phaseName === "after") {
    return "summary";
  }
  if (/酒店|住宿|入住/.test(text)) {
    return "lodging";
  }
  if (/机票|交通|suica|pasmo|jr|地铁|机场|车票/i.test(text)) {
    return "transport";
  }
  if (/寿司|海鲜|美食|拉面|小吃|甜品|居酒屋|咖啡|餐/.test(text)) {
    return "food";
  }

  return "suggestion";
}

function readTravelMode(
  source: unknown,
  paths: string[],
): TripTask["travelMode"] {
  const value = readString(source, paths)?.toLowerCase();
  if (!value) {
    return undefined;
  }
  if (value.includes("walk") || value.includes("步行")) {
    return "walk" as const;
  }
  if (value.includes("subway") || value.includes("metro") || value.includes("地铁")) {
    return "subway" as const;
  }
  if (value.includes("train") || value.includes("jr") || value.includes("电车")) {
    return "train" as const;
  }
  if (value.includes("bus") || value.includes("公交")) {
    return "bus" as const;
  }
  if (value.includes("taxi") || value.includes("打车")) {
    return "taxi" as const;
  }

  return undefined;
}

function readString(source: unknown, paths: string[]) {
  const value = readValue(source, paths);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(source: unknown, paths: string[]) {
  const value = readValue(source, paths);
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readArray(source: unknown, paths: string[]) {
  const value = readValue(source, paths);
  return Array.isArray(value) ? value : [];
}

function readValue(source: unknown, paths: string[]) {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  const record = source as Record<string, unknown>;

  for (const path of paths) {
    const value = path
      .split(".")
      .reduce<unknown>((current, key) => {
        if (!current || typeof current !== "object") {
          return undefined;
        }
        return (current as Record<string, unknown>)[key];
      }, record);

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function normalizeGeneratedPlan(
  input: CreateTripInput,
  plan: GeneratedTripPlan,
): GeneratedTripPlan {
  const fallback = fallbackPlan(input);

  return {
    ...plan,
    name: plan.name || fallback.name,
    stage: plan.stage || fallback.stage,
    tasks: normalizeRouteTasks(plan.tasks.length ? plan.tasks : fallback.tasks, input.destination),
    dailySuggestions: plan.dailySuggestions.length
      ? plan.dailySuggestions
      : fallback.dailySuggestions,
    banner: plan.banner.title ? plan.banner : fallback.banner,
    packingList: plan.packingList && plan.packingList.length > 0 ? plan.packingList : fallback.packingList,
  };
}

function normalizeRouteTasks(tasks: TripTask[], destination: string) {
  const fallbackPins = getFallbackMapPins(destination);
  const fallbackTimes = ["09:00", "11:30", "14:30", "18:20"];
  const fallbackDurations = [120, 90, 110, 135];
  const fallbackTravelModes: TravelMode[] = ["walk", "train", "subway", "walk"];
  const fallbackTravelMinutes = [12, 24, 18, 10];

  let routeIndex = 0;

  return tasks.map((task) => {
    if (task.phase !== "during") {
      return {
        ...task,
        source: task.source ?? "ai",
      };
    }

    const pin = fallbackPins[routeIndex] ?? fallbackPins[fallbackPins.length - 1];
    const nextTask: TripTask = {
      ...task,
      source: task.source ?? "ai",
      sortOrder: task.sortOrder || routeIndex + 1,
      lat: task.lat ?? pin?.lat,
      lng: task.lng ?? pin?.lng,
      locationName: task.locationName ?? pin?.name,
      scheduledTime:
        task.scheduledTime ??
        fallbackTimes[Math.min(routeIndex, fallbackTimes.length - 1)],
      durationMinutes:
        task.durationMinutes ??
        fallbackDurations[Math.min(routeIndex, fallbackDurations.length - 1)],
      travelMode:
        task.travelMode ??
        fallbackTravelModes[Math.min(routeIndex, fallbackTravelModes.length - 1)],
      travelMinutes:
        task.travelMinutes ??
        fallbackTravelMinutes[Math.min(routeIndex, fallbackTravelMinutes.length - 1)],
      routeHint: task.routeHint ?? getDefaultRouteHint(routeIndex),
      dayLabel: task.dayLabel ?? getDefaultDayLabel(task.dayIndex ?? routeIndex),
    };

    routeIndex += 1;
    return nextTask;
  });
}

function getDefaultDayLabel(dayIndex: number) {
  switch (dayIndex) {
    case 0:
      return "第一天";
    case 1:
      return "第二天";
    case 2:
      return "第三天";
    default:
      return `第 ${dayIndex + 1} 天`;
  }
}

function getDefaultRouteHint(routeIndex: number) {
  switch (routeIndex) {
    case 0:
      return "先从交通最顺的区域开始，减少落地或换区的切换成本。";
    case 1:
      return "把第二站安排在同一片区或同一条线附近，避免反复折返。";
    case 2:
      return "把傍晚后的体验留给夜景或餐饮更强的地带，节奏会更自然。";
    default:
      return "按当前顺序推进即可，优先保证路线上连续。";
  }
}

function fallbackPlan(input: CreateTripInput): GeneratedTripPlan {
  const dates = enumerateDates(input.startDate, input.endDate);
  const dayTargets = dates.slice(0, Math.min(dates.length, 3));
  const baseName = `${input.destination} ${dates.length} 日游`;
  const fallbackPins = getFallbackMapPins(input.destination);
  const fallbackTimes = ["09:00", "13:30", "18:00"];
  const fallbackDurations = [150, 120, 135];
  const fallbackTravelModes: TravelMode[] = ["train", "walk", "subway"];
  const fallbackTravelMinutes = [28, 16, 24];

  const tasks: TripTask[] = [
    {
      id: createId("task"),
      title: "核对证件、签证与支付方式",
      notes: "提前确认护照、电子票据和境外支付方式是否齐全。",
      phase: "pre",
      label: "transport",
      status: "open",
      sortOrder: 1,
      source: "ai",
    },
    {
      id: createId("task"),
      title: "锁定第一晚交通与入住",
      notes: "把机场到酒店的路线和入住时间写进行程卡片。",
      phase: "pre",
      label: "lodging",
      status: "open",
      sortOrder: 2,
      source: "ai",
    },
    {
      id: createId("task"),
      title: "购买旅行保险与准备常用药品",
      notes: "确保保险覆盖行程期间，准备感冒药、肠胃药等常用药品。",
      phase: "pre",
      label: "suggestion",
      status: "open",
      sortOrder: 3,
      source: "ai",
    },
    {
      id: createId("task"),
      title: "预约热门景点门票",
      notes: `优先围绕 ${getThemeLabel(input.themes[0] as ThemeKey)} 主题安排最难抢的资源，提前在官网或旅游平台预约。`,
      phase: "pre",
      label: "suggestion",
      status: "open",
      sortOrder: 4,
      source: "ai",
    },
    ...dayTargets.map((date, index) => {
      const label = index === 1 ? "backup" : "suggestion";
      const pin = fallbackPins[index] || fallbackPins[0];

      return {
        id: createId("task"),
        title:
          index === 0
            ? `游览${pin?.name || "市中心地标"}，适应当地节奏`
            : index === 1
              ? `${pin?.name || "历史文化街区"}深度体验`
              : `${pin?.name || "当地特色市场"}周边自由活动`,
        notes:
          index === 0
            ? "第一天先适应节奏，从地标景点开始，避免把高强度任务塞满。"
            : index === 1
              ? "如果午后天气转差，优先切室内备选。"
              : "行程后段更适合留白，给临场调整空间。",
        phase: "during",
        label,
        status: "open",
        dayIndex: index,
        dayLabel: index === 0 ? "第一天" : index === 1 ? "第二天" : "第三天",
        dueDate: date,
        sortOrder: index + 1,
        source: "ai",
        lat: pin?.lat,
        lng: pin?.lng,
        locationName: pin?.name,
        scheduledTime: fallbackTimes[index],
        durationMinutes: fallbackDurations[index],
        travelMode: fallbackTravelModes[index],
        travelMinutes: fallbackTravelMinutes[index],
        routeHint:
          index === 0
            ? "第一站放在交通最顺的区域，降低落地日切换成本。"
            : index === 1
              ? "把午后弹性留给备选路线，天气变化时更容易切换。"
              : "把夜间节奏放在后半段，给购物和用餐留更自然的窗口。",
      } satisfies TripTask;
    }),
    {
      id: createId("task"),
      title: "旅后照片与预算复盘",
      notes: "回程后及时整理照片、预算和踩坑总结。",
      phase: "post",
      label: "summary",
      status: "open",
      sortOrder: 1,
      source: "ai",
    },
    {
      id: createId("task"),
      title: "请 AI 生成旅后总结",
      notes: "把高光时刻、遗憾点和下次建议收进总结卡片。",
      phase: "post",
      label: "summary",
      status: "open",
      sortOrder: 2,
      source: "ai",
    },
  ];

  return {
    name: baseName,
    stage: pickStage(input.startDate, input.endDate),
    tasks,
    dailySuggestions: dayTargets.map((date, index) => ({
      id: createId("day"),
      dayIndex: index,
      label: formatDateLabel(date),
      title:
        index === 0
          ? "落地后先稳住节奏"
          : index === 1
            ? "把必去内容安排到天气窗口"
            : "后段放松，给临场发现留空间",
      summary:
        index === 0
          ? "先处理交通、入住和附近轻量活动，让团队快速进入状态。"
          : index === 1
            ? "如果天气波动，优先切换到室内备选，不要让整天失速。"
            : "最后几天减少硬性目标，把时间留给临场想去的地方。",
    })),
    banner: {
      title: "AI 已生成首版 TODO 看板",
      body: "行前准备、旅途打卡和旅后总结已拆成可执行任务，后续可继续基于天气动态重排。",
      tone: "neutral",
      updatedAt: new Date().toISOString(),
    },
    packingList: generateFallbackPackingList(input),
  };
}

import { generatePackingList } from "@/lib/packing-list";

function generateFallbackPackingList(input: CreateTripInput): { id: string; name: string; category: "core" | "clothing" | "electronics" | "toiletries" | "documents" | "weather"; checked?: boolean; weatherDependent?: boolean }[] {
  const days = Math.max(1, Math.ceil((new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / (1000 * 60 * 60 * 24)));

  // 使用新的装备清单生成逻辑
  const packingList = generatePackingList({
    themes: input.themes,
    tripDays: days,
    customTags: input.customTags,
  });

  return packingList.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    checked: false,
    weatherDependent: item.weatherDependent,
  }));
}

function enumerateDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function getFallbackMapPins(destination: string): Array<{ lat: number; lng: number; name: string }> {
  const destinationLower = destination.toLowerCase();

  // 日本目的地
  if (destinationLower.includes("日本") || destinationLower.includes("东京")) {
    return [
      { lat: 35.6895, lng: 139.6917, name: "浅草寺" },
      { lat: 35.6762, lng: 139.6503, name: "涩谷 SKY" },
      { lat: 35.6586, lng: 139.7454, name: "筑地市场" },
    ];
  }

  if (destinationLower.includes("大阪")) {
    return [
      { lat: 34.6941, lng: 135.5017, name: "大阪城公园" },
      { lat: 34.6687, lng: 135.5023, name: "道顿堀" },
      { lat: 34.6555, lng: 135.4324, name: "大阪海游馆" },
    ];
  }

  if (destination.includes("京都")) {
    return [
      { lat: 34.9949, lng: 135.7851, name: "伏见稻荷大社" },
      { lat: 35.017, lng: 135.6713, name: "岚山竹林" },
      { lat: 35.0394, lng: 135.7292, name: "金阁寺" },
    ];
  }

  // 韩国目的地
  if (destination.includes("韩国") || destination.includes("首尔")) {
    return [
      { lat: 37.5755, lng: 126.9770, name: "景福宫" },
      { lat: 37.5564, lng: 126.9822, name: "明洞" },
      { lat: 37.5219, lng: 127.0411, name: "COEX 星空图书馆" },
    ];
  }

  // 泰国目的地
  if (destination.includes("泰国") || destination.includes("曼谷")) {
    return [
      { lat: 13.7507, lng: 100.4939, name: "大皇宫" },
      { lat: 13.7245, lng: 100.5373, name: " ICONSIAM 购物中心" },
      { lat: 13.7372, lng: 100.5223, name: "卧佛寺" },
    ];
  }

  if (destination.includes("普吉岛")) {
    return [
      { lat: 7.8804, lng: 98.3923, name: "芭东海滩" },
      { lat: 7.8238, lng: 98.3343, name: "查龙寺" },
      { lat: 7.9517, lng: 98.3381, name: "普吉镇" },
    ];
  }

  // 巴厘岛
  if (destination.includes("巴厘岛")) {
    return [
      { lat: -8.5069, lng: 115.2625, name: "海神庙" },
      { lat: -8.3439, lng: 115.2371, name: "乌布皇宫" },
      { lat: -8.8290, lng: 115.1729, name: "情人崖" },
    ];
  }

  // 新加坡
  if (destination.includes("新加坡")) {
    return [
      { lat: 1.2834, lng: 103.8607, name: "滨海湾花园" },
      { lat: 1.2495, lng: 103.8304, name: "圣淘沙" },
      { lat: 1.2871, lng: 103.8552, name: "鱼尾狮公园" },
    ];
  }

  // 马尔代夫
  if (destination.includes("马尔代夫")) {
    return [
      { lat: 4.1755, lng: 73.5093, name: "马累市区" },
      { lat: 4.1851, lng: 73.5402, name: "胡鲁马累海滩" },
      { lat: 3.9167, lng: 73.4833, name: "浮潜体验" },
    ];
  }

  // 澳大利亚
  if (destination.includes("澳大利亚") || destination.includes("悉尼")) {
    return [
      { lat: -33.8568, lng: 151.2153, name: "悉尼歌剧院" },
      { lat: -33.8523, lng: 151.2108, name: "海港大桥" },
      { lat: -33.8737, lng: 151.2055, name: "达令港" },
    ];
  }

  // 美国目的地
  if (destination.includes("美国") || destination.includes("纽约")) {
    return [
      { lat: 40.7580, lng: -73.9855, name: "时代广场" },
      { lat: 40.6892, lng: -74.0445, name: "自由女神像" },
      { lat: 40.7794, lng: -73.9632, name: "中央公园" },
    ];
  }

  if (destination.includes("洛杉矶")) {
    return [
      { lat: 34.1381, lng: -118.3534, name: "环球影城" },
      { lat: 33.8121, lng: -118.3400, name: "圣莫尼卡海滩" },
      { lat: 34.0928, lng: -118.3287, name: "好莱坞标志" },
    ];
  }

  // 法国
  if (destination.includes("法国") || destination.includes("巴黎")) {
    return [
      { lat: 48.8606, lng: 2.3376, name: "卢浮宫" },
      { lat: 48.8584, lng: 2.2945, name: "埃菲尔铁塔" },
      { lat: 48.8738, lng: 2.2950, name: "凯旋门" },
    ];
  }

  // 意大利
  if (destination.includes("意大利") || destination.includes("罗马")) {
    return [
      { lat: 41.8902, lng: 12.4922, name: "罗马斗兽场" },
      { lat: 41.8986, lng: 12.4769, name: "许愿池" },
      { lat: 41.9029, lng: 12.4534, name: "梵蒂冈" },
    ];
  }

  // 英国
  if (destination.includes("英国") || destination.includes("伦敦")) {
    return [
      { lat: 51.5074, lng: -0.1278, name: "大英博物馆" },
      { lat: 51.5055, lng: -0.0754, name: "伦敦塔桥" },
      { lat: 51.4936, lng: -0.1194, name: "白金汉宫" },
    ];
  }

  // 瑞士
  if (destination.includes("瑞士")) {
    return [
      { lat: 46.5715, lng: 6.6309, name: "日内瓦湖" },
      { lat: 46.0528, lng: 7.7510, name: "马特洪峰" },
      { lat: 46.8182, lng: 8.2275, name: "少女峰" },
    ];
  }

  // 新西兰
  if (destination.includes("新西兰")) {
    return [
      { lat: -36.8485, lng: 174.7633, name: "奥克兰天空塔" },
      { lat: -45.0312, lng: 168.6626, name: "皇后镇" },
      { lat: -39.0556, lng: 174.0752, name: "汤加里罗国家公园" },
    ];
  }

  // 国内目的地
  if (destination.includes("北京")) {
    return [
      { lat: 39.9042, lng: 116.4074, name: "故宫博物院" },
      { lat: 40.4319, lng: 116.5704, name: "八达岭长城" },
      { lat: 39.8839, lng: 116.4170, name: "天坛" },
    ];
  }

  if (destination.includes("上海")) {
    return [
      { lat: 31.2304, lng: 121.4737, name: "外滩" },
      { lat: 31.2359, lng: 121.5076, name: "陆家嘴" },
      { lat: 31.2277, lng: 121.4852, name: "豫园" },
    ];
  }

  if (destination.includes("西安")) {
    return [
      { lat: 34.3848, lng: 109.2734, name: "兵马俑" },
      { lat: 34.2267, lng: 108.9455, name: "大雁塔" },
      { lat: 34.2583, lng: 108.9497, name: "西安城墙" },
    ];
  }

  if (destination.includes("成都")) {
    return [
      { lat: 30.5723, lng: 104.0665, name: "宽窄巷子" },
      { lat: 30.5919, lng: 104.0679, name: "武侯祠" },
      { lat: 30.5311, lng: 104.0678, name: "锦里" },
    ];
  }

  if (destination.includes("重庆")) {
    return [
      { lat: 29.5647, lng: 106.5507, name: "洪崖洞" },
      { lat: 29.5603, lng: 106.5743, name: "解放碑" },
      { lat: 29.5267, lng: 106.6020, name: "南山一棵树" },
    ];
  }

  if (destination.includes("杭州")) {
    return [
      { lat: 30.2591, lng: 120.1498, name: "西湖" },
      { lat: 30.2339, lng: 120.1515, name: "灵隐寺" },
      { lat: 30.2675, lng: 120.1520, name: "湖滨步行街" },
    ];
  }

  if (destination.includes("三亚")) {
    return [
      { lat: 18.2517, lng: 109.5119, name: "亚龙湾" },
      { lat: 18.2453, lng: 109.5119, name: "蜈支洲岛" },
      { lat: 18.2720, lng: 109.4923, name: "南山寺" },
    ];
  }

  // 默认返回一个通用配置
  return [
    { lat: 39.9042, lng: 116.4074, name: "市中心地标" },
    { lat: 39.9163, lng: 116.3972, name: "历史文化街区" },
    { lat: 39.9219, lng: 116.4431, name: "当地特色市场" },
  ];
}

function pickStage(startDate: string, endDate: string): TripStage {
  const now = new Date();
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59`);

  if (now > end) {
    return "completed";
  }
  if (now >= start) {
    return "ongoing";
  }
  return "planning";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

// Export for checkin API
export { getFallbackMapPins };
