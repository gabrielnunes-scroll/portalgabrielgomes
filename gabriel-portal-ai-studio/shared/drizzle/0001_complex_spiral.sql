CREATE TABLE `identity_aliases` (
	`email` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `identity_aliases_user_id_unique` ON `identity_aliases` (`user_id`);