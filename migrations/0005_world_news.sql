CREATE TABLE IF NOT EXISTS world_news_unlocks (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_world_news_unlocks_user_id ON world_news_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_world_news_unlocks_expires_at ON world_news_unlocks(expires_at);

CREATE TABLE IF NOT EXISTS world_news_cache (
  cache_key TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
