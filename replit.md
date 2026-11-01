# Abyssal: The Last Ascent

A cooperative underwater survival and exploration game with a shared ocean and beacon-based diver identity.

## Railway production

- Production: https://abyssal-web-production.up.railway.app
- Railway project: `Abyssal`; environment: `production`; services: `abyssal-web` and `Postgres`.
- Source: `niakofa-cmyk/Abyssal`, branch `main`, repository root.
- Service settings are managed directly in Railway, not through deprecated `railway.toml` configuration.
- Build: `pnpm --filter @workspace/abyssal run build`
- Pre-deploy: `pnpm --filter @workspace/abyssal run db:migrate`
- Start: `pnpm --filter @workspace/abyssal run start`
- Readiness: `/api/health` must return JSON with `ok: true`, `ready: true`, and `db: "postgres"`. HTTP 200 alone is insufficient.
- `DATABASE_URL` references the project's Postgres service. Account authentication remains disabled; the game uses its existing beacon identity.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
