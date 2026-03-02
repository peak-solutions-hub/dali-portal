-- Migration: Add conference_room enum and new columns to room_booking
-- Adds `room` (ConferenceRoom enum, NOT NULL) and `attachment_url` (nullable text)

-- Create the conference_room enum type
CREATE TYPE "conference_room" AS ENUM ('room_a', 'room_b');

-- Add room column (backfill existing rows with room_a, then keep the default)
ALTER TABLE "room_booking" ADD COLUMN "room" "conference_room" NOT NULL DEFAULT 'room_a';

-- Remove the default after backfill so future inserts must supply an explicit value
ALTER TABLE "room_booking" ALTER COLUMN "room" DROP DEFAULT;

-- Add nullable attachment_url column
ALTER TABLE "room_booking" ADD COLUMN "attachment_url" TEXT;
