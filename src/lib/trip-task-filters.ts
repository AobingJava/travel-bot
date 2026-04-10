import type { TripDocument } from "./types";

/**
 * 产品已不再展示行前待办；读取/落库时去掉 phase=pre，清理历史 JSON 与后续写入。
 */
export function tripDocumentWithoutPreTasks(trip: TripDocument): TripDocument {
  return {
    ...trip,
    tasks: trip.tasks.filter((t) => t.phase !== "pre"),
  };
}
