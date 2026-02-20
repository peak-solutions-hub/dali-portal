# Contributing Guidelines

## Table of Contents

- [Monorepo Structure](#monorepo-structure)
- [Adding Shadcn/UI Components](#adding-shadcnui-components)
- [Adding a New Package](#adding-a-new-package)
- [Using Workspace Packages](#using-workspace-packages)
- [Commit Messages](#commit-messages)
- [Branch Naming](#branch-naming)
- [Pull Requests](#pull-requests)
- [Keeping Your Branch Updated](#keeping-your-branch-updated)
- [File Naming](#file-naming)
- [MCP Servers (AI Tooling)](#mcp-servers-ai-tooling)
- [Backend Development](#backend-development)
- [Frontend Development](#frontend-development)
- [Additional Guidelines](#additional-guidelines)

---

## Monorepo Structure

```bash
dali-portal/
├── apps/
│   ├── portal/              # Next.js — Public Portal (SSR, citizen-facing)
│   │   └── src/
│   │       ├── app/         # App Router pages, layouts
│   │       ├── components/  # App-specific components
│   │       │   └── <domain>/
│   │       │       └── chat/ # Sub-components (bubbles, list, reply box)
│   │       ├── hooks/       # Custom hooks (use-file-upload, use-send-*)
│   │       └── lib/         # Utilities, client setup
│   ├── admin/               # Next.js — Internal Dashboard (CSR, staff-facing)
│   │   └── src/app/         # App Router pages, layouts, components
│   └── backend/             # NestJS — REST API
│       └── src/             # Modules, controllers, services
├── packages/
│   ├── shared/              # Contracts, schemas, constants, utilities
│   │   └── src/
│   │       ├── constants/   # Single source of truth for all limits & config
│   │       ├── contracts/   # oRPC contracts
│   │       ├── schemas/     # Zod schemas
│   │       └── lib/         # Shared utilities
│   ├── ui/                  # Shared UI components (Shadcn, custom)
│   │   └── src/
│   │       ├── components/  # Reusable UI components
│   │       ├── hooks/       # Shared React hooks
│   │       ├── lib/         # Utilities (cn, utils)
│   │       └── styles/      # Global CSS, Tailwind config
│   └── typescript-config/   # Shared tsconfig presets
├── .github/
│   └── workflows/           # CI/CD pipelines
├── turbo.json               # Turborepo task configuration
├── pnpm-workspace.yaml      # pnpm workspace definition
└── biome.json               # Linter/formatter config
```

---

## Adding Shadcn/UI Components

Shadcn components are installed into the shared `packages/ui` package.

1. **Navigate to the UI package first:**

    ```bash
    cd packages/ui
    ```

2. **Run the Shadcn CLI:**

    ```bash
    pnpm dlx shadcn@latest add <component-name>
    ```

    Example:

    ```bash
    pnpm dlx shadcn@latest add button dialog toast
    ```

3. **Use in an app:**

    ```tsx
    import { Button } from "@repo/ui/components/button";
    ```

---

## Adding a New Package

1. **Create the package folder:**

    ```bash
    mkdir packages/my-new-package
    cd packages/my-new-package
    ```

2. **Initialize with a `package.json`:**

    ```bash
    pnpm init
    ```

3. **Set the package name with workspace scope:**

    ```json
    {
      "name": "@repo/my-new-package",
      "version": "0.0.0",
      "private": true,
      "main": "./src/index.ts",
      "types": "./src/index.ts"
    }
    ```

---

## Using Workspace Packages

To use a shared package in an app:

1. **Add the dependency:**

    ```bash
    pnpm --filter portal add @repo/ui
    # or
    pnpm --filter admin add @repo/ui
    ```

2. **Import in your code:**

    ```tsx
    import { Button } from "@repo/ui/components/button";
    import { cn } from "@repo/ui/lib/utils";
    ```

---

## Commit Messages

Commits are validated by [Commitlint](https://commitlint.js.org/) using the Conventional Commits format.

### Format

```
category: message
```

### Categories

| Category | Description |
|----------|-------------|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `refactor` | Code restructuring (no new features or fixes) |
| `docs` | Documentation changes |
| `build` | Build process or dependency changes |
| `test` | Adding or modifying tests |
| `ci` | CI/CD configuration changes |
| `chore` | Maintenance tasks, style tweaks, cleanup |

### Examples

```
feat: add document search to portal
fix: resolve auth redirect loop
docs: update contributing guidelines
refactor: extract table into separate component
build: upgrade to next.js 16
ci: add backend deployment to workflow
chore: adjust sidebar padding
```

---

## Branch Naming

> **Note:** Check if an existing branch exists for your issue before creating a new one.

### Format

```
category/ISSUE-ID-short-description
```

- Use lowercase with hyphens (`-`)
- Use the Jira issue ID (e.g., `PS-66`)
- Use a category from commit categories

### Examples

```
feat/PS-42-document-search
fix/PS-88-login-redirect-bug
docs/PS-66-readme
refactor/PS-100-extract-table-component
```

---

## Pull Requests

### Workflow

1. **Create or checkout a branch:**

    ```bash
    # New branch
    git checkout -b feat/PS-42-document-search

    # Existing remote branch
    git fetch origin
    git checkout -b feat/PS-42-document-search origin/feat/PS-42-document-search
    ```

2. **Make changes** following project standards.

3. **Commit** using conventional commit format.

4. **Push your branch:**

    ```bash
    git push -u origin feat/PS-42-document-search
    ```

5. **Open a Pull Request** on GitHub:
    - Link to the related Jira issue
    - Fill out the PR template
    - Assign yourself
    - Request reviewers if needed

6. **Address review feedback** and ensure CI passes.

7. **Merge using Squash Merge:**
    - All PRs should be merged using **Squash and Merge**
    - This keeps `develop` branch history clean with one commit per feature/fix

---

## Keeping Your Branch Updated

Use **rebase** instead of merge to keep a linear history:

```bash
# Fetch latest changes
git fetch origin

# Rebase onto develop
git rebase origin/develop

git push --force-with-lease
```

or

```bash
# Fetch and rebase
git pull --rebase origin develop
 
git push --force-with-lease
```

---

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | `kebab-case.tsx` | `document-card.tsx` |
| Hooks | `use-kebab-case.ts` | `use-auth.ts` |
| Utilities | `kebab-case.ts` | `format-date.ts` |
| Pages (App Router) | `page.tsx` in folder | `app/documents/page.tsx` |
| Layouts | `layout.tsx` | `app/layout.tsx` |

---

## MCP Servers (AI Tooling)

This project uses Model Context Protocol (MCP) servers to enhance AI-assisted development. When using Copilot or other AI tools:

| Server | Purpose | When to Use |
|--------|---------|-------------|
| **Atlassian** | Jira integration | Fetching ticket details, creating issues |
| **Supabase** | Database schema inspection | Checking tables, RLS policies, migrations |
| **Figma** | Design-to-code | Inspecting designs, generating UI code |
| **Context7** | External documentation | Looking up library docs (Next.js, NestJS, Supabase, etc.) |
| **Shadcn** | Shadcn component registry & code generation | When adding or updating Shadcn UI components; use the `shadcn` MCP tools and work inside `packages/ui` |

### Usage Tips

- When implementing a feature, ask the AI to fetch the related Jira ticket first
- When working with database schema, ask to inspect the Supabase schema
- When building UI from designs, provide the Figma URL for accurate implementation
 - When adding or updating Shadcn components, `cd packages/ui` first and run the Shadcn CLI (or ask the `shadcn` MCP server to generate component code). Ensure new components are exported from `packages/ui`.

---

## Backend Development

The backend uses **oRPC** for type-safe API contracts with **NestJS**.

### Directory Structure

```bash
apps/backend/src/
├── app/
│   ├── db/                    # Database module (Prisma)
│   │   ├── db.service.ts
│   │   └── db.module.ts
│   ├── exceptions/            # Global exception filters
│   │   ├── index.ts
│   │   ├── prisma-client-exception.filter.ts
│   │   └── throttler-exception.filter.ts
│   ├── <domain>/              # Feature modules
│   │   ├── <domain>.controller.ts
│   │   ├── <domain>.service.ts
│   │   └── <domain>.module.ts
│   └── app.module.ts          # Root module
├── lib/
│   ├── lib.module.ts          # Global libs
│   └── <lib>.service.ts       # any lib wrapper
└── main.ts                    # entry file
```

### Contract-First Workflow

1. **Define Zod schemas** in `packages/shared/src/schemas/<domain>.schema.ts`
2. **Define oRPC contracts** in `packages/shared/src/contracts/<domain>.contract.ts`
3. **Re-export** from `packages/shared/src/contract.ts` root router
4. **Implement** in `apps/backend/src/app/<domain>/`

### Controller Pattern (use @Implement)

```typescript
import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@repo/shared";

@Controller()
export class DomainController {
  constructor(private readonly service: DomainService) {}

  @Implement(contract.domain.create)
  create() {
    return implement(contract.domain.create).handler(async ({ input }) => {
      return this.service.create(input);
    });
  }
}
```

### Service Pattern (use AppError)

```typescript
import { Injectable } from "@nestjs/common";
import { AppError } from "@repo/shared";
import { DbService } from "@/app/db/db.service";

@Injectable()
export class DomainService {
  constructor(private readonly db: DbService) {}

  async getById(id: string) {
    const record = await this.db.entity.findFirst({ where: { id } });
    
    if (!record) {
      // Use AppError with domain-specific error codes
      throw new AppError("GENERAL.NOT_FOUND");
    }
    
    return record;
  }
}
```

### Error Handling

The backend uses a comprehensive error handling system with global exception filters.

#### AppError (Typed Application Errors)

Use `AppError` from `@repo/shared` for business logic errors:

```typescript
import { AppError } from "@repo/shared";

// Throw with error code (uses default message from ERRORS constant)
throw new AppError("INQUIRY.NOT_FOUND");

// Throw with custom message
throw new AppError("INQUIRY.EMAIL_SEND_FAILED", "Custom error message");

// Throw with additional data
throw AppError.withData("GENERAL.BAD_REQUEST", { field: "email" });
```

Available error codes are defined in `packages/shared/src/constants/errors.ts`:

| Domain | Error Code | Status | Description |
|--------|------------|--------|-------------|
| GENERAL | TOO_MANY_REQUESTS | 429 | Rate limit exceeded |
| GENERAL | UNAUTHORIZED | 401 | Authentication required |
| GENERAL | FORBIDDEN | 403 | Permission denied |
| GENERAL | NOT_FOUND | 404 | Resource not found |
| GENERAL | BAD_REQUEST | 400 | Invalid input |
| GENERAL | CONFLICT | 409 | Resource conflict |
| GENERAL | INTERNAL_SERVER_ERROR | 500 | Unexpected error |
| INQUIRY | NOT_FOUND | 404 | Inquiry not found |
| INQUIRY | MESSAGE_SEND_FAILED | 400 | Message send failed |
| INQUIRY | EMAIL_SEND_FAILED | 500 | Email delivery failed |
| STORAGE | SIGNED_URL_FAILED | 500 | Signed URL generation failed |
| STORAGE | UPLOAD_FAILED | 500 | File upload failed |
| STORAGE | FILE_NOT_FOUND | 404 | File not found |
| STORAGE | BUCKET_NOT_FOUND | 404 | Storage bucket not found |

#### Exception Filters

Global exception filters are registered in `AppModule` and transform errors into oRPC-compatible responses:

| Filter | Catches | Description |
|--------|---------|-------------|
| `ThrottlerExceptionFilter` | Rate limit errors | Returns 429 with standardized message |
| `PrismaClientExceptionFilter` | Prisma known errors (P2xxx) | Maps Prisma codes to HTTP status |
| `PrismaValidationExceptionFilter` | Prisma validation errors | Returns 400 Bad Request |
| `PrismaInitializationExceptionFilter` | Database connection failures | Returns 503 Service Unavailable |
| `PrismaUnknownExceptionFilter` | Unknown Prisma errors | Returns 500 with generic message |
| `PrismaRustPanicExceptionFilter` | Critical engine panics | Returns 500, logs critical error |

#### Common Prisma Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| P2002 | 409 Conflict | Unique constraint violation |
| P2025 | 404 Not Found | Record not found |
| P2003 | 400 Bad Request | Foreign key constraint violation |
| P2024 | 503 Service Unavailable | Connection pool timeout |
| P2034 | 409 Conflict | Transaction write conflict |

### Rate Limiting

Global rate limiting is configured in `AppModule`:

```typescript
ThrottlerModule.forRoot([
  { name: "short", ttl: 1000, limit: 3 },     // 3 req/sec (bot protection)
  { name: "default", ttl: 60000, limit: 60 }, // 60 req/min (user protection)
])
```

Override per-endpoint using decorators:

```typescript
import { Throttle, SkipThrottle } from "@nestjs/throttler";

// Custom rate limit: 5 requests per minute
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Implement(contract.inquiries.create)
create() { ... }

// Skip rate limiting entirely
@SkipThrottle()
@Implement(contract.inquiries.getById)
getById() { ... }
```

### Adding a New Feature Module

1. Create schemas in `packages/shared/src/schemas/<domain>.schema.ts`
2. Create contracts in `packages/shared/src/contracts/<domain>.contract.ts`
3. Export from `packages/shared/src/contract.ts`
4. Create `apps/backend/src/app/<domain>/`:
   - `<domain>.controller.ts` 
   - `<domain>.service.ts` (inject `DbService` and other relevant services)
   - `<domain>.module.ts` (connect controller & service)
5. Import module in `apps/backend/src/app/app.module.ts`

### Supabase Services

Supabase services are in `apps/backend/src/app/util/supabase/` and are globally available.

#### SupabaseAdminService

Provides the Supabase admin client for privileged operations:

```typescript
constructor(private readonly supabaseAdmin: SupabaseAdminService) {}

const client = this.supabaseAdmin.getClient();
```

#### SupabaseStorageService

Handles storage operations (signed URLs, uploads). Use this instead of direct Supabase client calls:

```typescript
import { SupabaseStorageService } from "@/app/util/supabase/supabase-storage.service";

constructor(private readonly storageService: SupabaseStorageService) {}

// Non-throwing: returns null signedUrl on failure
const results = await this.storageService.getSignedUrls("bucket", paths);

// Throwing: throws STORAGE.SIGNED_URL_FAILED on failure
const result = await this.storageService.getSignedUrlOrThrow("bucket", path);
```

---

## Frontend Development

### oRPC Client Usage

The frontend apps use **oRPC with OpenAPILink** for type-safe API communication. Each app has its own isolated client instance.

### Quick Start

1. **Client is auto-configured** in each app:
   - `apps/portal/src/lib/api.client.ts` (public)
   - `apps/admin/src/lib/api.client.ts` (admin)

2. **Import and use** in any component:

   ```typescript
   import { api } from '@/lib/api.client'

   // fetch
   const [error, data] = await api.inquiries.getList({ limit: 20 })

   // mutate
   const [error, data] = await api.inquiries.create({
     citizenEmail: 'citizen@example.com',
     citizenName: 'John Doe',
     subject: 'Help needed',
     category: 'appointment_request',
     message: 'I need assistance with...',
   })
   ```

3. **Handle errors properly**:

   ```typescript
   import { isDefinedError } from '@orpc/client'

   if (error) {
     if (isDefinedError(error)) {
       // Server error with code (UNAUTHORIZED, NOT_FOUND, etc.)
       console.error(error.code, error.message)
     } else {
       console.error(error.message)
     }
   }
   ```
---

## Additional Guidelines

### Constants & Magic Numbers

All reusable limits, thresholds, and configuration values live in `packages/shared/src/constants/`. Never duplicate them or use inline magic numbers for values that could change or are referenced in more than one place.

| Constant Group | Purpose | Example |
|---|---|---|
| `TEXT_LIMITS` | Max character lengths | `TEXT_LIMITS.LG` (1000) for chat messages |
| `FILE_SIZE_LIMITS` | Max file sizes in bytes | `FILE_SIZE_LIMITS.XS` (5 MB) |
| `FILE_COUNT_LIMITS` | Max number of files per upload | `FILE_COUNT_LIMITS.SM` (3) |
| `FILE_UPLOAD_PRESETS` | Pre-built upload configs | `FILE_UPLOAD_PRESETS.ATTACHMENTS` |
| `INQUIRY_MAX_TOTAL_ATTACHMENTS` | Conversation-wide attachment cap | `6` |

**Rules:**
- Reference `FILE_COUNT_LIMITS` in Zod schema `.max()` calls instead of literal numbers.
- `FILE_UPLOAD_PRESETS.ATTACHMENTS` is used for **both** initial inquiry attachments and chat reply attachments (identical limits).

### Avoid Unnecessary Dependencies

- Justify new dependencies in your PR description
- Check if functionality exists in current stack before adding new packages

### Environment Variables

- Update `.env.example` when adding new variables
- Use `NEXT_PUBLIC_` prefix for client-side variables in Next.js

---
