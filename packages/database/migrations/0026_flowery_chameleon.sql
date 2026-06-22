CREATE TYPE "public"."agent_domain" AS ENUM('coding', 'customer-support', 'research', 'finance', 'legal', 'general');--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "domain" "agent_domain" DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "config_content" text;--> statement-breakpoint
CREATE INDEX "agents_domain_idx" ON "agents" USING btree ("domain");