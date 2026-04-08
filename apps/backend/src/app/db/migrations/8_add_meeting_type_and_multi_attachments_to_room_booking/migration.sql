-- Migration: Add meeting type and multi-attachment support for room bookings
-- Also backfills historical timestamps by +8 hours to align legacy data with PHT intent.

-- 1) Add meeting_type enum
CREATE TYPE "meeting_type" AS ENUM (
  'committee_hearing',
  'consultative_meeting',
  'meeting',
  'others'
);

-- 2) Add meeting fields on room_booking
ALTER TABLE "room_booking"
  ADD COLUMN "meeting_type" "meeting_type" NOT NULL DEFAULT 'meeting',
  ADD COLUMN "meeting_type_others" TEXT;

ALTER TABLE "room_booking"
  ALTER COLUMN "meeting_type" DROP DEFAULT;

-- 3) Create attachment child table (one booking can have many attachments)
CREATE TABLE "room_booking_attachment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "booking_id" UUID NOT NULL,
  "reason" text,
  "path" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "room_booking_attachments_booking_id_fkey"
    FOREIGN KEY ("booking_id")
    REFERENCES "room_booking" ("id")
    ON DELETE CASCADE
);

CREATE INDEX "room_booking_attachments_booking_id_idx"
  ON "room_booking_attachment" ("booking_id");

-- 4) Backfill legacy single attachment values into new attachment table
INSERT INTO "room_booking_attachment" ("booking_id", "path")
SELECT "id", "attachment_url"
FROM "room_booking"
WHERE "attachment_url" IS NOT NULL;

-- 5) Remove legacy single-attachment column
ALTER TABLE "room_booking"
  DROP COLUMN "attachment_url";
