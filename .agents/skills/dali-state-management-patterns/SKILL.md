---
name: dali-state-management-patterns
description: DALI state management decision framework for Next.js admin and portal apps using React state, React Query, Zustand, and react-hook-form with clear ownership boundaries.
---

# DALI State Management Patterns

Use this skill to choose the right state container and avoid overlap.

## Decision matrix

Use local component state (`useState`) when:
- State is ephemeral and local to one component subtree.
- No cross-page persistence is needed.

Use React Query when:
- State comes from server and needs caching, refetching, or invalidation.
- You need loading/error status tied to server data.

Use Zustand when:
- UI state is shared across multiple admin components/routes.
- State is not canonical server data but affects list/page behavior (filters, sort, drafts, multi-step UI).

Use `react-hook-form + zod` when:
- Managing form input, validation, and submission state.
- You need deterministic validation and field-level errors.

## Application boundaries

Portal (`apps/portal`):
- SSR-first data fetching in server components.
- Introduce client state only when interactivity requires it.

Admin (`apps/admin`):
- CSR by design for operational dashboards and workflows.
- Prefer feature-scoped Zustand stores for shared UI state.

## Document tracker pattern

- Server data list/detail: React Query hooks.
- Filters/sort/pagination controls: Zustand store.
- Create/edit/upload dialogs: RHF + zod.
- Keep query key construction stable and centralized.

## Store design rules

- One store per domain concern (`document-store`, etc.).
- Include explicit reset actions.
- Avoid storing raw server entities in Zustand if React Query already owns them.

## Anti-patterns

- Duplicating server data in Zustand and React Query simultaneously.
- Mixing form state and global store state without clear ownership.
- Overusing global stores for one-off local UI flags.

## Verification checklist

- Each state variable has one clear owner.
- Query invalidation occurs after mutations.
- Filter/sort changes reset pagination appropriately.
- Dialog/form lifecycle is isolated and testable.
