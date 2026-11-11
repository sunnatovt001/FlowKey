ALTER TABLE "User" ADD COLUMN "tourSeenAt" TIMESTAMP(3);
-- Existing accounts have already had access to the original welcome guide.
UPDATE "User" SET "tourSeenAt" = CURRENT_TIMESTAMP WHERE "tourSeenAt" IS NULL;
