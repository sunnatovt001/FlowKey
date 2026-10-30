-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "feeMinor" BIGINT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "status" TEXT NOT NULL DEFAULT 'requested',
    "actorId" TEXT NOT NULL,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "interval" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "consentAt" TIMESTAMP(3) NOT NULL,
    "nextBillingAt" TIMESTAMP(3) NOT NULL,
    "period" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectInvite" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerEntry_projectId_currency_createdAt_idx" ON "LedgerEntry"("projectId", "currency", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_operationId_account_key" ON "LedgerEntry"("operationId", "account");

-- CreateIndex
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_projectId_requestKey_key" ON "Refund"("projectId", "requestKey");

-- CreateIndex
CREATE INDEX "Payout_projectId_createdAt_idx" ON "Payout"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_projectId_requestKey_key" ON "Payout"("projectId", "requestKey");

-- CreateIndex
CREATE INDEX "Subscription_projectId_createdAt_idx" ON "Subscription"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_projectId_requestKey_key" ON "Subscription"("projectId", "requestKey");

-- CreateIndex
CREATE INDEX "ProjectInvite_email_status_idx" ON "ProjectInvite"("email", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvite_projectId_email_key" ON "ProjectInvite"("projectId", "email");

-- Existing successful sandbox payments use the same 3% integer-minor-unit policy.
INSERT INTO "LedgerEntry" ("id", "projectId", "operationId", "account", "currency", "amountMinor", "createdAt")
SELECT 'ledger_' || md5(t."id" || ':' || a.account), t."projectId", 'payment:' || t."id", a.account, t.currency,
CASE a.account WHEN 'provider' THEN -t."amountMinor" WHEN 'fees' THEN t."amountMinor" * 3 / 100 ELSE t."amountMinor" - t."amountMinor" * 3 / 100 END,
t."createdAt"
FROM "Transaction" t CROSS JOIN (VALUES ('provider'), ('fees'), ('available')) AS a(account)
WHERE t.status = 'successful';
