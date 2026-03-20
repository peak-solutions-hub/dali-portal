-- Make citizen_email nullable to properly support inquiries without an email address.
-- Empty strings previously stored as a workaround are normalised to NULL.
ALTER TABLE "inquiry_ticket" ALTER COLUMN "citizen_email" DROP NOT NULL;

UPDATE "inquiry_ticket"
SET "citizen_email" = NULL
WHERE "citizen_email" = '';
