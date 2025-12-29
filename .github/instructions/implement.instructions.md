---
name: dali-implement-instructions
description: Comprehensive team workflow, tech stack, and conventions for the Dali Portal project.
applyTo: "**"
---

## Tech Stack Guidelines

### Frontend (Next.js)
* **Public Pages (Portal):** Default to Server Components. Fetch data directly in the component using the oRPC client.
* **Internal Dashboard (Admin):** Use `use client` for interactive components. Manage complex local state with **Zustand**.
* **Forms:** Use `react-hook-form` + `zod` for validation.
* **UI Components:** Shared components live in `packages/ui`. Use Shadcn/UI for base components.

### Backend (NestJS + oRPC)
* **Auth:** Rely on Supabase Auth; never store passwords.
* **Data Access:** Enforce **Row-Level Security (RLS)** policies in Supabase.
* **API Contracts:** Use oRPC with `@orpc/contract` for type-safe API definitions.
* **Controllers:** Use `@Implement` decorator from `@orpc/nest` instead of `@Get`, `@Post`, etc.

### Shared Packages
* **`@repo/shared`:** Contains all schemas, contracts, and shared utilities
* **`@repo/ui`:** Shared UI components, hooks, and styles
* **`@repo/typescript-config`:** Shared TypeScript configurations

---

## Backend Patterns (oRPC + NestJS)

### Contract-First Development

#### 1. Schemas
Define in `packages/shared/src/schemas/<domain>.schema.ts`:
- **Entity schemas** — Full model with all fields
- **Input/Output schemas** — Using `.pick()`, `.omit()`, or `.extend()`
- Only add suffixes when the schema represents a specific input/output variant

**Schema Naming Convention:**

| Type | Pattern | Example |
|------|---------|---------|
| Entity | `<Entity>Schema` | `InquiryTicketSchema` |
| Enum | `<Entity><Field>Schema` | `InquiryStatusSchema` |
| Create | `Create<Entity>Schema` | `CreateInquiryTicketSchema` |
| Update | `Update<Entity>Schema` | `UpdateInquiryStatusSchema` |
| Get/List | `Get<Entity>(List/ById)Schema` | `GetInquiryTicketListSchema` |
| Response (only when different from entity) | `<Action><Entity>ResponseSchema` | `CreateInquiryResponseSchema` |

**Type Naming Convention** (when inferring from schemas):

```typescript
// Schema (no suffix unless it's a specific variant)
export const CreateInquiryTicketSchema = z.object({ ... })
export const InquiryTicketSchema = z.object({ ... })

// Inferred types (always use Input/Response suffix)
export type CreateInquiryTicketInput = z.infer<typeof CreateInquiryTicketSchema>
export type InquiryTicketResponse = z.infer<typeof InquiryTicketSchema>
```

**Type coercion for GET requests:** Use `.coerce` on numeric/date fields in list schemas:

```typescript
export const GetInquiryTicketListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20), // ← required for GET params
  cursor: z.uuid().optional(),
})
```

#### 2. Contracts
Define in `packages/shared/src/contracts/<domain>.contract.ts`:
- Use `oc.route()` with `method`, `path`, `summary`, `description`, `tags`
- Export individual contracts + aggregated domain contract
- Re-export from `packages/shared/src/contract.ts` root router

**Contract Naming Convention:**

| Type | Path Pattern | Method |
|------|--------------|--------|
| Create (public) | `POST /<domain>` | `create<Entity>` |
| Create (admin) | `POST /admin/<domain>` | `create<Entity>` |
| List | `GET /admin/<domain>` | `list<Entity>s` |
| Get by ID | `GET /admin/<domain>/{id}` | `get<Entity>ById` |
| Update | `PATCH /admin/<domain>/{id}` | `update<Entity>` |
| Delete | `DELETE /admin/<domain>/{id}` | `delete<Entity>` |

#### 3. Implementation
In `apps/backend/src/app/<domain>/`:
- `<domain>.controller.ts` — Uses `@Implement(contract)` + `implement(contract).handler()`
- `<domain>.service.ts` — Business logic, injects `DbService`
- `<domain>.module.ts` — Wires controller + service

### Controller Pattern

```typescript
import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@repo/shared";
import { DomainService } from "./domain.service";

@Controller()
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Implement(contract.domain.create)
  create() {
    return implement(contract.domain.create).handler(async ({ input, context }) => {
      return this.domainService.create(input);
    });
  }

  @Implement(contract.domain.getById)
  getById() {
    return implement(contract.domain.getById).handler(async ({ input, context }) => {
      return this.domainService.getById(input.id);
    });
  }
}
```

### Service Pattern

```typescript
import { Injectable } from "@nestjs/common";
import { ORPCError } from "@orpc/nest";
import { DbService } from "@/app/db/db.service";
import type { CreateInquiryTicketInput, InquiryTicketResponse } from "@repo/shared";

@Injectable()
export class DomainService {
  constructor(private readonly db: DbService) {}

  async create(input: CreateInquiryTicketInput): Promise<InquiryTicketResponse> {
    const record = await this.db.entity.create({
      data: input,
    });

    return record;
  }

  async getById(id: string): Promise<InquiryTicketResponse> {
    const record = await this.db.entity.findUnique({
      where: { id },
    });

    if (!record) {
      throw new ORPCError("NOT_FOUND", { message: "Record not found" });
    }

    return record;
  }
}
```

### Error Handling

**Backend:** Use `ORPCError` for typed server-side errors:

```typescript
throw new ORPCError('NOT_FOUND', { message: 'Record not found' })
throw new ORPCError('UNAUTHORIZED', { message: 'Access denied' })
throw new ORPCError('BAD_REQUEST', { message: 'Invalid input' })
throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Something went wrong' })
```

**Frontend:** Use `isDefinedError()` to handle typed errors:

```typescript
import { isDefinedError } from '@orpc/client'

const [error, data, isDefined] = await api.inquiries.getById({ id })

if (error) {
  if (isDefinedError(error)) {
    // or use isDefined for type narrowing
    console.log(error.code) // 'NOT_FOUND', 'UNAUTHORIZED', etc.
    console.log(error.message)
    console.log(error.status)
  } else {
    console.error(error.message)
  }
}
```

**Privacy rule:** Never expose PII or sensitive data in `error.data`. Use generic messages like "Record not found" instead of "Inquiry #123 not found".

---

## Frontend Patterns (oRPC Client)

### Data Fetching Patterns

oRPC returns a **tuple of three values**: `[error, data, isDefined]`

- `error` — The error object (if any)
- `data` — The response data (if successful)
- `isDefined` — Boolean flag for type narrowing (same as `isDefinedError(error)`)

#### Server Components (SSR)

Use the client directly in async server components:

```typescript
import { isDefinedError } from '@orpc/client'
import { api } from '@/lib/api.client'

export default async function InquiriesPage() {
  const [error, data, isDefined] = await api.inquiries.getList({ limit: 20 })

  if (isDefinedError(error)) {
    // or use isDefined for type narrowing
    return <div className="error">Error: {error.message}</div>
  }

  if (error) {
    return <div className="error">{JSON.stringify(error)}</div>
  }

  return (
    <div>
      {data?.map((inquiry) => (
        <div key={inquiry.id}>{inquiry.subject}</div>
      ))}
    </div>
  )
}
```

#### Client Components (CSR)

Use in `use client` components with proper state management:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { isDefinedError } from '@orpc/client'
import { api } from '@/lib/api.client'
import type { InquiryTicketResponse } from '@repo/shared'

export function InquiriesList() {
  const [data, setData] = useState<InquiryTicketResponse[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const [err, result, isDefined] = await api.inquiries.getList({ limit: 20 })
        
        if (err) {
          setError(isDefinedError(err) ? err.message : 'Validation error')
          return
        }

        setData(result)
      } finally {
        setIsLoading(false)
      }
    }

    fetch()
  }, [])

  if (isLoading) return <div>Loading...</div>
  if (error) return <div className="error">{error}</div>
  if (!data) return <div>No data</div>

  return (
    <ul>
      {data.map((inquiry) => (
        <li key={inquiry.id}>{inquiry.subject}</li>
      ))}
    </ul>
  )
}
```

#### Form Submissions

```typescript
'use client'

import { useState } from 'react'
import { isDefinedError } from '@orpc/client'
import { api } from '@/lib/api.client'

export function CreateInquiryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setError(null)

    const [err, response, isDefined] = await api.inquiries.create({
      citizenEmail: formData.get('email') as string,
      citizenName: formData.get('name') as string,
      subject: formData.get('subject') as string,
      category: 'appointment_request',
      message: formData.get('message') as string,
    })

    if (err) {
      setError(isDefinedError(err) ? err.message : 'Failed to submit inquiry')
      setIsSubmitting(false)
      return
    }

    alert(`Your reference number: ${response?.referenceNumber}`)
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit(new FormData(e.currentTarget))
    }}>
      <input name="email" type="email" required />
      <input name="name" type="text" required />
      <input name="subject" type="text" required />
      <textarea name="message" required />
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
      
      {error && <div className="error">{error}</div>}
    </form>
  )
}
```

### Error Handling Patterns

#### Handle Specific Error Codes

```typescript
const [error, data, isDefined] = await api.inquiries.getById({ id: inquiryId })

if (error) {
  if (isDefinedError(error)) {
    // or use isDefined for type narrowing
    if (error.code === 'NOT_FOUND') {
      return <div>Inquiry not found</div>
    }
    
    if (error.code === 'UNAUTHORIZED') {
      return <div>You don't have permission to view this</div>
    }
    
    // Generic fallback
    return <div>Error: {error.message}</div>
  }
}
```

#### Display User-Friendly Messages

```typescript
const getErrorMessage = (error: unknown): string => {
  if (isDefinedError(error)) {
    switch (error.code) {
      case 'NOT_FOUND':
        return 'The requested item could not be found.'
      case 'UNAUTHORIZED':
        return 'You do not have permission to perform this action.'
      case 'BAD_REQUEST':
        return 'Please check your input and try again.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }
  return 'Please check your input and try again.'
}
```

---

## Coding Style & Patterns

### Naming Conventions
* **Files:** kebab-case (`document-card.tsx`, `use-auth.ts`, `document-card.tsx`,(component file names))
* **Component Names:** PascalCase (`DocumentCard`, `InquiriesList`)
* **Functions/Variables:** camelCase (`handleSubmit`, `isLoading`)
* **Constants:** UPPER_SNAKE_CASE (`API_URL`, `MAX_LIMIT`)

### Folder Structure

```bash
dali-portal/
├── apps/
│   ├── portal/              # Next.js — Public Portal (SSR)
│   │   └── src/
│   │       ├── app/         # App Router pages, layouts
│   │       ├── components/  # App-specific components
│   │       └── lib/         # Utilities, client setup
│   ├── admin/               # Next.js — Internal Dashboard (CSR)
│   │   └── src/
│   │       ├── app/         # App Router pages, layouts
│   │       ├── components/  # App-specific components
│   │       └── lib/         # Utilities, client setup
│   └── backend/             # NestJS — REST API
│       └── src/
│           ├── app/         # Feature modules
│           ├── lib/         # Global libraries
│           └── main.ts      # Entry point
├── packages/
│   ├── shared/              # Contracts, schemas, utilities
│   │   └── src/
│   │       ├── contracts/   # oRPC contracts
│   │       ├── schemas/     # Zod schemas
│   │       ├── lib/         # Shared utilities
│   │       └── contract.ts  # Root router
│   └── ui/                  # Shared UI components
│       └── src/
│           ├── components/  # Reusable UI components
│           ├── hooks/       # Shared React hooks
│           ├── lib/         # Utilities (cn, utils)
│           └── styles/      # Global CSS, Tailwind
```

### Import Order

```typescript
// 1. External packages
import { useState } from 'react'
import { z } from 'zod'

// 2. Internal packages (@repo/*)
import { api } from '@repo/shared'
import { Button } from '@repo/ui/components/button'

// 3. Absolute imports (@/*)
import { getSessionToken } from '@/lib/auth'

// 4. Relative imports
import { DocumentCard } from './document-card'
```

---

## Collaboration & Tone

- Be direct, concise, and practical.
- Prefer high-signal bullets over long prose.
- State assumptions briefly, then proceed unless blocked.
- Before editing, scan for existing patterns in the repo and follow them.
- Keep edits minimal and scoped to the request.
- Avoid introducing new libraries unless clearly necessary.

---

## Security, Privacy, and Compliance

- **Sensitive Data:** Treat citizen data (name, email, contact number, address, beneficiary info) as sensitive.
- **Error Messages:** Do not leak whether a record exists. Use generic errors ("Record not found").
- **Authorization:** Prefer server-side enforcement. Never rely only on client checks.
- **RLS Policies:** Always enforce Row-Level Security in Supabase.
- **Auth:** Never store passwords. Use Supabase Auth for all authentication.

---

## Accessibility

- Follow **WCAG 2.0 AA** or higher.
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, etc.).
- Include accessible form labels and ARIA attributes where needed.
- Test with keyboard navigation and screen readers.

---

## Adding Shadcn/UI Components

Shadcn components are installed into `packages/ui`:

1. Navigate to the UI package:
   ```bash
   cd packages/ui
   ```

2. Run the Shadcn CLI:
   ```bash
   pnpm dlx shadcn@latest add <component-name>
   ```

3. Use in an app:
   ```tsx
   import { Button } from "@repo/ui/components/button"
   ```

---

## Planning Convention

When asked for an **implementation plan** for a specific feature:
- **Do NOT implement.**
- Write a plan markdown to `.plans/<feature-slug>/plan.md` (gitignored).
- Ensure strict requirements and edge cases are justified by stated goals.
- Include acceptance criteria.
- **Do NOT** include a test strategy unless explicitly requested.

---

## Development Workflow

### Adding a New Backend Feature

1. **Define schemas** in `packages/shared/src/schemas/<domain>.schema.ts`
2. **Define contracts** in `packages/shared/src/contracts/<domain>.contract.ts`
3. **Export from root** in `packages/shared/src/contract.ts`
4. **Create backend module** in `apps/backend/src/app/<domain>/`:
   - `<domain>.controller.ts`
   - `<domain>.service.ts`
   - `<domain>.module.ts`
5. **Import module** in `apps/backend/src/app/app.module.ts`
6. **Test** using the frontend client

### Adding a New Frontend Feature

1. **Check contracts** in `packages/shared/src/contracts/` to see available endpoints
2. **Import client** in your component: `import { api } from '@/lib/api.client'`
3. **Fetch or mutate** data using the client
4. **Handle errors** with `isDefinedError()`
5. **Add loading states** for better UX

### Using Workspace Packages

To use a shared package in an app:

```bash
# Add dependency
pnpm --filter portal add @repo/ui
pnpm --filter admin add @repo/shared

# Import in code
import { Button } from "@repo/ui/components/button"
import { api } from "@repo/shared"
```

---