# @repo/shared

Shared constants, enums, and utilities for the DALI Portal monorepo.

This package is consumed by:

- `apps/portal` — Public-facing Next.js app (SSR)
- `apps/admin` — Internal dashboard Next.js app (CSR)
- `apps/backend` — NestJS API server

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

### Using Enums

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

## Adding New Enums or Constants

### Adding a new Enum

1. Create or edit a file in `src/enums/`:

```typescript
// src/enums/my-domain.ts
export const MyNewStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type MyNewStatus = (typeof MyNewStatus)[keyof typeof MyNewStatus]; // "active" | "inactive"
export const MY_NEW_STATUS_VALUES: MyNewStatus[] = Object.values(MyNewStatus); // a list of the values ["active", "inactive"], useful for options, checkboxes
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