CREATE TABLE `CheckoutSession` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`linkId` text,
	`title` text NOT NULL,
	`amountMinor` integer NOT NULL,
	`currency` text DEFAULT 'UZS' NOT NULL,
	`requestKey` text NOT NULL,
	`requestHash` text NOT NULL,
	`result` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`expiresAt` text NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`linkId`) REFERENCES `PaymentLink`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `CheckoutSession_projectId_requestKey_key` ON `CheckoutSession` (`projectId`,`requestKey`);--> statement-breakpoint
CREATE INDEX `CheckoutSession_projectId_createdAt_idx` ON `CheckoutSession` (`projectId`,`createdAt`);--> statement-breakpoint
CREATE TABLE `PaymentLink` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`title` text NOT NULL,
	`amountMinor` integer NOT NULL,
	`currency` text DEFAULT 'UZS' NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`disabledAt` text,
	FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `PaymentLink_projectId_createdAt_idx` ON `PaymentLink` (`projectId`,`createdAt`);--> statement-breakpoint
ALTER TABLE `Project` ADD `archivedAt` text;