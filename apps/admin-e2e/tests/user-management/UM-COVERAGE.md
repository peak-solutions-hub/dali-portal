# User Management Test Coverage (UM-1 to UM-28)

## Backend unit + integration

- UM-1: Covered by `apps/backend/src/app/users/users.service.spec.ts` and `apps/backend/test/users/users.integration-spec.ts` (sorting/ordering behavior).
- UM-5, UM-9, UM-12, UM-16, UM-17: Covered by `users.service.spec.ts` invite and reinvite branches.
- UM-6, UM-11, UM-15, UM-18, UM-28: Covered by `users.service.spec.ts` update behavior and self-demotion guard.
- UM-7, UM-8, UM-26: Covered by `users.service.spec.ts` and `users.integration-spec.ts` deactivate/activate behavior.
- UM-19: Covered by `users.service.spec.ts` via deactivated-account reset protection (`AUTH.DEACTIVATED_ACCOUNT`).
- UM-27: Route-level throttle behavior not yet automated in these two suites.

## Admin E2E

- UM-25: Covered by `apps/admin-e2e/tests/user-management/user-management-auth.spec.ts`.
- UM-24: Covered by `apps/admin-e2e/tests/user-management/user-management-auth.spec.ts` (credential-gated).
- UM-1: Covered by `apps/admin-e2e/tests/user-management/user-management-ui.spec.ts`.
- UM-2: Covered by `apps/admin-e2e/tests/user-management/user-management-ui.spec.ts`.
- UM-3: Covered by `apps/admin-e2e/tests/user-management/user-management-ui.spec.ts`.
- UM-4: Covered by `apps/admin-e2e/tests/user-management/user-management-ui.spec.ts`.
- UM-10: Covered by `apps/admin-e2e/tests/user-management/user-management-ui.spec.ts` (dataset-gated).
- UM-11: Covered by `apps/admin-e2e/tests/user-management/user-management-ui.spec.ts` (no-change update API call check).
- UM-13: Covered by `apps/admin-e2e/tests/user-management/user-management-ui.spec.ts`.
- UM-14: Covered by `apps/admin-e2e/tests/user-management/user-management-ui.spec.ts`.
- UM-15: Covered by `apps/admin-e2e/tests/user-management/user-management-ui.spec.ts`.
- UM-20, UM-22, UM-23: Covered by `apps/admin-e2e/tests/user-management/user-management-ui.spec.ts` (invalid invite submission blocked).
- UM-27: Covered by `apps/admin-e2e/tests/user-management/user-management-rate-limit.spec.ts` (tagged `@rate-limit`).
- UM-5, UM-9: Covered by `apps/admin-e2e/tests/user-management/user-management-api.spec.ts`.
- UM-16: Covered by `apps/admin-e2e/tests/user-management/user-management-api.spec.ts`.
- UM-17: Covered by `apps/admin-e2e/tests/user-management/user-management-api.spec.ts` (credential-gated).
- UM-18: Covered by `apps/admin-e2e/tests/user-management/user-management-api.spec.ts`.
- UM-26: Covered by `apps/admin-e2e/tests/user-management/user-management-api.spec.ts`.
- UM-28: Covered by `apps/admin-e2e/tests/user-management/user-management-api.spec.ts`.

## Auth E2E (combined with User Management)

- AUTH-1: Covered by `apps/admin-e2e/tests/user-management/auth-flows.spec.ts` (it_admin login path).
- AUTH-2: Covered by `apps/admin-e2e/tests/user-management/auth-flows.spec.ts` (forgot-password success state).
- AUTH-6: Covered by `apps/admin-e2e/tests/user-management/auth-flows.spec.ts` (auth pages blocked for signed-in users).
- AUTH-7: Covered by `apps/admin-e2e/tests/user-management/auth-flows.spec.ts` (redirect query honored after sign-in).
- AUTH-8: Covered by `apps/admin-e2e/tests/user-management/auth-flows.spec.ts` (enumeration-safe success state for unknown email).
- AUTH-10: Covered by `apps/admin-e2e/tests/user-management/auth-flows.spec.ts` (role-based redirect mapping).
- AUTH-11: Covered by `apps/admin-e2e/tests/user-management/auth-flows.spec.ts` (invalid credential error behavior).
- AUTH-12: Covered by `apps/admin-e2e/tests/user-management/auth-flows.spec.ts` (empty email validation).
- AUTH-13: Covered by `apps/admin-e2e/tests/user-management/auth-flows.spec.ts` (empty password validation).
- AUTH-14: Covered by `apps/admin-e2e/tests/user-management/auth-flows.spec.ts` (deactivated login, credential-gated).
- AUTH-16: Covered by `apps/admin-e2e/tests/user-management/auth-flows.spec.ts` (expired/no session on set-password).
- AUTH-18: Covered by `apps/admin-e2e/tests/user-management/auth-flows.spec.ts` (missing auth code redirect path).
- AUTH-19: Covered by `apps/admin-e2e/tests/user-management/user-management-rate-limit.spec.ts` (tagged `@rate-limit`).
- AUTH-20: Covered by `apps/admin-e2e/tests/user-management/auth-flows.spec.ts`.

## Remaining UM scenarios to add in next pass

- UM-21: Expired/invalid set-password link flow assertion in E2E.

## Remaining AUTH scenarios to add in next pass

- AUTH-3: Full password-reset link happy path with valid new password and post-reset redirect.
- AUTH-4: Invited-user set-password happy path with status transition assertion.
- AUTH-5: Session token refresh continuity assertion without workflow interruption.
- AUTH-9: Confirm-password mismatch inline validation on active set-password session.
- AUTH-15: Weak password live-criteria assertion with disabled submit and error toast.
- AUTH-17: Deactivated user set-password attempt via recovery link flow.
