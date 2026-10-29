ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "image" TEXT, ADD COLUMN "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "passwordHash" SET DEFAULT '';
ALTER TABLE "Session" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "ipAddress" TEXT, ADD COLUMN "token" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "userAgent" TEXT, ALTER COLUMN "tokenHash" DROP NOT NULL;
UPDATE "Session" SET "expiresAt" = CURRENT_TIMESTAMP WHERE "tokenHash" IS NOT NULL;
ALTER TABLE "Project" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "ApiKey" ADD COLUMN "lastUsedAt" TIMESTAMP(3);
ALTER TABLE "Transaction" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'sandbox',
ADD COLUMN "providerReference" TEXT, ALTER COLUMN "amountMinor" SET DATA TYPE BIGINT;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_amount_check" CHECK ("amountMinor" > 0 AND "amountMinor" <= 1000000000),
ADD CONSTRAINT "Transaction_currency_check" CHECK ("currency" = 'UZS'),
ADD CONSTRAINT "Transaction_status_check" CHECK ("status" IN ('successful','failed','pending'));
ALTER TABLE "WebhookDelivery" ADD COLUMN "leaseUntil" TIMESTAMP(3),
ADD COLUMN "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN "payload" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "actorId" TEXT, ADD COLUMN "requestId" TEXT;
CREATE TABLE "AuthRateLimit" ("id" TEXT PRIMARY KEY, "key" TEXT NOT NULL UNIQUE, "count" INTEGER NOT NULL, "lastRequest" BIGINT NOT NULL);
CREATE TABLE "Account" (
"id" TEXT PRIMARY KEY, "accountId" TEXT NOT NULL, "providerId" TEXT NOT NULL, "userId" TEXT NOT NULL,
"accessToken" TEXT, "refreshToken" TEXT, "idToken" TEXT, "accessTokenExpiresAt" TIMESTAMP(3),
"refreshTokenExpiresAt" TIMESTAMP(3), "scope" TEXT, "password" TEXT,
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE);
INSERT INTO "Account" ("id", "accountId", "providerId", "userId") SELECT 'legacy_' || "id", "id", 'credential', "id" FROM "User";
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId","accountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE TABLE "Verification" ("id" TEXT PRIMARY KEY, "identifier" TEXT NOT NULL, "value" TEXT NOT NULL,
"expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");
CREATE TABLE "OnboardingDraft" ("userId" TEXT PRIMARY KEY, "values" JSONB NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
CONSTRAINT "OnboardingDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE "WebhookDeliveryAttempt" ("id" TEXT PRIMARY KEY, "deliveryId" TEXT NOT NULL, "attemptNumber" INTEGER NOT NULL,
"responseCode" INTEGER, "error" TEXT, "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3),
CONSTRAINT "WebhookDeliveryAttempt_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "WebhookDelivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE);
CREATE UNIQUE INDEX "WebhookDeliveryAttempt_deliveryId_attemptNumber_key" ON "WebhookDeliveryAttempt"("deliveryId","attemptNumber");
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "WebhookDelivery_status_nextAttemptAt_idx" ON "WebhookDelivery"("status","nextAttemptAt");
