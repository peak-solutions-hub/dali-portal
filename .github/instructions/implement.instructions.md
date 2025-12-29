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
* **Backend (NestJS + oRPC):**
    * **Auth:** Rely on Supabase Auth; never store passwords.
    * **Data Access:** Enforce **Row-Level Security (RLS)** policies in Supabase.
    * **API Contracts:** Use oRPC with `@orpc/contract` for type-safe API definitions.
    * **Controllers:** Use `@Implement` decorator from `@orpc/nest` instead of `@Get`, `@Post`, etc.

## Backend Patterns (oRPC + NestJS)

### Contract-First Development

1. **Schemas** — Define in `packages/shared/src/schemas/<domain>.schema.ts`
   - Entity schemas (full model with all fields)
   - Input schemas (using `.pick()`, `.omit()`, or `.extend()`)
   - Response schemas (what the API returns)

2. **Contracts** — Define in `packages/shared/src/contracts/<domain>.contract.ts`
   - Use `oc.route()` with `method`, `path`, `summary`, `description`, `tags`
   - Export individual contracts + aggregated domain contract
   - Re-export from `packages/shared/src/contract.ts` root router

3. **Implementation** — In `apps/backend/src/app/<domain>/`
   - `<domain>.controller.ts` — Uses `@Implement(contract)` + `implement(contract).handler()`
   - `<domain>.service.ts` — Business logic, injects `DbService`
   - `<domain>.module.ts` — Wires controller + service

### Controller Pattern

```typescript
import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { domainContract } from "@repo/shared";
import { DomainService } from "./domain.service";

@Controller()
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Implement(domainContract.create)
  create() {
    return implement(domainContract.create).handler(async ({ input, context }) => {
      return this.domainService.create(input);
    });
  }
}
```

### Service Pattern

```typescript
import { Injectable } from "@nestjs/common";
import { ORPCError } from "@orpc/nest";
import { DbService } from "@/app/db/db.service";
import type { CreateInputSchema, EntitySchema } from "@repo/shared";
import type { z } from "zod";

@Injectable()
export class DomainService {
  constructor(private readonly db: DbService) {}

  async create(input: z.infer<typeof CreateInputSchema>): Promise<z.infer<typeof EntitySchema>> {
    // Business logic...
    // Use ORPCError for typed errors:
    // throw new ORPCError("NOT_FOUND", { message: "Record not found" });
  }
}
```

### Schema Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Entity | `<Entity>Schema` | `InquiryTicketSchema` |
| Enum | `<Entity><Field>Schema` | `InquiryStatusSchema` |
| Create Input | `Create<Entity>InputSchema` | `CreateInquiryTicketInputSchema` |
| Update Input | `Update<Entity>InputSchema` | `UpdateInquiryStatusInputSchema` |
| Get Input | `Get<Entity>(list/byId)Schema` | `GetInquiryTicketListSchema` |
| Response | `<Action><Entity>ResponseSchema` | `CreateInquiryResponseSchema` |

### Contract Naming Convention

| Type | Path Pattern | Method |
|------|--------------|--------|
| Create (public) | `POST /<domain>` | `create<Entity>` |
| Create (admin) | `POST /admin/<domain>` | `create<Entity>` |
| List | `GET /admin/<domain>` | `list<Entity>s` |
| Get by ID | `GET /admin/<domain>/{id}` | `get<Entity>ById` |
| Update | `PATCH /admin/<domain>/{id}` | `update<Entity>` |
| Delete | `DELETE /admin/<domain>/{id}` | `delete<Entity>` |

## Coding Style & Patterns
* **Naming:** kebab-case for files, PascalCase for component names, camelCase for functions/vars.
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
