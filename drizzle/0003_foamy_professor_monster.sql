ALTER TABLE "pitch_sessions" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "pitch_sessions" ADD CONSTRAINT "pitch_sessions_share_token_unique" UNIQUE("share_token");