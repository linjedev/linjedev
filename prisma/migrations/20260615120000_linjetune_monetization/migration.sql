CREATE TABLE "linjetune_accounts" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "paintLabUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "tuneTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linjetune_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "linjetune_transactions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tuneTokensDelta" INTEGER NOT NULL DEFAULT 0,
    "paintLabUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "amountTotal" INTEGER,
    "currency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linjetune_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "linjetune_accounts_ownerId_key" ON "linjetune_accounts"("ownerId");
CREATE UNIQUE INDEX "linjetune_transactions_stripeSessionId_key" ON "linjetune_transactions"("stripeSessionId");
CREATE INDEX "linjetune_transactions_accountId_createdAt_idx" ON "linjetune_transactions"("accountId", "createdAt");

ALTER TABLE "linjetune_transactions" ADD CONSTRAINT "linjetune_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "linjetune_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
