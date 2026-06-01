ALTER TABLE "users" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "users" ADD COLUMN "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "users" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "approvedById" TEXT;

UPDATE "users"
SET "status" = 'approved',
    "approvedAt" = COALESCE("approvedAt", CURRENT_TIMESTAMP)
WHERE "role" IN ('admin', 'demo-admin');
