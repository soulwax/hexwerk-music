-- File: drizzle/0010_nostalgic_human_cannonball.sql

ALTER TABLE "hexmusic-stream_user_preferences" ADD COLUMN "equalizerPanelOpen" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "hexmusic-stream_user_preferences" ADD COLUMN "queuePanelOpen" boolean DEFAULT false NOT NULL;
