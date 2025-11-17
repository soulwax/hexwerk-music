-- File: drizzle/0005_shocking_korath.sql

ALTER TABLE "hexmusic-stream_favorite" ADD CONSTRAINT "favorite_user_track_unique" UNIQUE("userId","trackId");--> statement-breakpoint
ALTER TABLE "hexmusic-stream_playlist_track" ADD CONSTRAINT "playlist_track_unique" UNIQUE("playlistId","trackId");
