CREATE TABLE "PaymentEvent" ("id" TEXT PRIMARY KEY, "transactionId" TEXT NOT NULL UNIQUE, "type" TEXT NOT NULL,
"payload" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "PaymentEvent_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE);
ALTER TABLE "WebhookDelivery" ADD COLUMN "eventId" TEXT,
ADD CONSTRAINT "WebhookDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "PaymentEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
