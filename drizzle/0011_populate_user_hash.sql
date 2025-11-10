-- Populate userHash for existing users who don't have one
UPDATE "hexmusic-stream_user"
SET "userHash" = SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 16)
WHERE "userHash" IS NULL;
