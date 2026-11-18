CREATE TABLE "SupportReply" (
 "id" TEXT NOT NULL, "ticketId" TEXT NOT NULL, "actorId" TEXT NOT NULL,
 "requestKey" TEXT NOT NULL, "content" TEXT NOT NULL,
 "notificationStatus" TEXT NOT NULL DEFAULT 'queued', "attempts" INTEGER NOT NULL DEFAULT 0,
 "retryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "deliveredAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "SupportReply_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "SupportReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SupportReply_ticketId_requestKey_key" ON "SupportReply"("ticketId", "requestKey");
CREATE INDEX "SupportReply_ticketId_createdAt_idx" ON "SupportReply"("ticketId", "createdAt");
CREATE INDEX "SupportReply_notificationStatus_retryAt_idx" ON "SupportReply"("notificationStatus", "retryAt");
