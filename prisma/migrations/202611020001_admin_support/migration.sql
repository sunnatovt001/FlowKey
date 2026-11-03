ALTER TABLE "SupportTicket"
  ADD COLUMN "resolutionStatus" TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN "resolvedAt" TIMESTAMP(3),
  ADD COLUMN "resolvedBy" TEXT;
CREATE INDEX "SupportTicket_resolutionStatus_createdAt_idx" ON "SupportTicket"("resolutionStatus", "createdAt");
CREATE TABLE "AdminAudit" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "details" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AdminAudit_createdAt_idx" ON "AdminAudit"("createdAt");
