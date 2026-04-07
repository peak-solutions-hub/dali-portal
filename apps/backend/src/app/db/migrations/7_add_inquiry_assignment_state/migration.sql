-- Migration: Add assignment state fields to inquiry_ticket

-- Create assignment status enum
CREATE TYPE "inquiry_assignment_status" AS ENUM ('pending', 'confirmed');

-- Add assignment state columns
ALTER TABLE "inquiry_ticket"
	ADD COLUMN "assignment_status" "inquiry_assignment_status" NOT NULL DEFAULT 'confirmed',
	ADD COLUMN "assignment_requested_by" UUID,
	ADD COLUMN "pending_reassignment_to" UUID;

-- Add foreign keys for assignment tracking
ALTER TABLE "inquiry_ticket"
	ADD CONSTRAINT "inquiry_ticket_assignment_requested_by_fkey"
		FOREIGN KEY ("assignment_requested_by") REFERENCES "user"("id"),
	ADD CONSTRAINT "inquiry_ticket_pending_reassignment_to_fkey"
		FOREIGN KEY ("pending_reassignment_to") REFERENCES "user"("id");
