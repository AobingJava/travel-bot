import type { AppBootstrap, MagicLinkRecord, SessionUser, TripDocument } from "@/lib/types";
import { tripDocumentWithoutPreTasks } from "@/lib/trip-task-filters";

const demoUser: SessionUser = {
  email: "aihe@example.com",
  name: "Aihe",
  avatarText: "你",
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
  }

  return globalThis.__travelBotDemoState__;
}

export function getDemoBootstrap(currentUser: SessionUser | null): AppBootstrap {
  const state = getDemoState();
  const unreadCount = state.trips
    .flatMap((trip) => trip.notifications)
    .filter((notice) => !notice.readAt).length;

  return {
    trips: structuredClone(state.trips).map(tripDocumentWithoutPreTasks),
    featuredTripId: state.trips[0]?.id,
    currentUser: currentUser ?? demoUser,
    unreadCount,
    dataSource: "demo",
  };
}

export function getDefaultDemoUser() {
  return demoUser;
}
