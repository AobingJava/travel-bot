import "server-only";

import type { PackingListItem } from "@/lib/types";

const packingListsByTripId = new Map<string, PackingListItem[]>();

export function getPackingListMemoryStore() {
  return packingListsByTripId;
}

export function clearPackingListMemory() {
  packingListsByTripId.clear();
}
