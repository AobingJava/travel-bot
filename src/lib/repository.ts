import "server-only";

import { getDefaultDemoUser, getDemoBootstrap, getDemoState } from "@/lib/demo-data";
import { appEnv, hasD1ProxyConfig, hasDirectD1Config } from "@/lib/env";
import type {
  AppBootstrap,
  MagicLinkRecord,
  PackingListItem,
  SessionUser,
  TripDocument,
  TripTask,
} from "@/lib/types";
import { tripDocumentWithoutPreTasks } from "@/lib/trip-task-filters";
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
    return structuredClone(getDemoState().trips).map(tripDocumentWithoutPreTasks);
  }

  async getTrip(tripId: string) {
    const raw = getDemoState().trips.find((trip) => trip.id === tripId) ?? null;
    return raw ? tripDocumentWithoutPreTasks(structuredClone(raw)) : null;
  }

  async saveTrip(nextTrip: TripDocument) {
    const sanitized = tripDocumentWithoutPreTasks(nextTrip);
    const state = getDemoState();
    state.trips = state.trips.map((trip) =>
      trip.id === sanitized.id ? structuredClone(sanitized) : trip,
    );
  }

  async createTrip(trip: TripDocument) {
    const state = getDemoState();
    state.trips.unshift(structuredClone(tripDocumentWithoutPreTasks(trip)));
  }

  async findTripByTaskId(taskId: string) {
    const trip = getDemoState().trips.find((candidate) =>
      candidate.tasks.some((task) => task.id === taskId),
    );
    return trip ? tripDocumentWithoutPreTasks(structuredClone(trip)) : null;
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
    return structuredClone(getDemoState().trips).map(tripDocumentWithoutPreTasks);
  }

  async deleteAllTrips() {
    const state = getDemoState();
    const tripsRemoved = state.trips.length;
    state.trips = [];
    return { tripsRemoved };
  }
}

/** D1 HTTP API 的 `params` 仅接受字符串；传 JSON null 常导致 400。空字符串在 TEXT 列中等价于「未填」，由上层语义处理。 */
function bindParamsForD1(params: unknown[]): string[] {
  return params.map((p) => {
    if (p === null || p === undefined) {
      return "";
    }
    return typeof p === "string" ? p : String(p);
  });
}

/** 旧库无 packing_list_json 列时，首次请求前自动 ALTER；列已存在则忽略 duplicate / already exists。 */
function isIgnorablePackingColumnMigrationError(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("duplicate column") ||
    (t.includes("already exists") && t.includes("packing_list")) ||
    (t.includes("duplicate column name") && t.includes("packing_list"))
  );
}

let d1PackingListMigrationPromise: Promise<void> | null = null;

function ensureD1PackingListColumn(): Promise<void> {
  if (!d1PackingListMigrationPromise) {
    d1PackingListMigrationPromise = runD1PackingListMigration().catch((err) => {
      d1PackingListMigrationPromise = null;
      throw err;
    });
  }
  return d1PackingListMigrationPromise;
}

async function runD1PackingListMigration(): Promise<void> {
  const sql = "ALTER TABLE trip_documents ADD COLUMN packing_list_json TEXT";
  const bound = bindParamsForD1([]);

  if (hasD1ProxyConfig()) {
    const response = await fetch(appEnv.d1ProxyUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(appEnv.d1ProxyToken ? { Authorization: `Bearer ${appEnv.d1ProxyToken}` } : {}),
      },
      body: JSON.stringify({ query: sql, params: bound }),
      cache: "no-store",
    });
    const rawText = await response.text();
    if (isIgnorablePackingColumnMigrationError(rawText)) {
      return;
    }
    if (!response.ok) {
      throw new Error(`D1 proxy migration failed ${response.status}: ${rawText.slice(0, 500)}`);
    }
    try {
      const payload = JSON.parse(rawText) as { errors?: Array<{ message?: string }> };
      const msg = payload.errors?.map((e) => e.message).join("; ") ?? rawText;
      if (isIgnorablePackingColumnMigrationError(msg)) {
        return;
      }
    } catch {
      /* 非 JSON 但已 response.ok 则视为成功 */
    }
    return;
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${appEnv.d1AccountId}/d1/database/${appEnv.d1DatabaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appEnv.d1ApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params: bound }),
      cache: "no-store",
    },
  );

  const rawText = await response.text();
  let payload: {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    result?: Array<{ success?: boolean }>;
  };
  try {
    payload = JSON.parse(rawText) as {
      success?: boolean;
      errors?: Array<{ message?: string }>;
      result?: Array<{ success?: boolean }>;
    };
  } catch {
    if (isIgnorablePackingColumnMigrationError(rawText)) {
      return;
    }
    throw new Error(`D1 migration non-JSON (${response.status}): ${rawText.slice(0, 300)}`);
  }

  const errorBlob =
    payload.errors?.map((e) => e.message).join("; ") ||
    (!payload.success ? rawText : "") ||
    "";

  if (!response.ok) {
    if (isIgnorablePackingColumnMigrationError(errorBlob) || isIgnorablePackingColumnMigrationError(rawText)) {
      return;
    }
    throw new Error(`D1 migration failed ${response.status}: ${errorBlob || rawText.slice(0, 400)}`);
  }

  if (!payload.success) {
    if (isIgnorablePackingColumnMigrationError(errorBlob) || isIgnorablePackingColumnMigrationError(rawText)) {
      return;
    }
    throw new Error(errorBlob || rawText.slice(0, 400) || "D1 migration failed");
  }

  const first = payload.result?.[0];
  if (first && first.success === false) {
    if (isIgnorablePackingColumnMigrationError(rawText)) {
      return;
    }
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
    const sanitized = tripDocumentWithoutPreTasks(trip);
    await this.query(
      `UPDATE trip_documents
       SET slug = ?, name = ?, destination = ?, start_date = ?, end_date = ?, traveler_count = ?,
           themes_json = ?, owner_email = ?, owner_name = ?, stage = ?, tasks_json = ?, members_json = ?,
           daily_suggestions_json = ?, banner_json = ?, events_json = ?, notifications_json = ?,
           packing_list_json = ?, updated_at = ?
       WHERE id = ?`,
      [
        sanitized.slug,
        sanitized.name,
        sanitized.destination,
        sanitized.startDate,
        sanitized.endDate,
        String(sanitized.travelerCount),
        JSON.stringify(sanitized.themes),
        sanitized.ownerEmail,
        sanitized.ownerName,
        sanitized.stage,
        JSON.stringify(sanitized.tasks),
        JSON.stringify(sanitized.members),
        JSON.stringify(sanitized.dailySuggestions),
        JSON.stringify(sanitized.banner),
        JSON.stringify(sanitized.events),
        JSON.stringify(sanitized.notifications),
        JSON.stringify(sanitized.packingList ?? []),
        sanitized.updatedAt,
        sanitized.id,
      ],
    );
  }

  async createTrip(trip: TripDocument) {
    const sanitized = tripDocumentWithoutPreTasks(trip);
    await this.query(
      `INSERT INTO trip_documents (
        id, slug, name, destination, start_date, end_date, traveler_count,
        themes_json, owner_email, owner_name, stage, tasks_json, members_json,
        daily_suggestions_json, banner_json, events_json, notifications_json,
        packing_list_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sanitized.id,
        sanitized.slug,
        sanitized.name,
        sanitized.destination,
        sanitized.startDate,
        sanitized.endDate,
        String(sanitized.travelerCount),
        JSON.stringify(sanitized.themes),
        sanitized.ownerEmail,
        sanitized.ownerName,
        sanitized.stage,
        JSON.stringify(sanitized.tasks),
        JSON.stringify(sanitized.members),
        JSON.stringify(sanitized.dailySuggestions),
        JSON.stringify(sanitized.banner),
        JSON.stringify(sanitized.events),
        JSON.stringify(sanitized.notifications),
        JSON.stringify(sanitized.packingList ?? []),
        sanitized.createdAt,
        sanitized.updatedAt,
      ],
    );
  }

  async findTripByTaskId(taskId: string) {
    const rows = await this.query<{ id: string; tasks_json: string }>(
      "SELECT id, tasks_json FROM trip_documents",
    );
    const match = rows.find((row) => {
      const tasks = safeJsonParse<TripTask[]>(row.tasks_json, []);
      return tasks.some((task) => task.id === taskId);
    });
    return match ? this.getTrip(match.id) : null;
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
        record.consumedAt ?? "",
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
    await ensureD1PackingListColumn();
    const bound = bindParamsForD1(params);

    if (hasD1ProxyConfig()) {
      const response = await fetch(appEnv.d1ProxyUrl!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(appEnv.d1ProxyToken
            ? { Authorization: `Bearer ${appEnv.d1ProxyToken}` }
            : {}),
        },
        body: JSON.stringify({ query: sql, params: bound }),
        cache: "no-store",
      });

      const rawText = await response.text();
      let detail = rawText;
      try {
        const errJson = JSON.parse(rawText) as { error?: string; message?: string };
        detail = errJson.error ?? errJson.message ?? rawText;
      } catch {
        /* 非 JSON */
      }

      if (!response.ok) {
        throw new Error(
          `D1 proxy request failed with ${response.status}. ${detail.slice(0, 500)}`,
        );
      }

      try {
        const payload = JSON.parse(rawText) as { results?: T[] };
        return payload.results ?? [];
      } catch {
        throw new Error(`D1 proxy returned non-JSON: ${rawText.slice(0, 200)}`);
      }
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
          params: bound,
        }),
        cache: "no-store",
      },
    );

    const rawText = await response.text();
    let payload: {
      success?: boolean;
      result?: Array<{ results?: T[] }>;
      errors?: Array<{ message?: string; code?: number }>;
    };
    try {
      payload = JSON.parse(rawText) as typeof payload;
    } catch {
      throw new Error(
        `Cloudflare D1 non-JSON response (${response.status}): ${rawText.slice(0, 300)}`,
      );
    }

    if (!response.ok) {
      const msg =
        payload.errors?.map((e) => e.message).join("; ") ||
        rawText.slice(0, 400) ||
        response.statusText;
      throw new Error(`Cloudflare D1 request failed with ${response.status}: ${msg}`);
    }

    if (!payload.success) {
      const message = payload.errors?.[0]?.message ?? rawText.slice(0, 400) ?? "Unknown D1 error.";
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
  packing_list_json?: string | null;
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
  return tripDocumentWithoutPreTasks({
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
    ...(row.packing_list_json != null && String(row.packing_list_json).length > 0
      ? {
          packingList: safeJsonParse<PackingListItem[] | string[]>(
            row.packing_list_json,
            [],
          ),
        }
      : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
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
