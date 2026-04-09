# Role Management Coverage Matrix (RM-1 to RM-8)

Status legend:
- `AUTOMATED` = explicitly asserted in tests.
- `SOURCE-VERIFIED` = behavior exists in source but no direct automated assertion yet.
- `GAP` = not yet covered.

## Flow Coverage

- RM-1: `SOURCE-VERIFIED`
  - `GET /roles` implemented in `apps/backend/src/app/roles/roles.controller.ts` and sorted by role name in `apps/backend/src/app/roles/roles.service.ts`.
  - No dedicated automated test currently asserts all 7 pre-seeded roles are returned.
- RM-2: `SOURCE-VERIFIED`
  - Feature permissions are defined centrally in `packages/shared/src/constants/role-permissions.ts`.
  - No dedicated automated assertion currently validates role-to-feature matrix rendering.
- RM-3: `SOURCE-VERIFIED`
  - Sidebar nav filtering is implemented via `getFilteredNavItems` in `apps/admin/src/config/nav-items.ts` and consumed in `apps/admin/src/components/layout/sidebar.tsx`.
  - No dedicated automated test currently validates nav filtering per role.
- RM-4: `SOURCE-VERIFIED`
  - Permission difference exists in constants (`CALLER_SLIPS`, `VISITOR_BENEFICIARY_HUB` include `vice_mayor` and exclude `admin_staff`).
  - No dedicated automated UI/API test currently validates this scenario directly.
- RM-5: `GAP`
  - No explicit server-side cache for `GET /roles` and no automated cache invalidation assertion tied to role updates.
- RM-6: `SOURCE-VERIFIED`
  - Contract and guard require authentication (`packages/shared/src/contracts/role.contract.ts`, `apps/backend/src/app/auth/guards/roles.guard.ts`).
  - No dedicated automated endpoint test currently asserts `401` for unauthenticated `GET /roles`.
- RM-7: `SOURCE-VERIFIED`
  - `@Roles(...ROLE_PERMISSIONS.ROLES_MANAGEMENT)` restricts `GET /roles` to IT Admin only (`apps/backend/src/app/roles/roles.controller.ts`).
  - No dedicated automated endpoint test currently asserts `403` for non-IT-admin `GET /roles`.
- RM-8: `SOURCE-VERIFIED`
  - Redirect fallback defaults to `/dashboard` for unknown role values (`packages/shared/src/helpers/auth/role-redirect.helper.ts`).
  - Sidebar fallback for missing role is empty nav (`apps/admin/src/config/nav-items.ts`).
  - No direct automated assertion currently covers this edge case.

## Current Error-Code/Status Snapshot

- RM-6 unauthenticated `GET /roles`: expected `401` (`AUTH.AUTHENTICATION_REQUIRED` contract mapping).
- RM-7 non-IT-admin `GET /roles`: expected `403` (`AUTH.INSUFFICIENT_PERMISSIONS` contract mapping).

## Notes

- There are currently no dedicated RM specs under `apps/admin-e2e/tests`.
- RM expectations are currently validated by source inspection rather than automated tests.
