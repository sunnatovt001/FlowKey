CREATE TABLE `SupportBotState` (
	`id` text PRIMARY KEY NOT NULL,
	`offset` integer DEFAULT 0 NOT NULL,
	`leaseOwner` text,
	`leaseUntil` text
);
--> statement-breakpoint
CREATE TABLE `SupportTicket` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`requestKey` text NOT NULL,
	`summary` text NOT NULL,
	`diagnostics` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`retryAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deliveredAt` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `SupportTicket_requestKey_unique` ON `SupportTicket` (`requestKey`);--> statement-breakpoint
CREATE INDEX `SupportTicket_status_retryAt_idx` ON `SupportTicket` (`status`,`retryAt`);--> statement-breakpoint
CREATE INDEX `SupportTicket_userId_createdAt_idx` ON `SupportTicket` (`userId`,`createdAt`);--> statement-breakpoint
CREATE TABLE `TelegramConnection` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`chatId` text NOT NULL,
	`linkedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `TelegramConnection_userId_unique` ON `TelegramConnection` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `TelegramConnection_chatId_unique` ON `TelegramConnection` (`chatId`);--> statement-breakpoint
CREATE TABLE `TelegramLink` (
	`userId` text PRIMARY KEY NOT NULL,
	`codeHash` text NOT NULL,
	`expiresAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `TelegramLink_codeHash_unique` ON `TelegramLink` (`codeHash`);--> statement-breakpoint
CREATE TABLE `TelegramMessage` (
	`id` text PRIMARY KEY NOT NULL,
	`connectionId` text NOT NULL,
	`externalId` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`connectionId`) REFERENCES `TelegramConnection`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `TelegramMessage_connectionId_externalId_key` ON `TelegramMessage` (`connectionId`,`externalId`);--> statement-breakpoint
CREATE INDEX `TelegramMessage_connectionId_createdAt_idx` ON `TelegramMessage` (`connectionId`,`createdAt`);