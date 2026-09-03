DROP TABLE `payments`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
DROP TABLE `wallet_transactions`;--> statement-breakpoint
DROP TABLE `withdrawals`;--> statement-breakpoint
CREATE INDEX `idx_registrations_tournament` ON `registrations` (`tournament_id`);--> statement-breakpoint
ALTER TABLE `registrations` DROP COLUMN `payment_status`;--> statement-breakpoint
ALTER TABLE `results` DROP COLUMN `prize`;--> statement-breakpoint
ALTER TABLE `tournaments` DROP COLUMN `entry_fee`;--> statement-breakpoint
ALTER TABLE `tournaments` DROP COLUMN `prize_pool`;