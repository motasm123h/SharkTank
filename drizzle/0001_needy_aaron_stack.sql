ALTER TABLE "pitch_sessions" ADD COLUMN "scenario_id" text;--> statement-breakpoint
CREATE INDEX "pitch_sessions_anon_id_idx" ON "pitch_sessions" USING btree ("anon_id");