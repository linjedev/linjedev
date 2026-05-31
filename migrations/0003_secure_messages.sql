CREATE TABLE IF NOT EXISTS secure_message_requests (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  reviewed_by TEXT DEFAULT '',
  reviewed_at TEXT DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS secure_message_access (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  granted_by TEXT DEFAULT '',
  granted_at TEXT NOT NULL,
  revoked_by TEXT DEFAULT '',
  revoked_at TEXT DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_secure_message_access_username ON secure_message_access(username);

CREATE TABLE IF NOT EXISTS secure_message_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  event TEXT NOT NULL,
  message_bytes INTEGER DEFAULT 0,
  ciphertext_bytes INTEGER DEFAULT 0,
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_secure_message_events_created_at ON secure_message_events(created_at);
