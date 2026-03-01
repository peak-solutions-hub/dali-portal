-- Add remarks column to document_audit table
ALTER TABLE "document_audit" ADD COLUMN IF NOT EXISTS "remarks" TEXT;
