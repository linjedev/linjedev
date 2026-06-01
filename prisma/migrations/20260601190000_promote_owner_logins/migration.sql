UPDATE "users"
SET "role" = 'admin',
    "status" = 'approved',
    "approvedAt" = COALESCE("approvedAt", CURRENT_TIMESTAMP),
    "approvedById" = COALESCE("approvedById", "id")
WHERE lower("email") IN ('admin', 'seb', 'sebastian')
   OR lower("name") IN ('admin', 'seb', 'sebastian');
