CREATE TYPE "public"."pitch_status" AS ENUM('intake', 'qa', 'debate', 'verdict', 'complete', 'failed');--> statement-breakpoint
CREATE TABLE "pitch_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anon_id" text NOT NULL,
	"user_id" text,
	"status" "pitch_status" DEFAULT 'intake' NOT NULL,
	"input" jsonb NOT NULL,
	"report" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
