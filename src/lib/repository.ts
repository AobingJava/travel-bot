import "server-only";

import { getDefaultDemoUser, getDemoBootstrap, getDemoState } from "@/lib/demo-data";
import { appEnv, hasD1ProxyConfig, hasDirectD1Config } from "@/lib/env";
import type {
  AppBootstrap,
  MagicLinkRecord,
  SessionUser,
  TripDocument,
} from "@/lib/types";
import { safeJsonParse } from "@/lib/utils";

export interface AppRepository {
  mode: "demo" | "d1";
  getBootstrap(currentUser: SessionUser | null): Promise<AppBootstrap>;
  listTrips(): Promise<TripDocument[]>;
  getTrip(tripId: string): Promise<TripDocument | null>;
  saveTrip(trip: TripDocument): Promise<void>;
  createTrip(trip: TripDocument): Promise<void>;
  findTripByTaskId(taskId: string): Promise<TripDocument | null>;
  upsertMagicLink(record: MagicLinkRecord): Promise<void>;
  consumeMagicLink(tokenHash: string): Promise<MagicLinkRecord | null>;
  listTripsForCron(): Promise<TripDocument[]>;
  /** 删除全部行程（含 D1 关联的 member_locations）。返回删除条数。 */
  deleteAllTrips(): Promise<{ tripsRemoved: number }>;
}

class DemoRepository implements AppRepository {
  readonly mode = "demo" as const;

  async getBootstrap(currentUser: SessionUser | null) {
    return getDemoBootstrap(currentUser);
  }

  async listTrips() {
    return structuredClone(getDemoState().trips);
  }

  async getTrip(tripId: string) {
    return (
      structuredClone(
        getDemoState().trips.find((trip) => trip.id === tripId) ?? null,
      ) ?? null
    );
  }

  async saveTrip(nextTrip: TripDocument) {
    const state = getDemoState();
    state.trips = state.trips.map((trip) =>
      trip.id === nextTrip.id ? structuredClone(nextTrip) : trip,
    );
  }

  async createTrip(trip: TripDocument) {
    const state = getDemoState();
    state.trips.unshift(structuredClone(trip));
  }

  async findTripByTaskId(taskId: string) {
    const trip = getDemoState().trips.find((candidate) =>
      candidate.tasks.some((task) => task.id === taskId),
    );
    return structuredClone(trip ?? null);
  }

  async upsertMagicLink(record: MagicLinkRecord) {
    const state = getDemoState();
    state.magicLinks = state.magicLinks.filter(
      (link) => link.tokenHash !== record.tokenHash,
    );
    state.magicLinks.push(structuredClone(record));
  }

  async consumeMagicLink(tokenHash: string) {
    const state = getDemoState();
    const link = state.magicLinks.find((item) => item.tokenHash === tokenHash);

    if (!link || link.consumedAt) {
      return null;
    }

    link.consumedAt = new Date().toISOString();
    return structuredClone(link);
  }

  async listTripsForCron() {
    return structuredClone(getDemoState().trips);
  }

  async deleteAllTrips() {
    const state = getDemoState();
    const tripsRemoved = state.trips.length;
    state.trips = [];
    return { tripsRemoved };
  }
}

class D1Repository implements AppRepository {
  readonly mode = "d1" as const;

  async getBootstrap(currentUser: SessionUser | null): Promise<AppBootstrap> {
    const trips = await this.listTrips();
    const fallbackUser = currentUser ?? getDefaultDemoUser();
    const unreadCount = trips
      .flatMap((trip) => trip.notifications)
      .filter((notice) => !notice.readAt).length;

    return {
      trips,
      featuredTripId: trips[0]?.id,
      currentUser: fallbackUser,
      unreadCount,
      dataSource: "d1" as const,
    };
  }

  async listTrips() {
    const rows = await this.query<TripRow>(
      "SELECT * FROM trip_documents ORDER BY updated_at DESC",
    );
    return rows.map(mapTripRow);
  }

  async getTrip(tripId: string) {
    const rows = await this.query<TripRow>(
      "SELECT * FROM trip_documents WHERE id = ? LIMIT 1",
      [tripId],
    );
    return rows[0] ? mapTripRow(rows[0]) : null;
  }

  async saveTrip(trip: TripDocument) {
    await this.query(
      `UPDATE trip_documents
       SET slug = ?, name = ?, destination = ?, start_date = ?, end_date = ?, traveler_count = ?,
           themes_json = ?, owner_email = ?, owner_name = ?, stage = ?, tasks_json = ?, members_json = ?,
           daily_suggestions_json = ?, banner_json = ?, events_json = ?, notifications_json = ?, updated_at = ?
       WHERE id = ?`,
      [
        trip.slug,
        trip.name,
        trip.destination,
        trip.startDate,
        trip.endDate,
        String(trip.travelerCount),
        JSON.stringify(trip.themes),
        trip.ownerEmail,
        trip.ownerName,
        trip.stage,
        JSON.stringify(trip.tasks),
        JSON.stringify(trip.members),
        JSON.stringify(trip.dailySuggestions),
        JSON.stringify(trip.banner),
        JSON.stringify(trip.events),
        JSON.stringify(trip.notifications),
        trip.updatedAt,
        trip.id,
      ],
    );
  }

  async createTrip(trip: TripDocument) {
    await this.query(
      `INSERT INTO trip_documents (
        id, slug, name, destination, start_date, end_date, traveler_count,
        themes_json, owner_email, owner_name, stage, tasks_json, members_json,
        daily_suggestions_json, banner_json, events_json, notifications_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trip.id,
        trip.slug,
        trip.name,
        trip.destination,
        trip.startDate,
        trip.endDate,
        String(trip.travelerCount),
        JSON.stringify(trip.themes),
        trip.ownerEmail,
        trip.ownerName,
        trip.stage,
        JSON.stringify(trip.tasks),
        JSON.stringify(trip.members),
        JSON.stringify(trip.dailySuggestions),
        JSON.stringify(trip.banner),
        JSON.stringify(trip.events),
        JSON.stringify(trip.notifications),
        trip.createdAt,
        trip.updatedAt,
      ],
    );
  }

  async findTripByTaskId(taskId: string) {
    const trips = await this.listTrips();
    return trips.find((trip) => trip.tasks.some((task) => task.id === taskId)) ?? null;
  }

  async upsertMagicLink(record: MagicLinkRecord) {
    await this.query(
      `INSERT INTO magic_links (token_hash, email, name, redirect_to, expires_at, consumed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(token_hash) DO UPDATE SET
         email = excluded.email,
         name = excluded.name,
         redirect_to = excluded.redirect_to,
         expires_at = excluded.expires_at,
         consumed_at = excluded.consumed_at`,
      [
        record.tokenHash,
        record.email,
        record.name,
        record.redirectTo,
        record.expiresAt,
        record.consumedAt ?? null,
        record.createdAt,
      ],
    );
  }

  async consumeMagicLink(tokenHash: string) {
    const rows = await this.query<MagicLinkRow>(
      "SELECT * FROM magic_links WHERE token_hash = ? LIMIT 1",
      [tokenHash],
    );

    const link = rows[0];
    if (!link || link.consumed_at) {
      return null;
    }

    const consumedAt = new Date().toISOString();
    await this.query(
      "UPDATE magic_links SET consumed_at = ? WHERE token_hash = ?",
      [consumedAt, tokenHash],
    );

    return {
      tokenHash: link.token_hash,
      email: link.email,
      name: link.name,
      redirectTo: link.redirect_to,
      expiresAt: link.expires_at,
      consumedAt,
      createdAt: link.created_at,
    };
  }

  async listTripsForCron() {
    return this.listTrips();
  }

  async deleteAllTrips() {
    const trips = await this.listTrips();
    const tripsRemoved = trips.length;
    await this.query("DELETE FROM member_locations");
    await this.query("DELETE FROM trip_documents");
    return { tripsRemoved };
  }

  private async query<T>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    if (hasD1ProxyConfig()) {
      const response = await fetch(appEnv.d1ProxyUrl!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(appEnv.d1ProxyToken
            ? { Authorization: `Bearer ${appEnv.d1ProxyToken}` }
            : {}),
        },
        body: JSON.stringify({ query: sql, params }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`D1 proxy request failed with ${response.status}.`);
      }

      const payload = (await response.json()) as { results?: T[] };
      return payload.results ?? [];
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${appEnv.d1AccountId}/d1/database/${appEnv.d1DatabaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${appEnv.d1ApiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql,
          params,
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Cloudflare D1 request failed with ${response.status}.`);
    }

    const payload = (await response.json()) as {
      success?: boolean;
      result?: Array<{ results?: T[] }>;
      errors?: Array<{ message?: string }>;
    };

    if (!payload.success) {
      const message = payload.errors?.[0]?.message ?? "Unknown D1 error.";
      throw new Error(message);
    }

    return payload.result?.[0]?.results ?? [];
  }
}

interface TripRow {
  id: string;
  slug: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  traveler_count: number | string;
  themes_json: string;
  owner_email: string;
  owner_name: string;
  stage: TripDocument["stage"];
  tasks_json: string;
  members_json: string;
  daily_suggestions_json: string;
  banner_json: string;
  events_json: string;
  notifications_json: string;
  created_at: string;
  updated_at: string;
}

interface MagicLinkRow {
  token_hash: string;
  email: string;
  name: string;
  redirect_to: string;
  expires_at: string;
  consumed_at?: string;
  created_at: string;
}

function mapTripRow(row: TripRow): TripDocument {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    destination: row.destination,
    startDate: row.start_date,
    endDate: row.end_date,
    travelerCount: Number(row.traveler_count),
    themes: safeJsonParse(row.themes_json, []),
    ownerEmail: row.owner_email,
    ownerName: row.owner_name,
    stage: row.stage,
    tasks: safeJsonParse(row.tasks_json, []),
    members: safeJsonParse(row.members_json, []),
    dailySuggestions: safeJsonParse(row.daily_suggestions_json, []),
    banner: safeJsonParse(row.banner_json, {
      title: "",
      body: "",
      tone: "neutral",
      updatedAt: row.updated_at,
    }),
    events: safeJsonParse(row.events_json, []),
    notifications: safeJsonParse(row.notifications_json, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

let repositoryInstance: AppRepository | undefined;

export function getRepository(): AppRepository {
  if (repositoryInstance) {
    return repositoryInstance;
  }

  repositoryInstance =
    hasD1ProxyConfig() || hasDirectD1Config()
      ? new D1Repository()
      : new DemoRepository();

  return repositoryInstance;
}
