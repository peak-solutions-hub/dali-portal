---
name: dali-spec-instructions
description: How to write requirements, design, and tasks for DALI Portal features.
applyTo: "**"
---

## Spec workflow (always follow)

- Produce specs in three phases: **Requirements → Design → Tasks**.
- Do not jump ahead: confirm the user approves each phase before moving to the next.

## Requirements writing rules

- Write requirements that are testable and unambiguous.
- Use the SRS labeling style:
  - Functional: `FR-XX` / `FR-XX.Y`
  - Non-functional: `NFR-XX` / `NFR-XX.Y`
  - Constraints: `CON-XX` / `CON-XX.Y`
- Prefer EARS-style acceptance criteria:
  - `WHEN <event> THEN <system> SHALL <response>`
  - `IF <condition> THEN <system> SHALL <response>`
  - `WHILE <state> THEN <system> SHALL <invariant>`
- Explicitly call out:
  - - **Roles and permissions:** Use specific User Classes (e.g., `it_admin, admin_staff, ovm_staff, admin_head`)
  - Privacy constraints (avoid account enumeration; minimize PII exposure)
  - Time zone requirements (Philippine Time, GMT+8) when timestamps/scheduling exists
  - Accessibility constraints (WCAG AA)

## Design writing rules
- **Architecture Check:** Explicitly define if the feature belongs in the Public Portal (SSR) or Internal System (CSR).
- **Domain Alignment:** Align DB schema changes with existing Domain Models (Inquiries, Documents, Sessions).
- Keep design tied to requirements; every major design element should map to one or more `FR/NFR/CON`.
- Include only what is needed to implement the feature (avoid gold-plating).
- Include a short "Error Handling" section that defines user-safe errors and logging expectations.

## Tasks writing rules

- Tasks must be executable by a coding agent.
- Tasks must reference specific `FR/NFR/CON` IDs.
- Tasks should be incremental and end with wiring/verification.
