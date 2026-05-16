CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `bank_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bank_code` text NOT NULL,
	`account_mask` text,
	`account_name` text,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bank_accounts_user_idx` ON `bank_accounts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `bank_accounts_user_bank_account_idx` ON `bank_accounts` (`user_id`,`bank_code`,`account_mask`);--> statement-breakpoint
CREATE TABLE `raw_transaction_rows` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`user_id` text NOT NULL,
	`page_number` integer,
	`row_number` integer NOT NULL,
	`raw_text` text NOT NULL,
	`parsed_json` text,
	`warning_code` text,
	`confidence` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`import_id`) REFERENCES `statement_imports`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `raw_transaction_rows_import_idx` ON `raw_transaction_rows` (`import_id`);--> statement-breakpoint
CREATE TABLE `statement_files` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`user_id` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`storage_key` text NOT NULL,
	`page_count` integer,
	`is_encrypted` integer DEFAULT false NOT NULL,
	`has_text_layer` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`import_id`) REFERENCES `statement_imports`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `statement_files_import_idx` ON `statement_files` (`import_id`);--> statement-breakpoint
CREATE INDEX `statement_files_user_hash_idx` ON `statement_files` (`user_id`,`sha256`);--> statement-breakpoint
CREATE TABLE `statement_imports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bank_account_id` text,
	`bank_code` text DEFAULT 'bca' NOT NULL,
	`period_start` integer,
	`period_end` integer,
	`status` text DEFAULT 'uploaded' NOT NULL,
	`parser_mode` text,
	`parser_version` text DEFAULT 'bca-parser-v1' NOT NULL,
	`import_confidence` integer DEFAULT 0 NOT NULL,
	`total_transactions` integer DEFAULT 0 NOT NULL,
	`total_debit_cents` integer DEFAULT 0 NOT NULL,
	`total_credit_cents` integer DEFAULT 0 NOT NULL,
	`opening_balance_cents` integer,
	`closing_balance_cents` integer,
	`error_code` text,
	`error_message` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `statement_imports_user_idx` ON `statement_imports` (`user_id`);--> statement-breakpoint
CREATE INDEX `statement_imports_user_status_idx` ON `statement_imports` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`user_id` text NOT NULL,
	`bank_account_id` text,
	`bank_code` text DEFAULT 'bca' NOT NULL,
	`transaction_date` integer NOT NULL,
	`posting_date` integer,
	`description_original` text NOT NULL,
	`description_clean` text NOT NULL,
	`merchant_name` text,
	`transaction_type` text DEFAULT 'unknown' NOT NULL,
	`direction` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`balance_after_cents` integer,
	`category_name` text DEFAULT 'Other' NOT NULL,
	`confidence` integer DEFAULT 0 NOT NULL,
	`source_page` integer,
	`source_row` integer,
	`duplicate_hash` text NOT NULL,
	`user_reviewed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`import_id`) REFERENCES `statement_imports`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `transactions_import_idx` ON `transactions` (`import_id`);--> statement-breakpoint
CREATE INDEX `transactions_user_date_idx` ON `transactions` (`user_id`,`transaction_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_import_duplicate_hash_idx` ON `transactions` (`import_id`,`duplicate_hash`);