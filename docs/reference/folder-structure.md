# COSLAB Folder Structure

## Overview

| Folder | Role | Description |
|--------|------|-------------|
| backend-node/ | Server | Node.js + Express + Prisma |
| frontend/ | Client | React + TypeScript + Vite |
| docs/ | Documentation | Worklogs, references |

---

## Backend (backend-node/)

| Path | Role | Description |
|------|------|-------------|
| src/config/env.ts | Config | Zod schema for environment variables |
| src/config/index.ts | Config | Clean API wrapper (config.server, config.docker) |
| src/config/database.ts | Config | Prisma client instance |
| src/modules/c/ | Module | C code execution (Docker sandbox) |
| src/modules/memory/ | Module | Memory trace simulation |
| src/modules/problems/ | Module | Problem CRUD API |
| src/modules/submissions/ | Module | Submission records API |
| src/modules/users/ | Module | User management API |
| src/app.ts | Entry | Server startup, middleware, routes |
| prisma/schema.prisma | Database | DB schema definition |
| prisma/seed.ts | Database | Initial data seeding |
| data/ | Data | Temporary data (testcase queue) |

---

## Frontend (frontend/src/)

| Path | Role | Description |
|------|------|-------------|
| config/env.ts | Config | Zod schema for VITE_ env vars |
| config/index.ts | Config | Clean API (config.api, config.firebase, config.ollama) |
| features/chat/ | Feature | AI tutor chat interface |
| features/memory/ | Feature | Memory visualization module |
| features/problems/ | Feature | Problem list + code editor |
| components/ui/ | UI | shadcn/ui components (Button, Card, Table...) |
| components/ThemeToggle.tsx | UI | Dark mode toggle |
| services/crunner.ts | Service | C code run/judge API |
| services/tracer.ts | Service | Memory trace API |
| services/firebase.ts | Service | Firebase auth (Google login) |
| services/ollama.ts | Service | Ollama AI tutor API |
| services/problems.ts | Service | Problems fetch API |
| services/submissions.ts | Service | Submissions API |
| services/users.ts | Service | Users API |
| stores/store.ts | State | Zustand global state |
| types/memory.ts | Types | MemoryBlock, Step, TraceResult |
| types.ts | Types | Message, RunResult, Problem, TabType |
| pages/Admin.tsx | Page | Admin dashboard |
| layouts/MainLayout.tsx | Layout | Main app layout |
| hooks/useTheme.ts | Hook | Theme management |
| lib/utils.ts | Utility | cn() classname helper |

---

## Feature Module Structure

| Path | Role | Description |
|------|------|-------------|
| features/{name}/index.ts | Entry | Public exports only |
| features/{name}/components/ | Internal | Feature-specific components |
| features/{name}/hooks/ | Internal | Feature-specific hooks |
| features/{name}/types.ts | Internal | Feature-specific types |
| features/{name}/constants.ts | Internal | Feature-specific constants |
| features/{name}/utils.ts | Internal | Feature-specific utilities |

---

## Tests (frontend/tests/)

| Path | Role | Description |
|------|------|-------------|
| tests/unit/ | Unit | Pure function tests |
| tests/component/ | Component | React component tests |
| tests/e2e/ | E2E | Playwright browser tests |
| tests/mocks/ | Mock | MSW API mock handlers |
| tests/setup.ts | Setup | Test environment setup |

---

## Config Files

| File | Tool | Description |
|------|------|-------------|
| vite.config.ts | Vite | Build configuration |
| vitest.config.ts | Vitest | Unit test configuration |
| playwright.config.ts | Playwright | E2E test configuration |
| tailwind.config.js | Tailwind | CSS framework config |
| tsconfig.json | TypeScript | Type checking config |
| components.json | shadcn/ui | UI components config |
| .env.example | Env | Environment variable template |
| .env.local | Env | Actual values (gitignored) |

---

## File Naming Conventions

| Pattern | Example | Description |
|---------|---------|-------------|
| *.tsx | Chat.tsx | React component |
| *.ts | utils.ts | Logic, types, utilities |
| *.test.ts(x) | utils.test.ts | Test file |
| index.ts | features/chat/index.ts | Module entry point |
| *.handler.ts | int.handler.ts | Backend handler |
| *.routes.ts | routes.ts | Express router |

---

## Data Flow

| Layer | Frontend | Backend |
|-------|----------|---------|
| Entry | App.tsx | app.ts |
| Config | config/index.ts | config/index.ts |
| State | stores/store.ts | - |
| API Call | services/*.ts | modules/*/routes.ts |
| Business Logic | features/*/ | modules/*/*.ts |
| Database | - | prisma/ |

---

## Import Aliases

| Alias | Path | Usage |
|-------|------|-------|
| @/ | frontend/src/ | @/components/ui/button |
| @/features | frontend/src/features/ | @/features/memory |
| @/config | frontend/src/config/ | @/config |

---

## Key Directories Summary

| Directory | One-liner |
|-----------|-----------|
| config/ | Environment variables -> config.api.baseUrl |
| features/ | Screen-level feature modules |
| services/ | Backend API calls |
| stores/ | Global state (user, selectedProblem...) |
| components/ui/ | Reusable UI (buttons, cards...) |
| modules/ | Backend feature units (REST API) |
| types/ | Shared TypeScript interfaces |
| tests/ | Unit, component, E2E tests |
