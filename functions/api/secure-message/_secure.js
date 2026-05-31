export async function ensureSecureMessageTables(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS secure_message_requests (
      user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      requested_at TEXT NOT NULL,
      reviewed_by TEXT DEFAULT '',
      reviewed_at TEXT DEFAULT ''
    )`
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS secure_message_access (
      user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      granted_by TEXT DEFAULT '',
      granted_at TEXT NOT NULL,
      revoked_by TEXT DEFAULT '',
      revoked_at TEXT DEFAULT ''
    )`
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_secure_message_access_username ON secure_message_access(username)"
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS secure_message_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      event TEXT NOT NULL,
      message_bytes INTEGER DEFAULT 0,
      ciphertext_bytes INTEGER DEFAULT 0,
      ip_address TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      created_at TEXT NOT NULL
    )`
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_secure_message_events_created_at ON secure_message_events(created_at)"
  ).run();
}

export async function getSecureMessageEnrollment(env, user, isAdmin = false) {
  await ensureSecureMessageTables(env);
  const grant = user
    ? await env.DB.prepare(
      `SELECT user_id, username, granted_at, revoked_at
       FROM secure_message_access
       WHERE user_id = ?`
    ).bind(user.id).first()
    : null;
  const request = user
    ? await env.DB.prepare(
      `SELECT user_id, username, status, requested_at, reviewed_by, reviewed_at
       FROM secure_message_requests
       WHERE user_id = ?`
    ).bind(user.id).first()
    : null;
  const allowed = Boolean(user && (isAdmin || (grant && !grant.revoked_at)));

  return {
    allowed,
    grantedAt: grant && !grant.revoked_at ? grant.granted_at : "",
    registered: Boolean(request || grant || isAdmin),
    requestedAt: request ? request.requested_at : "",
    status: allowed ? "approved" : request ? request.status : "not_registered"
  };
}

export async function hasSecureMessageAccess(env, user, isAdmin = false) {
  if (!user) return false;
  if (isAdmin) return true;

  const enrollment = await getSecureMessageEnrollment(env, user, isAdmin);
  return enrollment.allowed;
}
