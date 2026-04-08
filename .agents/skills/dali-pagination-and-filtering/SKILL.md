---
name: dali-pagination-and-filtering
description: DALI pagination, filtering, and sorting pattern for backend contracts/services and frontend hooks/stores. Use whenever implementing list endpoints or list UIs with search, tab filters, date ranges, and stable page transitions.
---

# DALI Pagination and Filtering

## When to use

- Implementing or changing list endpoints.
- Building list pages/tables with filters and sorting.
- Fixing pagination jumps, stale list UX, or filter inconsistencies.

## Backend pattern

### Shared schema

- Define list input schema in shared with coercion for query params.
- Include: `page`, `limit`, `sortBy`, `sortOrder`, domain filters.
- Set sane defaults and bounds in schema.

### Service query pattern

- Build `where` from filters in one helper.
- Run `count` and `findMany` together using `Promise.all`.
- Return stable pagination payload:
  - `total`, `page`, `limit`, `totalPages`.

### Sorting

- Restrict `sortBy` to explicit enum values.
- Avoid dynamic arbitrary field sorting from raw input.

## Frontend pattern (Admin)

- Use Zustand for list UI state (filters, sort, pagination).
- Reset `page` to `1` whenever filters or sort change.
- Use React Query with `placeholderData: keepPreviousData` for smoother page changes.

## Date filter boundaries

- Convert date-only UI inputs to explicit boundaries before sending:
  - start of day
  - end of day
- Keep timezone policy explicit and shared (see `dali-date-time-governance`).

## UX requirements

- Filter changes should feel instant and predictable.
- Keep previous data during fetch to prevent table flicker.
- Show clear empty state with recovery action.
- Preserve user context when possible (do not reset unrelated controls).

## Anti-patterns

- Inline ad-hoc filter parsing in multiple files.
- Inconsistent pagination payload shape per endpoint.
- Resetting all list state on minor filter changes.
- Failing to debounce search input where needed.

## External reference

- TanStack Query paginated query guidance:
  - https://github.com/tanstack/query/blob/main/docs/framework/react/guides/paginated-queries.md
