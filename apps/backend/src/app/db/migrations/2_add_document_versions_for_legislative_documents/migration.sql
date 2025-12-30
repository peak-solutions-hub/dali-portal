-- ============================================================================
-- Migration: Add Document Versions for Legislative Documents
-- Description: Create document_version records for all legislative documents
--              pointing to PDF files in Supabase Storage
-- Created: 2024-12-31
-- Environment: Supabase (PostgreSQL with RLS)
-- ============================================================================

-- IMPORTANT: This migration creates document versions that reference PDF files
-- stored in the Supabase Storage bucket named "documents"
-- File path format: "arc42-DALI_Portal.pdf" (just the filename within the bucket)

-- ============================================================================
-- STEP 1: Insert document versions for all 28 legislative documents
-- ============================================================================

-- Note: Using a real user ID from the database
-- uploader_id: '7d0c8315-aa72-4813-ad63-2594c3368a08' (verified existing user)
-- version_number: 1.0 (initial version)
-- file_path: 'arc42-DALI_Portal.pdf' (placeholder PDF in 'documents' bucket)

INSERT INTO "document_version" (
  "document_id",
  "uploader_id",
  "version_number",
  "file_path"
) VALUES
  -- Version 1.0 for all 28 documents
  ('a0000001-0001-4000-8000-000000000001', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000002', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000003', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000004', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000005', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000006', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000007', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000008', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000009', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000010', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000011', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000012', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000013', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000014', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000015', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000016', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000017', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000018', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000019', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000020', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000021', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000022', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000023', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000024', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000025', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000026', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000027', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf'),
  ('a0000001-0001-4000-8000-000000000028', '7d0c8315-aa72-4813-ad63-2594c3368a08', 1.0, 'arc42-DALI_Portal.pdf')
ON CONFLICT (document_id, version_number) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY (optional - run to check data)
-- ============================================================================
-- SELECT 
--   dv.id,
--   d.code_number,
--   d.title,
--   dv.version_number,
--   dv.file_path,
--   dv.created_at
-- FROM document_version dv
-- JOIN document d ON dv.document_id = d.id
-- ORDER BY d.code_number;
