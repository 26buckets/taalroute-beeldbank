CREATE TABLE IF NOT EXISTS content_packages (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL CHECK(json_valid(payload)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS lesson_selections (
  owner TEXT PRIMARY KEY,
  items TEXT NOT NULL CHECK(json_valid(items)),
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
