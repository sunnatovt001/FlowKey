CREATE TABLE "PaymentLink" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "title" TEXT NOT NULL,
 "amountMinor" BIGINT NOT NULL CHECK ("amountMinor" > 0 AND "amountMinor" <= 1000000000),
 "currency" TEXT NOT NULL DEFAULT 'UZS' CHECK ("currency" = 'UZS'),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "disabledAt" TIMESTAMP(3)
);
CREATE INDEX "PaymentLink_projectId_createdAt_idx" ON "PaymentLink"("projectId", "createdAt");
CREATE TABLE "CheckoutSession" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "linkId" TEXT REFERENCES "PaymentLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "title" TEXT NOT NULL,
 "amountMinor" BIGINT NOT NULL CHECK ("amountMinor" > 0 AND "amountMinor" <= 1000000000),
 "currency" TEXT NOT NULL DEFAULT 'UZS' CHECK ("currency" = 'UZS'),
 "requestKey" TEXT NOT NULL,
 "requestHash" TEXT NOT NULL,
 "result" TEXT CHECK ("result" IN ('successful','failed','pending')),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "CheckoutSession_projectId_requestKey_key" ON "CheckoutSession"("projectId", "requestKey");
CREATE INDEX "CheckoutSession_projectId_createdAt_idx" ON "CheckoutSession"("projectId", "createdAt");
