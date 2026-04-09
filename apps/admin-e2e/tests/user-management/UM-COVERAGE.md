# User Management Coverage Matrix (UM-1 to UM-28)

Status legend:
- `AUTOMATED` = explicitly asserted in tests.
- `SOURCE-VERIFIED` = behavior exists in source but no direct automated assertion yet.
- `GAP` = not yet covered.

## Flow Coverage

- UM-1: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`, `apps/backend/src/app/users/users.service.spec.ts`)
- UM-2: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`)
- UM-3: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`)
- UM-4: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`)
- UM-5: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`, `apps/backend/src/app/users/users.service.spec.ts`)
- UM-6: `SOURCE-VERIFIED` (`apps/backend/src/app/users/users.service.spec.ts`)
- UM-7: `SOURCE-VERIFIED` (`apps/backend/src/app/users/users.service.spec.ts`)
- UM-8: `SOURCE-VERIFIED` (`apps/backend/src/app/users/users.service.spec.ts`)
- UM-9: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`, `apps/backend/src/app/users/users.service.spec.ts`)
- UM-10: `AUTOMATED` (dataset-gated; `apps/admin-e2e/tests/flows/um-flow.spec.ts`)
- UM-11: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`, `apps/backend/src/app/users/users.service.spec.ts`)
- UM-12: `SOURCE-VERIFIED` (`apps/backend/src/app/users/users.service.spec.ts`)
- UM-13: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`)
- UM-14: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`)
- UM-15: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts` + update dialog email disabled)
- UM-16: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`)
- UM-17: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`)
- UM-18: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`, `apps/backend/src/app/users/users.service.spec.ts`)
- UM-19: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`, `apps/backend/src/app/users/users.service.spec.ts`)
- UM-20: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`)
- UM-21: `GAP` (no direct E2E assertion under UM module)
- UM-22: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`)
- UM-23: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`)
- UM-24: `AUTOMATED` (route protection behavior in E2E; `apps/admin-e2e/tests/flows/um-flow.spec.ts`)
- UM-25: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`)
- UM-26: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`)
- UM-27: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`)
- UM-28: `AUTOMATED` (`apps/admin-e2e/tests/flows/um-flow.spec.ts`)

## Current Error-Code/Status Snapshot (Post-Overhaul)

- UM-16 active email invite conflict: `409` + code containing `EMAIL_ALREADY_EXISTS` (`USER.EMAIL_ALREADY_EXISTS` in shared constants).
- UM-17 deactivated email invite: `400` + code containing `DEACTIVATED_SUGGEST_REACTIVATION` (`USER.DEACTIVATED_SUGGEST_REACTIVATION`).
- UM-18 self-demotion: `403` + code containing `SELF_DEMOTION` (`USER.SELF_DEMOTION`).
- UM-26 activate already-active user: `400` + code containing `ALREADY_ACTIVE` (`USER.ALREADY_ACTIVE`).
- UM-27 invite throttle: `429` + message `Too many requests. Please try again later.`
- UM-28 missing user update: `404` + code containing `NOT_FOUND` (`USER.NOT_FOUND`).

## Notes

- This file tracks current behavior in code/tests, not historical expected values from older test plans.
- AUTH and RM are tracked separately in `AUTH-COVERAGE.md` and `RM-COVERAGE.md`.
