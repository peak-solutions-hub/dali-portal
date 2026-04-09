# Auth Coverage Matrix (AUTH-1 to AUTH-20)

Status legend:
- `AUTOMATED` = explicitly asserted in tests.
- `SOURCE-VERIFIED` = behavior exists in source but no direct automated assertion yet.
- `GAP` = not yet covered.

## Flow Coverage

- AUTH-1: `AUTOMATED` (`apps/admin-e2e/tests/flows/auth-flow.spec.ts`)
- AUTH-2: `AUTOMATED` (`apps/admin-e2e/tests/flows/auth-flow.spec.ts`)
- AUTH-3: `GAP` (no end-to-end reset-link happy path automation yet)
- AUTH-4: `GAP` (no full invited-user activation happy-path automation yet)
- AUTH-5: `SOURCE-VERIFIED` (token refresh handling implemented in `apps/admin/src/contexts/auth-context.tsx` on `TOKEN_REFRESHED`)
- AUTH-6: `AUTOMATED` (`apps/admin-e2e/tests/flows/auth-flow.spec.ts`)
- AUTH-7: `AUTOMATED` (`apps/admin-e2e/tests/flows/auth-flow.spec.ts`)
- AUTH-8: `AUTOMATED` (`apps/admin-e2e/tests/flows/auth-flow.spec.ts`)
- AUTH-9: `GAP` (confirm password mismatch not explicitly automated in E2E)
- AUTH-10: `AUTOMATED` (`apps/admin-e2e/tests/flows/auth-flow.spec.ts`)
- AUTH-11: `AUTOMATED` (`apps/admin-e2e/tests/flows/auth-flow.spec.ts`)
- AUTH-12: `AUTOMATED` (`apps/admin-e2e/tests/flows/auth-flow.spec.ts`)
- AUTH-13: `AUTOMATED` (`apps/admin-e2e/tests/flows/auth-flow.spec.ts`)
- AUTH-14: `AUTOMATED` (`apps/admin-e2e/tests/flows/auth-flow.spec.ts`)
- AUTH-15: `GAP` (live password criteria + disabled submit path not explicitly automated)
- AUTH-16: `AUTOMATED` (`apps/admin-e2e/tests/flows/auth-flow.spec.ts`)
- AUTH-17: `GAP` (deactivated recovery-link flow not explicitly automated)
- AUTH-18: `AUTOMATED` (`apps/admin-e2e/tests/flows/auth-flow.spec.ts`)
- AUTH-19: `SOURCE-VERIFIED` (`apps/backend/src/app/users/users.controller.ts`, `@Throttle({ default: { limit: 3, ttl: 60000 } })`; tracked pending in `apps/admin-e2e/tests/flows/auth-flow.spec.ts`)
- AUTH-20: `AUTOMATED` (`apps/admin-e2e/tests/flows/auth-flow.spec.ts`)

## Current Behavior Snapshot (Post-Overhaul)

- Login success toast text in current app logic: `Login successful` (lowercase `s`) from `apps/admin/src/contexts/auth-context.tsx`.
- Deactivated login/sign-in handling uses shared message constant `DEACTIVATED_MESSAGE`:
  `Your account has been deactivated. Please contact a system administrator.`
- Forgot-password endpoint behavior is enumeration-safe:
  unknown emails still return success UX (`Check Your Email`) and do not reveal account existence.
- Forgot-password rate limit in current controller:
  `POST /users/request-password-reset` is throttled at `3` requests per minute (`apps/backend/src/app/users/users.controller.ts`).
- Set-password page session guard currently redirects to `/login` with error toast when no/invalid session is detected.

## Current Error-Code/Status Snapshot

- Invalid login credentials: surfaced from Supabase auth provider message (UI toast), user stays on `/login`.
- AUTH deactivated account (backend/shared): `AUTH.DEACTIVATED_ACCOUNT` (`401`).
- Rate limit: `429` with `Too many requests. Please try again later.`
- Missing/invalid auth callback code: redirect to `/login` with query `error=auth_code_error` and failure message.

## Notes

- This matrix reflects what is implemented now in source and automated tests, even if earlier acceptance text differs.
- Set-password happy-path scenarios (AUTH-3/AUTH-4) remain the highest-value automation gaps.
