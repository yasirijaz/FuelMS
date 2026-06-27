# FuelMS — Enterprise ERP for Petrol Pumps

> A financial operating system for petrol pump businesses.  
> Built on Tauri · React · TypeScript · SQLite · pnpm monorepo.

---

## Repository Structure

```
FuelMS/
├── apps/
│   └── desktop/           ← Tauri + React + TypeScript + Vite application
├── packages/
│   ├── shared/            ← Framework-agnostic types, constants, utilities
│   └── ui/                ← Shared React component design system (future)
├── architecture/          ← Architecture decision records and design docs
├── specifications/        ← Functional module specifications
├── engineering/           ← Phase-by-phase engineering sprint folders
├── docs/                  ← General project documentation
├── AI_DEVELOPMENT_PROTOCOL.md
├── BUSINESS_EXAMPLES.md
├── ENGINEERING_STANDARDS.md
├── IMPLEMENTATION_GUIDE.md
└── PROJECT_PRINCIPLES.md
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20.0.0 |
| pnpm | ≥ 9.0.0 |
| Rust + Cargo | For Tauri builds |

Install pnpm if needed:
```bash
npm install -g pnpm
```

---

## Getting Started

```bash
# Install all workspace dependencies
pnpm install

# Start the web dev server (Vite only, no Tauri)
pnpm dev

# Start with full Tauri desktop shell
pnpm tauri dev
```

Open [http://localhost:5173](http://localhost:5173) — the **Health Check** screen verifies all infrastructure layers.

---

## CI Scripts (all run from workspace root)

| Script | What it does |
|--------|-------------|
| `pnpm typecheck` | TypeScript strict check across desktop app |
| `pnpm test` | Vitest unit tests |
| `pnpm lint` | ESLint across all workspaces |
| `pnpm format:check` | Prettier format verification |
| `pnpm build` | Production Vite build |
| `pnpm test:e2e` | Playwright end-to-end tests (requires dev server) |

---

## Architecture

This codebase follows **Clean Architecture** with four layers per feature module:

```
features/
└── Accounting/
    ├── domain/          ← Entities, aggregates, value objects, domain events
    ├── application/     ← Use cases, commands, queries, DTOs
    ├── infrastructure/  ← SQLite repositories, Tauri adapters
    └── presentation/    ← React pages, hooks, forms
```

See the governing documents before writing any code:

1. `AI_DEVELOPMENT_PROTOCOL.md` — mandatory reading for every AI assistant
2. `IMPLEMENTATION_GUIDE.md` — coding rules and patterns
3. `ENGINEERING_STANDARDS.md` — engineering standards
4. `architecture/` — DDD, EDA, accounting, UX architecture

---

## Git Conventions

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add fuel price history screen
fix: correct FIFO calculation edge case
docs: update accounting architecture
arch: record ADR-009 for currency handling
```

Types: `feat · fix · docs · style · refactor · perf · test · build · ci · chore · revert · arch · wip`

---

## Current Status

**Phase: Foundation (Sprint 0)**

- [x] pnpm monorepo workspace
- [x] Tauri + React + TypeScript + Vite desktop app
- [x] Clean Architecture folder structure (8 feature modules)
- [x] ESLint + Prettier + Husky + Commitlint + lint-staged
- [x] Path aliases (`@app`, `@features`, `@shared`, `@styles`)
- [x] TanStack Query provider + QueryClient
- [x] Zustand app shell store
- [x] Theme provider (light / dark / system)
- [x] React Router v7 with hash routing
- [x] React Hook Form + Zod integration
- [x] Structured logger (levelled, coloured)
- [x] React error boundaries (app root + per-feature)
- [x] Type-safe environment configuration
- [x] Vitest (unit) + Playwright (E2E) configured
- [x] Health Check screen proves all layers work
- [x] `@fuelms/shared` package (types, constants, utils)

**Next: Sprint 1 — Database Foundation** (`engineering/002-database/`)
