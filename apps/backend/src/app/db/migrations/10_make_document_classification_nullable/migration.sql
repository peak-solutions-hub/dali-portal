-- Allow invitation documents to be created without a committee classification.
ALTER TABLE "document"
  ALTER COLUMN "classification" DROP NOT NULL;
