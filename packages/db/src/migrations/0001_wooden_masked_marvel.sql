CREATE TABLE `analysis_insights` (
	`id` text PRIMARY KEY NOT NULL,
	`report_id` text NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`severity` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer,
	`evidence_transaction_ids` text,
	`suggested_action` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`report_id`) REFERENCES `analysis_reports`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `analysis_insights_report_idx` ON `analysis_insights` (`report_id`);--> statement-breakpoint
CREATE INDEX `analysis_insights_user_idx` ON `analysis_insights` (`user_id`);--> statement-breakpoint
CREATE TABLE `analysis_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`summary_text` text,
	`cashflow_health_score` integer,
	`cashflow_health_label` text,
	`cashflow_health_reason` text,
	`next_month_suggestions` text,
	`disclaimer` text,
	`raw_ai_response` text,
	`input_summary_json` text,
	`error_message` text,
	`ai_model` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`import_id`) REFERENCES `statement_imports`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `analysis_reports_import_idx` ON `analysis_reports` (`import_id`);--> statement-breakpoint
CREATE INDEX `analysis_reports_user_idx` ON `analysis_reports` (`user_id`);