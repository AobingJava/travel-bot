import { tripThemes, type TaskPhase, type TaskStatus, type ThemeKey, type TripTask } from "@/lib/types";

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function createAvatarText(nameOrEmail: string) {
  const trimmed = nameOrEmail.trim();
  if (!trimmed) return "旅伴";
  const first = Array.from(trimmed)[0];
  return first.toUpperCase();
}

export function formatDateLabel(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

export function formatLongDate(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export function formatDateRange(startDate: string, endDate: string) {
  return `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;
}

export function getThemeLabel(key: ThemeKey) {
  return tripThemes.find((theme) => theme.key === key)?.label ?? key;
}

export function getTaskLabelText(label?: TripTask["label"]) {
  switch (label) {
    case "suggestion":
      return "建议";
    case "backup":
      return "备选";
    case "food":
      return "餐饮";
    case "transport":
      return "交通";
    case "lodging":
      return "住宿";
    case "summary":
      return "总结";
    default:
      return "建议";
  }
}

export function getTaskLabelClass(label?: TripTask["label"]) {
  switch (label) {
    case "suggestion":
      return "bg-mint-100 text-mint-700";
    case "backup":
      return "bg-sky-100 text-sky-700";
    case "food":
      return "bg-amber-100 text-amber-700";
    case "transport":
      return "bg-violet-100 text-violet-700";
    case "lodging":
      return "bg-emerald-100 text-emerald-700";
    case "summary":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-mint-100 text-mint-700";
  }
}

export function sortTasks(tasks: TripTask[]) {
  return [...tasks].sort((left, right) => {
    if (left.phase !== right.phase) {
      return phaseWeight[left.phase] - phaseWeight[right.phase];
    }
    if ((left.dayIndex ?? 0) !== (right.dayIndex ?? 0)) {
      return (left.dayIndex ?? 0) - (right.dayIndex ?? 0);
    }
    return left.sortOrder - right.sortOrder;
  });
}

const phaseWeight: Record<TaskPhase, number> = {
  pre: 0,
  during: 1,
  post: 2,
};

export function getProgress(tasks: TripTask[], phase?: TaskPhase) {
  const list = phase ? tasks.filter((task) => task.phase === phase) : tasks;
  if (!list.length) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  const completed = list.filter((task) => task.status === "done").length;
  return {
    completed,
    total: list.length,
    percentage: Math.round((completed / list.length) * 100),
  };
}

export function getTripStageLabel(stage: string) {
  switch (stage) {
    case "ongoing":
      return "进行中";
    case "completed":
      return "已完成";
    case "planning":
      return "筹备中";
    default:
      return "草稿";
  }
}

export function safeJsonParse<T>(value: string, fallback: T) {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function extractJsonObject(raw: string) {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return candidate.slice(start, end + 1);
  }
  throw new Error("Model response did not contain valid JSON.");
}

function tryJsonParse(value: string): unknown | null {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

/** 尽量从模型原文中解析出 JSON（整段、代码块、截取首尾花括号/方括号），失败时抛出中文错误 */
export function parseLooseModelJson(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("模型返回为空，请重试。");
  }

  const direct = tryJsonParse(trimmed);
  if (direct !== null) {
    return direct;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  const fromFence = tryJsonParse(candidate);
  if (fromFence !== null) {
    return fromFence;
  }

  const objStart = candidate.indexOf("{");
  const objEnd = candidate.lastIndexOf("}");
  if (objStart >= 0 && objEnd > objStart) {
    const sliced = tryJsonParse(candidate.slice(objStart, objEnd + 1));
    if (sliced !== null) {
      return sliced;
    }
  }

  const arrStart = candidate.indexOf("[");
  const arrEnd = candidate.lastIndexOf("]");
  if (arrStart >= 0 && arrEnd > arrStart) {
    const sliced = tryJsonParse(candidate.slice(arrStart, arrEnd + 1));
    if (sliced !== null) {
      return sliced;
    }
  }

  throw new Error(
    "模型返回的内容无法解析为合法 JSON（可能混入了说明文字或格式错误），请重试。",
  );
}

export function getTaskStatusLabel(status: TaskStatus) {
  return status === "done" ? "已完成" : "待处理";
}

export function getTravelModeText(mode?: TripTask["travelMode"]) {
  switch (mode) {
    case "walk":
      return "步行";
    case "subway":
      return "地铁";
    case "train":
      return "电车";
    case "bus":
      return "公交";
    case "taxi":
      return "打车";
    default:
      return "";
  }
}
