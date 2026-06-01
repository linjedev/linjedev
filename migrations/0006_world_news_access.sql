CREATE TABLE IF NOT EXISTS world_news_requests (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  reviewed_by TEXT DEFAULT '',
  reviewed_at TEXT DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_world_news_requests_status ON world_news_requests(status);

CREATE TABLE IF NOT EXISTS world_news_access (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  granted_by TEXT DEFAULT '',
  granted_at TEXT NOT NULL,
  revoked_by TEXT DEFAULT '',
  revoked_at TEXT DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_world_news_access_username ON world_news_access(username);
