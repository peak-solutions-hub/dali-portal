<div align="center">

# DALI Portal

<i>Digital Access for Legislative Information Portal</i>

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![pnpm](https://img.shields.io/badge/pnpm-9-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)

</div>

---

## 📖 About

The DALI Portal is a secure web-based platform designed to modernize the public-facing and internal administrative functions of the Iloilo City Vice Mayor's Office. It provides:

- **Public Portal** — Citizens can search legislative documents, view session schedules, and submit inquiries
- **Internal Management System (Admin)** — Staff can track documents, manage sessions, handle beneficiary records, and manage conference room bookings.

## 📚 Table of Contents
- [📖 About](#-about)
- [📚 Table of Contents](#-table-of-contents)
- [✅ Prerequisites](#-prerequisites)
- [🔧 Installation](#-installation)
- [🔑 Environment Variables](#-environment-variables)
  - [Portal (Public)](#portal-public)
  - [Admin (Internal)](#admin-internal)
  - [Backend (API)](#backend-api)
- [🚀 Running the App](#-running-the-app)
  - [Development](#development)
  - [Access the Apps](#access-the-apps)
  
## ✅ Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Installation |
|------|---------|--------------|
| Node.js | ≥ 22.x | [Download](https://nodejs.org/) |
| pnpm | 9.x | `npm install -g pnpm@9` |

## 🔧 Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/peak-solutions-hub/dali-portal.git
    ```

2. **Navigate to the project directory**

    ```bash
    cd dali-portal
    ```

3. **Install dependencies**

    ```bash
    pnpm install
    ```

4. **Build Shared Packages**

    Since the shared library is a compiled package, you must build it to generate the `dist/` folders.

    ```bash
    pnpm run build
    ```

    For smoother development, you can run the shared package in watch mode. This automatically rebuilds on every change so you don't have to manually rebuild after editing schemas, contracts or utils. 
    
    ```bash
    pnpm run dev:shared
    ```

    > **Note**: Running `pnpm dev` will also start the shared package in watch mode automatically.

## 🔑 Environment Variables

Each app requires its own environment configuration:

### Portal (Public)

```bash
# apps/portal
cp apps/portal/.env.example apps/portal/.env
```

### Admin (Internal)

```bash
# apps/admin
cp apps/admin/.env.example apps/admin/.env
```

### Backend (API)

```bash
# apps/backend
cp apps/backend/.env.example apps/backend/.env
```

## 🚀 Running the App

### Development

Run all apps concurrently:

```bash
pnpm dev
```

Or run specific apps:

```bash
# Public Portal only
pnpm --filter portal dev

# Admin Dashboard only
pnpm --filter admin dev

# Backend API only
pnpm --filter backend dev
```

### Access the Apps

| App | URL | Description |
|-----|-----|-------------|
| Portal | http://localhost:3000 | Public portal
| Admin | http://localhost:3001 | Internal management system |
| Backend | http://localhost:8080 | API server |

---

<div align="center">
  <sub>Built by PEAK Solutions 🏔️</sub>
</div>