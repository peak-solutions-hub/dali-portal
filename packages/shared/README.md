# @repo/shared

Shared constants, enums, and utilities for the DALI Portal monorepo.

This package is consumed by:

- `apps/portal` — Public-facing Next.js app (SSR)
- `apps/admin` — Internal dashboard Next.js app (CSR)
- `apps/backend` — NestJS API server

## Installation

This package is already linked via pnpm workspaces. No installation needed.

## Structure

```
src/
├── enums/           # Domain enums (DocumentType, StatusType, etc.)
├── constants/       # Business rules & mappings (Document → Purpose, etc.)
├── helpers/         # Pure utility functions (formatters, converters)
└── index.ts         # Barrel export
```

## Usage

### Import Patterns

```typescript
// Option 1: Import everything from the root (simple, less tree-shaking)
import { DocumentType, getAllowedPurposes, formatEnumLabel } from "@repo/shared";

// Option 2: Import from specific submodules (better tree-shaking)
import { DocumentType, PurposeType } from "@repo/shared/enums";
import { getAllowedPurposes, getNextStatuses } from "@repo/shared/constants";
import { formatEnumLabel } from "@repo/shared/helpers";
```

---

## Examples

### 1. Using Enums

Enums define the allowed values for database fields and API payloads.

```typescript
import { DocumentType, StatusType, PurposeType } from "@repo/shared/enums";

// Use in type definitions
interface Document {
  type: DocumentType;
  purpose: PurposeType;
  status: StatusType;
}

// Use for validation or comparison
if (doc.status === StatusType.APPROVED) {
  console.log("Document is approved!");
}

// Get all possible values (useful for <Select> dropdowns)
import { DOCUMENT_TYPE_VALUES } from "@repo/shared/enums";

<Select>
  {DOCUMENT_TYPE_VALUES.map((type) => (
    <Option key={type} value={type}>{formatEnumLabel(type)}</Option>
  ))}
</Select>
```

---

### 2. Document Type → Purpose Mapping

Filter the available purposes based on the selected document type.

#### Frontend (React Hook Form + Shadcn)

```tsx
// apps/admin/src/components/DocumentForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { DocumentType, PurposeType } from "@repo/shared/enums";
import { getAllowedPurposes, isPurposeAllowed } from "@repo/shared/constants";
import { formatEnumLabel } from "@repo/shared/helpers";

const schema = z.object({
  type: z.nativeEnum(DocumentType),
  purpose: z.nativeEnum(PurposeType),
}).refine(
  (data) => isPurposeAllowed(data.type, data.purpose),
  { message: "Invalid purpose for this document type", path: ["purpose"] }
);

export function DocumentForm() {
  const form = useForm({ resolver: zodResolver(schema) });
  const selectedType = form.watch("type");

  // Dynamically filter purposes based on document type
  const availablePurposes = selectedType
    ? getAllowedPurposes(selectedType)
    : [];

  return (
    <form>
      {/* Document Type Select */}
      <Select {...form.register("type")}>
        {DOCUMENT_TYPE_VALUES.map((type) => (
          <Option key={type} value={type}>
            {formatEnumLabel(type)}
          </Option>
        ))}
      </Select>

      {/* Purpose Select (filtered) */}
      <Select {...form.register("purpose")}>
        {availablePurposes.map((purpose) => (
          <Option key={purpose} value={purpose}>
            {formatEnumLabel(purpose)}
          </Option>
        ))}
      </Select>
    </form>
  );
}
```

#### Backend (NestJS Validation)

```typescript
// apps/backend/src/documents/dto/create-document.dto.ts
import { IsEnum } from "class-validator";
import { DocumentType, PurposeType } from "@repo/shared/enums";
import { isPurposeAllowed } from "@repo/shared/constants";
import { registerDecorator, ValidationOptions } from "class-validator";

// Custom validator using shared logic
function IsPurposeAllowed(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isPurposeAllowed",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(purpose: PurposeType, args) {
          const dto = args.object as CreateDocumentDto;
          return isPurposeAllowed(dto.type, purpose);
        },
        defaultMessage() {
          return "Purpose is not allowed for the selected document type";
        },
      },
    });
  };
}

export class CreateDocumentDto {
  @IsEnum(DocumentType)
  type: DocumentType;

  @IsEnum(PurposeType)
  @IsPurposeAllowed()
  purpose: PurposeType;
}
```

---

### 3. Status Flow Validation

Control which status transitions are valid.

#### Frontend (Disable Invalid Buttons)

```tsx
// apps/admin/src/components/StatusTransitionButtons.tsx
"use client";

import { StatusType, PurposeType } from "@repo/shared/enums";
import { getNextStatuses } from "@repo/shared/constants";
import { formatEnumLabel } from "@repo/shared/helpers";

interface Props {
  purpose: PurposeType;
  currentStatus: StatusType;
  onTransition: (newStatus: StatusType) => void;
}

export function StatusTransitionButtons({ purpose, currentStatus, onTransition }: Props) {
  const validNextStatuses = getNextStatuses(purpose, currentStatus);

  if (validNextStatuses.length === 0) {
    return <p>This document has reached its final status.</p>;
  }

  return (
    <div className="flex gap-2">
      {validNextStatuses.map((status) => (
        <Button key={status} onClick={() => onTransition(status)}>
          Move to {formatEnumLabel(status)}
        </Button>
      ))}
    </div>
  );
}
```

#### Backend (Guard Transition)

```typescript
// apps/backend/src/documents/documents.service.ts
import { BadRequestException, Injectable } from "@nestjs/common";
import { isTransitionAllowed } from "@repo/shared/constants";
import { PurposeType, StatusType } from "@repo/shared/enums";

@Injectable()
export class DocumentsService {
  async updateStatus(
    documentId: string,
    purpose: PurposeType,
    currentStatus: StatusType,
    newStatus: StatusType
  ) {
    // Validate transition using shared logic
    if (!isTransitionAllowed(purpose, currentStatus, newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus} for ${purpose}`
      );
    }

    // Proceed with update...
  }
}
```

---

### 4. Formatting Helpers

Convert snake_case enum values to human-readable labels.

```typescript
import { formatEnumLabel, enumToSlug, slugToEnum } from "@repo/shared/helpers";
import { DocumentType } from "@repo/shared/enums";

formatEnumLabel(DocumentType.PROPOSED_ORDINANCE);
// → "Proposed Ordinance"

enumToSlug(DocumentType.PROPOSED_ORDINANCE);
// → "proposed-ordinance"

slugToEnum("proposed-ordinance");
// → "proposed_ordinance"
```

---

## Adding New Enums or Constants

### Adding a new Enum

1. Create or edit a file in `src/enums/`:

```typescript
// src/enums/my-domain.ts
export const MyNewStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type MyNewStatus = (typeof MyNewStatus)[keyof typeof MyNewStatus];
export const MY_NEW_STATUS_VALUES: MyNewStatus[] = Object.values(MyNewStatus);
```

2. Export it from `src/enums/index.ts`:

```typescript
export * from "./my-domain";
```

### Adding a new Constant/Mapping

1. Create or edit a file in `src/constants/`:

```typescript
// src/constants/my-rules.ts
import { MyNewStatus } from "../enums";

export const MY_STATUS_LABELS: Record<MyNewStatus, string> = {
  [MyNewStatus.ACTIVE]: "Currently Active",
  [MyNewStatus.INACTIVE]: "Not Active",
};
```

2. Export it from `src/constants/index.ts`:

```typescript
export * from "./my-rules";
```

---

## Build & Compatibility

### Next.js (Portal & Admin)

Next.js 13+ with `transpilePackages` automatically compiles this package. No build step needed.

```typescript
// next.config.ts
const nextConfig = {
  transpilePackages: ["@repo/shared"],
};
```

### NestJS (Backend)

NestJS compiles TypeScript directly. Ensure `@repo/shared` is in your `tsconfig.json` paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@repo/shared": ["../../packages/shared/src"],
      "@repo/shared/*": ["../../packages/shared/src/*"]
    }
  }
}
```

---

## Security Notes

This package is safe to use in both client and server contexts because:

1. **No secrets**: It contains no API keys, database credentials, or environment variables.
2. **No PII**: It contains no personally identifiable information.
3. **Pure functions**: All helpers are "pure" (same input → same output, no side effects).

If you need server-only utilities (e.g., database queries, secret handling), create a separate `@repo/server-utils` package and use the `server-only` npm package to prevent accidental client imports.
