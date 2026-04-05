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
* **Shadcn Server (`shadcn`):**
  * **Rule:** IF the request involves creating, updating, or generating UI components using the shadcn component set or registry (for example, adding shadcn components to the shared UI package), use `shadcn` tools and ensure the developer first works inside `packages/ui`.

## 4. Skill Usage Strategy (.agents/skills)

This repository includes workspace-local skills under `.agents/skills`.

### How to use skills

1. Match the request to the closest domain skill.
2. Read that skill's `SKILL.md` before implementing.
3. Apply one primary skill first; add a secondary skill only when needed.
4. Keep changes minimal and aligned with project architecture rules in this file.
5. If the request clearly needs another server/tool (Jira, Supabase, Figma, Context7, Shadcn), follow Section 3 rules first.

### Skill routing (quick map)

| Request Type | Primary Skill | Optional Secondary Skill |
|---|---|---|
| Build or style UI pages/components | `frontend-design` | `tailwind-design-system`, `ui-ux-pro-max` |
| UI/UX or accessibility review | `web-design-guidelines` | `accessibility-compliance` |
| Next.js architecture/performance | `next-best-practices` | `vercel-react-best-practices`, `next-cache-components` |
| React component API refactors | `vercel-composition-patterns` | `vercel-react-best-practices` |
| NestJS backend implementation/review | `nestjs-best-practices` | `supabase-postgres-best-practices` |
| Database/query/schema optimization | `supabase-postgres-best-practices` | `monorepo-management` |
| E2E or Playwright test work | `playwright-best-practices` | `accessibility-compliance` |
| SEO audits | `seo-audit` | `programmatic-seo` |
| SEO page generation at scale | `programmatic-seo` | `seo-audit` |
| Monorepo/package/task optimization | `monorepo-management` | `next-best-practices` |
| Shadcn component work | `shadcn` | `tailwind-design-system` |
| Copilot instruction/skill tuning | `agent-customization` | `skill-creator` |

### Default expectations when using skills

- Respect Public Portal SSR and Admin CSR boundaries.
- Enforce server-side authorization and privacy-safe error behavior.
- Reuse shared packages (`@repo/shared`, `@repo/ui`, `@repo/typescript-config`) instead of duplicating logic.
- Prefer existing constants in `packages/shared/src/constants` over inline magic numbers.
  
## Always

- Follow the project SRS language and intent: public transparency + internal operational efficiency for the Iloilo City Vice Mayor’s Office.
- Use the official requirement labeling scheme when writing requirements/acceptance criteria:
  - Functional Requirements: `PS-XX`
- Prioritize correctness, security, privacy, and accessibility (target: WCAG 2.0 AA or higher).
- Keep changes minimal and consistent with existing patterns.

## When asked for a "spec" (requirements/design/tasks)

- Follow `.github/instructions/spec.instructions.md`.

## When asked to implement or change code

- Follow `.github/instructions/implement.instructions.md`.

## When asked for an "implementation plan" for a specific feature

- Do NOT implement.
- Create a plan markdown under the folder `.plans/` (for example: `.plans/<feature-slug>/plan.md`).
