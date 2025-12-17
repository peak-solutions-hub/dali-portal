---
name: dali-implement-instructions
description: Team workflow, tone, and planning conventions for Copilot Chat.
applyTo: "**"
---

## Tech Stack Guidelines
* **Frontend (Next.js):**
    * **Public Pages:** Default to Server Components. Fetch data directly in the component.
    * **Internal Dashboard:** Use `use client`. Manage complex local state with **Zustand**.
    * **Forms:** Use `react-hook-form` + `zod` for validation.
* **Backend (NestJS/Supabase):**
    * **Auth:** Rely on Supabase Auth; never store passwords.
    * **Data Access:** Enforce **Row-Level Security (RLS)** policies in Supabase.

## Coding Style & Patterns
* **Naming:** PascalCase for Components, camelCase for functions/vars.
* **Folder Structure:** Follow `@/src/app`, `@/src/components`, `@/src/lib`.

## Collaboration + tone

- Be direct, concise, and practical.
- Prefer high-signal bullets over long prose.
- State assumptions briefly, then proceed unless blocked.

## How to work in this repo

- Before editing, scan for existing patterns in the repo and follow them.
- Keep edits minimal and scoped to the request.
- Avoid introducing new libraries unless clearly necessary.

## Security, privacy, and compliance defaults

- Treat citizen data (name, email, contact number, address, beneficiary info) as sensitive.
- Do not leak whether an inquiry record exists: use generic errors ("Record not found").
- Prefer server-side enforcement for authorization; never rely only on client checks.
- Log audit trails as immutable append-only events when a feature calls for accountability.

## Accessibility defaults

- Follow WCAG 2.0 AA or higher.
- Use semantic HTML and accessible form labels.

## Planning convention (gitignored)

- If the user asks for an **implementation plan** for a specific feature:
  - Do NOT implement.
  - Write a plan markdown to `.plans/<feature-slug>/plan.md` (gitignored).
  - Use `.github/templates/feature-plan.template.md`.
  - Ensure strict requirements and edge cases are justified by stated goals.
  - Include acceptance criteria; do NOT include a test strategy unless explicitly requested.
