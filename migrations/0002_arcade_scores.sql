CREATE TABLE IF NOT EXISTS arcade_scores (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_arcade_scores_score ON arcade_scores(score DESC, updated_at ASC);
