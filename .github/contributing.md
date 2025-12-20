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
- [Additional Guidelines](#additional-guidelines)

---

## Monorepo Structure

```bash
dali-portal/
├── apps/
│   ├── portal/              # Next.js — Public Portal (SSR, citizen-facing)
│   │   └── src/app/         # App Router pages, layouts, components
│   ├── admin/               # Next.js — Internal Dashboard (CSR, staff-facing)
│   │   └── src/app/         # App Router pages, layouts, components
│   └── backend/             # NestJS — REST API
│       └── src/             # Modules, controllers, services
├── packages/
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

### Usage Tips

- When implementing a feature, ask the AI to fetch the related Jira ticket first
- When working with database schema, ask to inspect the Supabase schema
- When building UI from designs, provide the Figma URL for accurate implementation

---

## Additional Guidelines

### Avoid Unnecessary Dependencies

- Justify new dependencies in your PR description
- Check if functionality exists in current stack before adding new packages

### Environment Variables

- Update `.env.example` when adding new variables
- Use `NEXT_PUBLIC_` prefix for client-side variables in Next.js

---
