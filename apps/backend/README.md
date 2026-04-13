# DALI Portal — Backend API

NestJS-based REST API for the DALI Portal, using oRPC for type-safe contracts.

## 📁 Directory Structure

```
src/
├── app/
│   ├── captcha/             # Cloudflare Turnstile verification
│   ├── db/                  # Prisma database service
│   ├── exceptions/          # Global exception filters
│   │   ├── prisma-client-exception.filter.ts
│   │   └── throttler-exception.filter.ts
│   ├── inquiry-ticket/      # Inquiry ticket domain
│   ├── legislative-documents/
│   ├── roles/               # Role definitions
│   ├── session/             # Session management
│   ├── users/               # User management
│   └── util/
│       └── supabase/        # Supabase services
│           ├── supabase-admin.service.ts    # Admin client
│           ├── supabase-storage.service.ts  # Storage operations
│           └── supabase.module.ts
├── lib/
│   ├── config.service.ts    # Environment configuration
│   ├── resend.service.ts    # Email service
│   ├── turnstile.service.ts # CAPTCHA verification
│   └── lib.module.ts        # Shared library module
└── main.ts                  # Application entry point
```

## 📦 Supabase Services

### SupabaseAdminService

Provides the Supabase admin client for privileged operations:

```typescript
constructor(private readonly supabaseAdmin: SupabaseAdminService) {}

const client = this.supabaseAdmin.getClient();
```

### SupabaseStorageService

Handles all storage operations (signed URLs, uploads):

```typescript
import { SupabaseStorageService } from "@/app/util/supabase/supabase-storage.service";

constructor(private readonly storageService: SupabaseStorageService) {}

// Non-throwing (returns null signedUrl on failure)
const results = await this.storageService.getSignedUrls("bucket", paths);

// Throwing (throws STORAGE.SIGNED_URL_FAILED on failure)
const result = await this.storageService.getSignedUrlOrThrow("bucket", path);
```

## 🛡️ Error Handling

### AppError (Business Logic)

Use `AppError` from `@repo/shared` for typed errors:

```typescript
import { AppError } from "@repo/shared";

throw new AppError("GENERAL.NOT_FOUND");           // 404
throw new AppError("GENERAL.UNAUTHORIZED");        // 401
throw new AppError("GENERAL.FORBIDDEN");           // 403
throw new AppError("INQUIRY.EMAIL_SEND_FAILED");   // 500
throw new AppError("STORAGE.SIGNED_URL_FAILED");   // 500
throw new AppError("STORAGE.UPLOAD_FAILED");       // 500
```

### Exception Filters

Global filters in `src/app/exceptions/` handle:

| Filter | Handles | Status |
|--------|---------|--------|
| `PrismaClientExceptionFilter` | Known Prisma errors (P2xxx) | Varies |
| `PrismaValidationExceptionFilter` | Validation errors | 400 |
| `PrismaInitializationExceptionFilter` | Connection failures | 503 |
| `ThrottlerExceptionFilter` | Rate limit exceeded | 429 |

### Common Prisma Errors

| Code | Status | Description |
|------|--------|-------------|
| P2002 | 409 | Unique constraint violation |
| P2025 | 404 | Record not found |
| P2003 | 400 | Foreign key violation |
| P2024 | 503 | Connection pool timeout |

## ⏱️ Rate Limiting

Default throttling configuration:

- **Short burst**: 3 requests per second
- **Standard**: 60 requests per minute

Override per endpoint:

```typescript
import { Throttle, SkipThrottle } from "@nestjs/throttler";

@Throttle({ default: { limit: 5, ttl: 60000 } })
@Implement(contract.inquiries.create)
create() { ... }

@SkipThrottle()
@Implement(contract.inquiries.getById)
getById() { ... }
```

## 🚀 Running

```bash
# Development
pnpm dev

# Production build
pnpm build
pnpm start:prod
```

## 🧪 Testing

```bash
cp .env.test.example .env.test

pnpm test:unit          # Unit tests
pnpm test:integration   # Integration tests (DB-backed)
pnpm test:e2e           # Backend e2e tests (DB-backed)
```

Required test env values:
- `DATABASE_URL` must point to a dedicated test database.
- `TEST_DB_ALLOWED_HOSTS` and `TEST_DB_ALLOWED_PROJECT_REFS` must explicitly allow the target test DB host/project for destructive reset safety.
- Do not reuse dev/prod credentials in `.env.test`.
