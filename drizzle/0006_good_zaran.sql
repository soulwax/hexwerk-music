ALTER TABLE "hexmusic-stream_user" ADD COLUMN "userHash" varchar(32);--> statement-breakpoint
ALTER TABLE "hexmusic-stream_user" ADD COLUMN "profilePublic" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "hexmusic-stream_user" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "hexmusic-stream_user" ADD CONSTRAINT "hexmusic-stream_user_userHash_unique" UNIQUE("userHash");