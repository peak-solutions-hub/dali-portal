-- Make citizen_name nullable (dormant column, no longer written to)
ALTER TABLE "inquiry_ticket" ALTER COLUMN "citizen_name" DROP NOT NULL;

-- Add new citizen contact fields
ALTER TABLE "inquiry_ticket" ADD COLUMN "citizen_first_name" TEXT;
ALTER TABLE "inquiry_ticket" ADD COLUMN "citizen_last_name" TEXT;
ALTER TABLE "inquiry_ticket" ADD COLUMN "citizen_contact_number" TEXT;
ALTER TABLE "inquiry_ticket" ADD COLUMN "citizen_address" TEXT;
