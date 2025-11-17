-- File: drizzle/0004_bizarre_violations.sql

ALTER TABLE "hexmusic-stream_user_preferences" ALTER COLUMN "equalizerPreset" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "hexmusic-stream_user_preferences" ALTER COLUMN "equalizerPreset" SET DEFAULT 'Flat';--> statement-breakpoint
ALTER TABLE "hexmusic-stream_user_preferences" ALTER COLUMN "equalizerPreset" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hexmusic-stream_user_preferences" ALTER COLUMN "equalizerBands" SET DEFAULT '[]'::jsonb;
