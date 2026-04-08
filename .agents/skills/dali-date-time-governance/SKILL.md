---
name: dali-date-time-governance
description: Date and time implementation rules for DALI, including timezone-safe filtering, backend/frontend boundary handling, and user-facing display standards (Philippine Time policy).
---

# DALI Date and Time Governance

This skill defines timezone-safe date/time behavior across backend and frontend.

## Policy baseline

- Operational timezone for business rules is Philippine Time (`Asia/Manila`, GMT+8), unless a feature explicitly states otherwise.
- Persist full timestamps consistently (typically UTC in database), then convert at boundaries.
- Date-only filters must be converted to explicit start/end-of-day boundaries in policy timezone.

## Backend rules

- Accept date filter input via shared schema (coerced values where needed).
- Convert date-only ranges to timezone-aware boundaries before querying DB.
- Keep conversion logic centralized in helper utilities.
- Do not rely on ambiguous native parsing for `YYYY-MM-DD` without explicit timezone intent.

## Frontend rules

- Date-picker values are calendar dates, not instants; convert explicitly when creating API query params.
- Make timezone assumptions explicit in code and labels where relevant.
- Prefer consistent formatters for display and avoid ad-hoc string slicing.

## Test scenarios (minimum)

- Start/end-of-day filters include expected records in GMT+8.
- Records near midnight boundaries behave correctly.
- Same dataset renders consistently across machines with different local timezones.
- DST-neutral behavior remains stable for non-DST Philippines policy.

## Anti-patterns

- `new Date('YYYY-MM-DD')` without timezone policy handling.
- `toISOString().split('T')[0]` for business date filtering.
- Mixing local machine timezone logic with business timezone logic.

## Recommended utility approach

- Centralize date-range conversion helpers in shared/backend utility modules.
- Centralize display formatting helpers in app utilities.
- Keep API contract inputs deterministic and documented.

## External references

- date-fns-tz timezone conversion docs:
  - https://github.com/marnusw/date-fns-tz/blob/master/README.md
- date-fns timezone context docs:
  - https://github.com/date-fns/date-fns/blob/main/docs/timeZones.md
