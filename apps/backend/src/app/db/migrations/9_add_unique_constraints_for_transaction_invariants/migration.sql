-- Preflight check: prevent migration from partially applying on dirty data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "session"
    GROUP BY "session_number"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add sessions_session_number_key: duplicate session_number values exist.';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "document_version"
    GROUP BY "document_id", "version_number"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add document_versions_document_id_version_number_key: duplicate (document_id, version_number) pairs exist.';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "legislative_document"
    GROUP BY "official_number", "series_year"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add legislative_documents_official_number_series_year_key: duplicate (official_number, series_year) pairs exist.';
  END IF;
END $$;

-- Enforce transaction-critical uniqueness invariants
ALTER TABLE "session"
  ADD CONSTRAINT "sessions_session_number_key" UNIQUE ("session_number");

ALTER TABLE "document_version"
  ADD CONSTRAINT "document_versions_document_id_version_number_key"
  UNIQUE ("document_id", "version_number");

ALTER TABLE "legislative_document"
  ADD CONSTRAINT "legislative_documents_official_number_series_year_key"
  UNIQUE ("official_number", "series_year");
