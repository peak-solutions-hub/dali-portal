---
name: dali-error-handling-flow
description: End-to-end DALI error handling from backend AppError and exception filters to frontend oRPC tuple handling and UX-safe messaging. Use whenever implementing, reviewing, or debugging backend-to-frontend error flow.
---

# DALI Error Handling Flow

Use this skill to keep error behavior consistent, typed, and user-safe across the stack.

## When to use

- New endpoint implementation.
- Refactoring service/controller error behavior.
- Frontend error toast/message cleanup.
- Debugging mismatched backend and frontend errors.

## Backend error layers

### Layer 1: Business/domain errors

- Throw `AppError` using predefined codes from shared constants.
- Keep messages generic for privacy and anti-enumeration.
- Include `data` only when safe and necessary.

### Layer 2: Framework/infrastructure mapping

- Let global exception filters handle Prisma/framework exceptions.
- Avoid re-wrapping known framework exceptions unless required.

### Layer 3: Contract error surface

- Ensure contract `errors` map includes expected domain error variants.
- Keep contract and service error behavior aligned.

## Controller/service responsibilities

Controller:
- Input/output and auth/decorator orchestration.
- No heavy business logic.

Service:
- Business validation and invariant checks.
- Domain-level `AppError` decisions.

## Frontend handling pattern

oRPC call returns tuple `[error, data, isDefined]`.

Pattern:
- If no error -> continue.
- If `isDefinedError(err)` on the tuple error value -> branch by `err.code` and show user-safe action-oriented copy.
- Else -> fallback generic error copy.

### Strict TypeScript rule for catch blocks

- Do not call `isDefinedError(error)` inside `catch (error)` where `error` is `unknown`.
- In `catch`, extract messages with an unknown-safe guard (`error instanceof Error` or a `{ message?: unknown }` check).
- Prefer handling typed oRPC errors at the tuple site (`const [err] = await api...`) before deciding to throw.

## Message design requirements

- Never expose PII or internal IDs in user-facing errors.
- Always include recovery guidance where possible.
- Differentiate validation, permission, and server failures.

## Common anti-patterns

- Catch-and-ignore errors in dialogs/actions.
- Using raw exception messages directly in UI.
- Calling `isDefinedError(error)` on `catch (error)` unknown values in strict TS code.
- Throwing plain `Error` for known domain failures.
- Contract `errors` map not matching actual thrown codes.

## Verification checklist

- Every mutating endpoint has expected typed error codes.
- Frontend actions use `isDefinedError` on tuple `err` values where relevant.
- `catch` blocks use unknown-safe fallback extraction.
- Generic fallback message exists.
- No account/record enumeration leakage.
- Logs retain technical detail; UI shows safe detail.

## External references

- TanStack Query error-handling patterns:
  - https://github.com/tanstack/query/blob/main/docs/framework/react/guides/query-functions.md
  - https://github.com/tanstack/query/blob/main/docs/framework/react/reference/useMutation.md
