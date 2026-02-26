ALTER TABLE "webdev_responses" ADD COLUMN "snapshot_id" text;--> statement-breakpoint
ALTER TABLE "webdev_responses" ADD COLUMN "snapshot_expires_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "webdev_responses_sandbox_id_idx" ON "webdev_responses" USING btree ("sandbox_id");--> statement-breakpoint
CREATE INDEX "webdev_responses_snapshot_id_idx" ON "webdev_responses" USING btree ("snapshot_id");