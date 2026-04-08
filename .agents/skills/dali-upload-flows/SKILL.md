---
name: dali-upload-flows
description: Standard upload implementation for DALI (signed URL + storage upload + finalize API). Use whenever implementing or reviewing file uploads in admin or portal, including validation, cleanup, UX feedback, and backend finalization.
---

# DALI Upload Flows

Use this skill for every upload flow in this project.

## When to use

- New file upload endpoints.
- Version uploads, attachment uploads, agenda/document uploads.
- Upload retry/failure handling.
- Upload UX review (feedback, progress, click minimization).

## Canonical 3-step flow

1. Request signed upload URL from backend.
2. Upload file to storage using signed URL.
3. Finalize by calling domain API with uploaded path.

Examples:
- Document create: `createUploadUrl` -> PUT -> `documents.create`
- New version: `createUploadUrl` -> PUT -> `documents.createVersion`

## Backend requirements

- Validate content type and size in schema before returning signed URL.
- Use shared limits (`FILE_SIZE_LIMITS`, upload presets) from `@repo/shared`.
- Keep storage network operations outside DB transactions.
- Finalize API must validate path ownership and expected document/entity relationship.

## Frontend requirements

- Validate file type/size before network calls.
- Disable submit while upload/finalize is in progress.
- Show explicit statuses: selecting, uploading, finalizing, success, failed.
- Use typed oRPC error handling (`isDefinedError`) for user-safe messaging.

## Failure-handling policy

If step 2 fails:
- Show upload failure and keep dialog open for retry.

If step 3 fails after successful upload:
- Show finalize failure.
- Trigger cleanup action when available (delete orphaned uploaded object) or mark for async cleanup job.
- Keep behavior documented per feature to avoid silent orphan accumulation.

## Security and privacy

- Never trust client-provided file metadata alone.
- Never expose raw storage internals in user-visible errors.
- Do not leak sensitive path details in UI or logs.

## Tests to add for new upload flows

- Invalid file type/size rejected before upload.
- Signed URL failure path.
- Storage PUT failure path.
- Finalize API conflict/failure path.
- Success path with expected DB record and retrievable file link.

## References

- DALI examples in `apps/admin/src/components/document-tracker/`.
- DALI examples in `apps/backend/src/app/documents/documents.service.ts`.
- Web interface upload feedback guidance:
  - https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
