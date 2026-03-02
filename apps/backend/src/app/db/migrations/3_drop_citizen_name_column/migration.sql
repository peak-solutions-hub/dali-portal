-- Delete rows that do not have the new first/last name fields populated
DELETE FROM "inquiry_ticket"
WHERE "citizen_first_name" IS NULL OR "citizen_last_name" IS NULL;

-- Drop the legacy citizen_name column
ALTER TABLE "inquiry_ticket" DROP COLUMN "citizen_name";
