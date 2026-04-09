CREATE TABLE IF NOT EXISTS trip_documents (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  traveler_count INTEGER NOT NULL,
  themes_json TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  stage TEXT NOT NULL,
  tasks_json TEXT NOT NULL,
  members_json TEXT NOT NULL,
  daily_suggestions_json TEXT NOT NULL,
  banner_json TEXT NOT NULL,
  events_json TEXT NOT NULL,
  notifications_json TEXT NOT NULL,
  packing_list_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trip_documents_updated_at
  ON trip_documents(updated_at DESC);

CREATE TABLE IF NOT EXISTS magic_links (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  redirect_to TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS member_locations (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  member_email TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  accuracy REAL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trip_documents(id)
);

CREATE INDEX IF NOT EXISTS idx_member_locations_trip
  ON member_locations(trip_id, member_email);
