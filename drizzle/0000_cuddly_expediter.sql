CREATE TABLE `ApiKey` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`name` text NOT NULL,
	`prefix` text NOT NULL,
	`secretHash` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`revokedAt` text,
	FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ApiKey_secretHash_unique` ON `ApiKey` (`secretHash`);--> statement-breakpoint
CREATE INDEX `ApiKey_projectId_index` ON `ApiKey` (`projectId`);--> statement-breakpoint
CREATE TABLE `AuditLog` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`action` text NOT NULL,
	`resourceId` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `AuditLog_projectId_createdAt_index` ON `AuditLog` (`projectId`,`createdAt`);--> statement-breakpoint
CREATE TABLE `Business` (
	`id` text PRIMARY KEY NOT NULL,
	`ownerId` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`country` text DEFAULT 'Uzbekistan' NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Business_ownerId_unique` ON `Business` (`ownerId`);--> statement-breakpoint
CREATE TABLE `Membership` (
	`userId` text NOT NULL,
	`projectId` text NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Membership_userId_projectId_id` ON `Membership` (`userId`,`projectId`);--> statement-breakpoint
CREATE TABLE `Project` (
	`id` text PRIMARY KEY NOT NULL,
	`businessId` text NOT NULL,
	`name` text NOT NULL,
	`website` text,
	`description` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `RateLimit` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`resetsAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Session` (
	`id` text PRIMARY KEY NOT NULL,
	`tokenHash` text NOT NULL,
	`userId` text NOT NULL,
	`expiresAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Session_tokenHash_unique` ON `Session` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `Session_userId_index` ON `Session` (`userId`);--> statement-breakpoint
CREATE TABLE `Transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`amountMinor` integer NOT NULL,
	`currency` text DEFAULT 'UZS' NOT NULL,
	`status` text NOT NULL,
	`idempotencyKey` text NOT NULL,
	`requestHash` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Transaction_projectId_idempotencyKey_unique` ON `Transaction` (`projectId`,`idempotencyKey`);--> statement-breakpoint
CREATE INDEX `Transaction_projectId_createdAt_index` ON `Transaction` (`projectId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `Transaction_projectId_status_index` ON `Transaction` (`projectId`,`status`);--> statement-breakpoint
CREATE TABLE `User` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`passwordHash` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);--> statement-breakpoint
CREATE TABLE `WebhookDelivery` (
	`id` text PRIMARY KEY NOT NULL,
	`endpointId` text NOT NULL,
	`transactionId` text NOT NULL,
	`event` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`responseCode` integer,
	`error` text,
	`lastAttemptAt` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`endpointId`) REFERENCES `WebhookEndpoint`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `WebhookDelivery_endpointId_transactionId_unique` ON `WebhookDelivery` (`endpointId`,`transactionId`);--> statement-breakpoint
CREATE TABLE `WebhookEndpoint` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`url` text NOT NULL,
	`events` text NOT NULL,
	`secretEncrypted` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`disabledAt` text,
	FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `WebhookEndpoint_projectId_index` ON `WebhookEndpoint` (`projectId`);