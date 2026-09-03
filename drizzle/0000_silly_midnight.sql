CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`amount` integer NOT NULL,
	`utr` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_payments_status` ON `payments` (`status`);--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`user_email` text NOT NULL,
	`player_name` text NOT NULL,
	`ff_uid` text NOT NULL,
	`team_name` text DEFAULT 'Solo' NOT NULL,
	`team_members` text DEFAULT '' NOT NULL,
	`payment_status` text DEFAULT 'free' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_registration_tournament_user` ON `registrations` (`tournament_id`,`user_email`);--> statement-breakpoint
CREATE INDEX `idx_registrations_user` ON `registrations` (`user_email`);--> statement-breakpoint
CREATE TABLE `results` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`rank` integer NOT NULL,
	`team_name` text NOT NULL,
	`kills` integer DEFAULT 0 NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`prize` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_results_tournament_rank` ON `results` (`tournament_id`,`rank`);--> statement-breakpoint
CREATE INDEX `idx_results_points` ON `results` (`points`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`paid_mode_enabled` integer DEFAULT false NOT NULL,
	`compliance_reference` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`category` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`admin_reply` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_tickets_status` ON `tickets` (`status`);--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`format` text NOT NULL,
	`game_mode` text NOT NULL,
	`map` text NOT NULL,
	`entry_fee` integer DEFAULT 0 NOT NULL,
	`prize_pool` integer DEFAULT 0 NOT NULL,
	`starts_at` text NOT NULL,
	`slots` integer NOT NULL,
	`filled` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`room_id` text,
	`room_password` text,
	`room_released` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_tournaments_status_starts` ON `tournaments` (`status`,`starts_at`);--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`note` text NOT NULL,
	`reference_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_wallet_user_created` ON `wallet_transactions` (`user_email`,`created_at`);--> statement-breakpoint
CREATE TABLE `withdrawals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`amount` integer NOT NULL,
	`upi_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_withdrawals_status` ON `withdrawals` (`status`);