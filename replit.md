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

- Build direction: [the user's game assessment](docs/abyssal-build-reference.md).
- Implemented-versus-planned capabilities: [development status](docs/abyssal-development-status.md). Keep this current as gameplay changes.

- `pnpm --filter @workspace/abyssal run dev` — run the main game
- `pnpm --filter @workspace/abyssal run test` — simulation, persistence, and contract tests
- `pnpm --filter @workspace/abyssal run build` — build the Railway game service
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Main game: React, TanStack Start, Vite, Nitro Node server, and the existing Canvas 2D simulation
- Game-owned API: `/api/ocean`, `/api/rtc`, and `/api/health`; the separate Express scaffold is not the persistent ocean service
- Game persistence: PostgreSQL in production, with explicit embedded PGlite support for local development
- Shared database libraries: PostgreSQL + Drizzle ORM
- Mobile companion: Expo / React Native, using the shared generated API client
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/abyssal/src/game/` — simulation, regional ecology, ocean authority, rendering, and saves
- `artifacts/abyssal/src/components/abyssal/` — game UI, opening, journal, and map
- `artifacts/abyssal-mobile/` — mobile companion
- `lib/api-spec/openapi.yaml` — shared API contract; regenerate clients after changes
- `docs/` — source build reference and implementation boundaries

## Architecture decisions

- Extend existing saves with backward-compatible optional fields rather than resetting diver progress.
- Shared-ocean authority and experimental frequency-mode P2P are separate systems; do not describe them as interchangeable.
- Empty ocean sectors sleep. Persistent history does not imply uninterrupted ecological simulation while a sector is empty.

## Product

Abyssal combines underwater survival, cooperative vehicles, and historical investigation across five existing regions.
The Living Ocean foundation adds player-caused regional changes and ecological responses.
The trench and playable surface chapter remain future campaign work.

## Gotchas

- Simulation state has separate serializers for shared-ocean persistence, frequency snapshots, and local saves. Extend and test each relevant path together.
- Player actions and ecological time advance only in the authoritative simulation; clients consume snapshots.
- Preserve the distinction between personal archive records, shared historical evidence, and shared environmental memory.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
