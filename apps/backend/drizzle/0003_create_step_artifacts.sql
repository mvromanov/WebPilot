CREATE TABLE `step_artifacts` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`step_id` text NOT NULL,
	`kind` text NOT NULL,
	`content_path` text NOT NULL,
	`content_hash` text NOT NULL,
	`byte_size` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `step_artifacts_project_step_idx` ON `step_artifacts` (`project_id`,`step_id`);
--> statement-breakpoint
CREATE INDEX `step_artifacts_content_hash_idx` ON `step_artifacts` (`content_hash`);
