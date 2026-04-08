---
name: dali-resource-implementation
description: Project-specific workflow for implementing or reviewing any DALI resource from shared schemas/contracts to backend and frontend wiring. Use this whenever adding or changing a resource endpoint, contract, DTO mapper, decorators, pipes, transaction boundaries, and admin/public integration.
---

# DALI Resource Implementation

Use this skill as the default blueprint for resource work in this repository.

## When to use

Use this skill when the task includes any of the following:
- Add or modify a resource (documents, caller slips, sessions, inquiries, room booking, user management).
- Add or change oRPC contracts or Zod schemas.
- Implement or review NestJS controllers/services/modules.
- Decide DTO mapper usage, decorators, pipes, and error handling.
- Wire frontend data flow for admin (CSR) or portal (SSR).

## Architecture guardrails

- Public Portal must be SSR-first (Server Components by default).
- Admin/Internal must be CSR (`use client`) with interactive state.
- Backend controllers must use `@Implement` from `@orpc/nest`.
- Shared package is the source of truth for contract/schema/constants.

## Step-by-step resource workflow

### 1) Define shared schemas first

Location:
- `packages/shared/src/schemas/<domain>.schema.ts`

Rules:
- Use naming conventions from project instructions (`Create<Entity>Schema`, `Update<Entity>Schema`, etc.).
- Prefer `.coerce` for query params in GET/list schemas.
- Use shared constants for limits and file policies.

### 2) Define/extend contracts

Location:
- `packages/shared/src/contracts/<domain>.contract.ts`
- `packages/shared/src/contract.ts` root export

Rules:
- Use `oc.route()` with full metadata (`method`, `path`, `summary`, `description`, `tags`).
- Define explicit error map that aligns with backend `AppError` codes.
- Keep route ownership clear (no duplicate ownership across domains).

### 3) Implement backend module

Locations:
- `apps/backend/src/app/<domain>/<domain>.controller.ts`
- `apps/backend/src/app/<domain>/<domain>.service.ts`
- `apps/backend/src/app/<domain>/<domain>.module.ts`

Controller pattern:
- `@Controller()` + `@Implement(contract.domain.operation)`
- `implement(contract.domain.operation).handler(async ({ input, context }) => ...)`

Decorator decision matrix:
- `@Roles(...)`: when endpoint is role-restricted.
- `@Throttle(...)`: mutating/sensitive endpoints.
- `@SkipThrottle(...)`: safe read endpoints that should not be rate-limited.
- `@Implement(...)`: always for oRPC handlers.

### 4) DTO mapper decision tree

Create DTO mappers when any condition is true:
- Prisma data needs transformation (`Decimal` to number, Date to ISO string).
- Response shape differs from DB shape.
- Additional derived fields are needed (display labels, signed URLs, audit actions).

Skip DTO mappers only when:
- Service output shape already exactly matches contract output.
- No transformation/derivation is needed.

Conventions:
- Put mappers in `apps/backend/src/app/<domain>/dtos/`.
- Keep mapping pure and deterministic.

### 5) Pipes decision tree

Prefer Zod schema coercion first.
Use custom Nest pipes only when:
- Transformation is reused across many handlers and not expressible cleanly in Zod.
- You need transport-level behavior before handler invocation.

### 6) Transaction boundaries

Use `TransactionService.run` when:
- Multiple writes must commit atomically.
- Write + audit trail in same operation.
- High-contention transitions (publish/finalize/sequence assignment).

Defaults:
- Keep transaction short.
- No external network/storage calls inside tx body.
- Retry only retryable conflicts (P2034), bounded attempts.

### 7) Error flow standards

Backend:
- Throw `AppError` for business/domain errors.
- Keep messages user-safe (no PII leaks).
- Let exception filters map infrastructure errors.

Frontend:
- Handle tuple `[error, data]` from oRPC.
- Prefer `isDefinedError(error)` and map by `error.code`.
- Provide clear toast/inline messages and recovery action.

### 8) Frontend integration by app type

Admin (CSR):
- Use feature hooks + React Query for server state.
- Use Zustand for cross-component UI state.
- Use `react-hook-form + zod` for forms.

Portal (SSR):
- Fetch in server components where possible.
- Keep client boundaries minimal and intentional.

## Acceptance checklist

- Schemas and contracts updated first, backend follows contract.
- Controller uses `@Implement`; service contains business logic.
- DTO mapper decision is explicit and consistent.
- Transactions used for multi-write invariants.
- Error codes are consistent from backend to frontend handling.
- Admin/Portal rendering model respected (CSR vs SSR).
- Build and targeted tests pass.

## Reference implementations

- Documents flow: `apps/backend/src/app/documents/`
- Session flow: `apps/backend/src/app/session/session-management/`
- Caller slips flow: `apps/backend/src/app/caller-slips/`

## External references

- NestJS custom provider and custom Prisma client injection patterns:
  - https://github.com/notiz-dev/nestjs-prisma/blob/main/docs/src/content/docs/prisma-client-extensions.md
  - https://github.com/notiz-dev/nestjs-prisma/blob/main/docs/src/content/docs/custom-prisma-client-location.md
