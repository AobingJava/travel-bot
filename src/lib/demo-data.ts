import type { AppBootstrap, MagicLinkRecord, SessionUser, TripDocument } from "@/lib/types";

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
    trips: [],
    featuredTripId: undefined,
    currentUser: currentUser ?? demoUser,
    unreadCount,
    dataSource: "demo",
  };
}

export function getDefaultDemoUser() {
  return demoUser;
}
