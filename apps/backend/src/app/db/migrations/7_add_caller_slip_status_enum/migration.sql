-- CreateEnum
CREATE TYPE "caller_slip_status" AS ENUM ('pending', 'completed');

-- AlterTable: convert TEXT column to enum type
ALTER TABLE "caller_slip"
  ALTER COLUMN "status" SET DATA TYPE "caller_slip_status"
  USING "status"::"caller_slip_status";

-- Set default value
ALTER TABLE "caller_slip"
  ALTER COLUMN "status" SET DEFAULT 'pending'::"caller_slip_status";
