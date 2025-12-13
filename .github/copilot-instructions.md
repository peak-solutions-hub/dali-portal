# DALI Portal — Copilot Chat Instructions

These instructions apply to all GitHub Copilot Chat requests in this workspace.

## Always

- Follow the project SRS language and intent: public transparency + internal operational efficiency for the Iloilo City Vice Mayor’s Office.
- Use the official requirement labeling scheme when writing requirements/acceptance criteria:
  - Functional Requirements: `FR-XX`
  - Non-functional Requirements: `NFR-XX`
  - Constraints: `CON-XX`
- Prioritize correctness, security, privacy, and accessibility (target: WCAG 2.0 AA or higher).
- Keep changes minimal and consistent with existing patterns.

## When asked for a "spec" (requirements/design/tasks)

- Follow `.github/instructions/spec.instructions.md`.

## When asked to implement or change code

- Follow `.github/instructions/implement.instructions.md`.

## When asked for an "implementation plan" for a specific feature

- Do NOT implement.
- Create a plan markdown under the folder `.plans/` (for example: `.plans/<feature-slug>/plan.md`).
- Use the strict template in `.github/templates/feature-plan.template.md`.
