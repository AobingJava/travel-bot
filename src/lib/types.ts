export const tripThemes = [
  { key: "culture", label: "文化古迹" },
  { key: "food", label: "美食探店" },
  { key: "shopping", label: "购物" },
  { key: "nature", label: "自然风景" },
  { key: "nightlife", label: "夜生活" },
  { key: "family", label: "亲子游" },
] as const;

export type ThemeKey = (typeof tripThemes)[number]["key"];
export type TaskPhase = "pre" | "during" | "post";
export type TaskLabel =
  | "suggestion"
  | "backup"
  | "food"
  | "transport"
  | "lodging"
  | "summary";
export type TaskStatus = "open" | "done";
export type TripStage = "draft" | "planning" | "ongoing" | "completed";
export type InviteStatus = "confirmed" | "pending";
export type MemberRole = "owner" | "traveler";
export type TravelMode = "walk" | "subway" | "train" | "bus" | "taxi";

export interface SessionUser {
  email: string;
  name: string;
  avatarText: string;
}

export interface TripTask {
  id: string;
  title: string;
  notes?: string;
  phase: TaskPhase;
  label?: TaskLabel;
  status: TaskStatus;
  dayIndex?: number;
  dayLabel?: string;
  dueDate?: string;
  sortOrder: number;
  assigneeEmail?: string;
  assigneeName?: string;
  source: "ai" | "manual" | "replan";
  lat?: number;
  lng?: number;
  locationName?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  travelMinutes?: number;
  travelMode?: TravelMode;
  routeHint?: string;
}

export interface TripMember {
  id: string;
  email: string;
  name: string;
  avatarText: string;
  role: MemberRole;
  inviteStatus: InviteStatus;
  invitedAt: string;
  confirmedAt?: string;
}

export interface TripDailySuggestion {
  id: string;
  dayIndex: number;
  label: string;
  title: string;
  summary: string;
}

export interface TripBanner {
  title: string;
  body: string;
  tone: "neutral" | "weather" | "timing";
  updatedAt: string;
}

export interface TripEvent {
  id: string;
  type:
    | "trip_created"
    | "trip_replanned"
    | "task_completed"
    | "member_invited"
    | "member_joined"
    | "member_confirmed";
  title: string;
  body: string;
  actorName: string;
  createdAt: string;
}

export interface TripNotification {
  id: string;
  tripId: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
}

export interface TripDocument {
  id: string;
  slug: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  themes: ThemeKey[];
  customTags?: string[];
  packingList?: string[];
  ownerEmail: string;
  ownerName: string;
  stage: TripStage;
  tasks: TripTask[];
  members: TripMember[];
  dailySuggestions: TripDailySuggestion[];
  banner: TripBanner;
  events: TripEvent[];
  notifications: TripNotification[];
  createdAt: string;
  updatedAt: string;
}

export interface AppBootstrap {
  trips: TripDocument[];
  featuredTripId?: string;
  currentUser: SessionUser | null;
  unreadCount: number;
  dataSource: "demo" | "d1";
}

export interface CreateTripInput {
  name?: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelerCount?: number;
  themes: ThemeKey[];
  customTags?: string[];
  generatePackingList?: boolean;
}

export interface InviteMemberInput {
  email: string;
  name?: string;
}

export interface Attraction {
  id: string;
  name: string;
  address?: string;
  rating?: number;
  visitDuration?: number;
  bestTimeToVisit?: string;
  description?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
}

export interface TaskUpdateInput {
  status: TaskStatus;
}

export interface MagicLinkRecord {
  tokenHash: string;
  email: string;
  name: string;
  redirectTo: string;
  expiresAt: string;
  consumedAt?: string;
  createdAt: string;
}

export interface GeneratedTripPlan {
  name: string;
  stage: TripStage;
  tasks: TripTask[];
  dailySuggestions: TripDailySuggestion[];
  banner: TripBanner;
  packingList?: string[];
}
