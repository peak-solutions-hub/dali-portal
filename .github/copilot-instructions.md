# DALI Portal — Copilot Chat Instructions

These instructions apply to all GitHub Copilot Chat requests in this workspace.

## 1. Project Context & Tech Stack
* **Frameworks:** Next.js 16 (App Router), NestJS (Backend API).
* **Database & Auth:** Supabase (PostgreSQL, Auth, Storage).
* **Styling:** Tailwind CSS, Shadcn/UI components.
* **State Management:** Zustand (Internal System only).

## 2. Architectural "Hard Rules"
* **Public Portal (Citizen-facing):** MUST use **Server-Side Rendering (SSR)** for SEO and performance. Do not use `use client` unless strictly necessary.
* **Internal Management System (Staff-facing):** MUST use **Client-Side Rendering (CSR)** with the `use client` directive for interactivity.
* **Security:** Verify roles (e.g., `OVM_STAFF`, `ADMIN_HEAD`) via server-side checks, not just client-side conditional rendering.
* **Data Privacy:** Avoid exposing personally identifiable information (PII) in client code or logs. Use generic error messages to prevent account enumeration.

## 3. Tooling Strategy (MCP Configuration)
* **Atlassian Server (`atlassian/atlassian-mcp-server`):**
  * **Rule:** IF the request implies a task, feature, or bug fix, ALWAYS fetch the relevant Jira ticket first.
* **Supabase Server (`supabase`):**
  * **Rule:** IF the request involves data, schema, or auth, ALWAYS inspect the live schema/policies first.
* **Figma Server (`figma`):**
  * **Rule:** IF the request implies UI/UX design (e.g., "create a form") OR a Figma URL is present, use `figma` tools to inspect layout.
* **Context7 Server (`context7`):** <-- NEW
  * **Rule:** IF the request requires external documentation (e.g., "how to use Supabase Auth v2"), use `context7` to search official docs.
  
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
