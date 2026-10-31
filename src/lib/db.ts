import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { pendingMigrations } from "../../scripts/migration-plan.mjs";
import { resolveDatabaseMode } from "../../scripts/db-mode.mjs";

/** Which database backend is active. PostgreSQL via `pg`, or embedded PGlite. */
export type DbSource = "postgres" | "pglite";

type ResolvedMode = { source: DbSource; url?: string };

const globalMode = globalThis as typeof globalThis & {
  __abyssalDbMode__?: ResolvedMode;
  __abyssalDbModeError__?: Error;
};

/**
 * Resolve the backend for this process.
 *
 * `npm run build` evaluates server modules while `NODE_ENV` is already
 * `production` and no database is attached. That evaluation must not fail
 * closed and must not open PGlite. The built server is started with
 * `node .output/server/index.mjs`, which does not set `npm_lifecycle_event`
 * to `build`, so a missing production URL still fails the first readiness check.
 */
function serverDatabaseMode(): ResolvedMode {
  if (process.env.npm_lifecycle_event === "build") {
    const raw = process.env.DATABASE_URL;
    const url = raw && raw.trim() ? raw.trim() : undefined;
    return url ? { source: "postgres", url } : { source: "pglite" };
  }
  const mode = resolveDatabaseMode(process.env);
  return mode.source === "postgres"
    ? { source: "postgres", url: mode.url }
    : { source: "pglite" };
}

export function readDbMode(): ResolvedMode {
  if (typeof window !== "undefined") return { source: "pglite" };
  if (globalMode.__abyssalDbModeError__) throw globalMode.__abyssalDbModeError__;
  if (!globalMode.__abyssalDbMode__) {
    try {
      globalMode.__abyssalDbMode__ = serverDatabaseMode();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      globalMode.__abyssalDbModeError__ = error;
      console.error(`[db] ${error.message}`);
      throw error;
    }
  }
  return globalMode.__abyssalDbMode__;
}

export function currentDbSource(): DbSource {
  return readDbMode().source;
}

/**
 * Minimal shared SQL surface, satisfied by both Neon and PGLite. Both the
 * tagged-template and `.query()` forms resolve to an array of row objects:
 *
 *   const sql = await getSql();
 *   const rows = await sql`select * from todos where id = ${id}`; // parameterized
 *   const rows2 = await sql.query("select * from todos where id = $1", [id]);
 */
export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
}

/**
 * Init state lives on globalThis as promises: dev HMR creates new instances of
 * this module, and two instances racing module-level state would open a second
 * pool or run two concurrent PGLite migration passes (whose duplicate
 * `_migrations` insert rejects — and would get memoized, poisoning every later
 * `getSql()`). A failed init clears its slot so the next call retries.
 */
const globalRef = globalThis as typeof globalThis & {
  __pgSqlPromise__?: Promise<Sql>;
  __pgliteInstance__?: Promise<import("@electric-sql/pglite").PGlite>;
  __pgliteMigrateChain__?: Promise<void>;
};

/**
 * Result-type parity: Postgres sends every value as text plus a type OID — the
 * JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
 * int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
 * JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
 * production return identical, JSON-safe shapes:
 *   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
 *                                   `::text` if you ever need huge integers)
 *   date                         -> 'YYYY-MM-DD' string
 *   interval                     -> Postgres interval text
 * numeric already comes back as a string on both (arbitrary precision).
 */
const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v: string) => v;

type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run: Run): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    // Rebuild with $1, $2, … placeholders so values stay parameterized.
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    run<T>(text, params);
  return sql;
}

function createPostgresSql(connectionString: string): Promise<Sql> {
  globalRef.__pgSqlPromise__ ??= (async () => {
    // node-postgres. Works with Railway Postgres and Neon's pooled endpoint.
    // One pool per process; a warm process reuses it.
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, identity);
    types.setTypeParser(OID_INTERVAL, identity);
    const pool = new Pool({ connectionString });
    return toSql(async <T>(text: string, params: unknown[]) => {
      const res = await pool.query(text, params);
      return res.rows as T[];
    });
  })().catch((err) => {
    globalRef.__pgSqlPromise__ = undefined;
    throw err;
  });
  return globalRef.__pgSqlPromise__;
}

function pgliteDataDir() {
  const fromEnv = process.env.ABYSSAL_PGLITE_DIR?.trim();
  const dir = fromEnv || join(process.cwd(), ".data", "pglite");
  mkdirSync(dir, { recursive: true });
  return dir;
}

async function createPgliteSql(): Promise<Sql> {
  // Embedded Postgres, imported on demand so it never loads on the PostgreSQL path.
  // One file-backed instance per process. The directory survives a restart of
  // this process. Production never reaches here: a missing DATABASE_URL fails
  // closed before this function is called.
  globalRef.__pgliteInstance__ ??= (async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    const dataDir = pgliteDataDir();
    const pg = new PGlite(dataDir, {
      parsers: {
        [OID_INT8]: Number,
        [OID_DATE]: identity,
        [OID_INTERVAL]: identity,
      },
    });
    await pg.waitReady;
    await pg.exec(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    return pg;
  })().catch((err) => {
    globalRef.__pgliteInstance__ = undefined;
    throw err;
  });
  const pg = await globalRef.__pgliteInstance__;

  // Apply migrations/ (the single schema source) so preview matches production.
  // SQL is inlined by the bundler via import.meta.glob (no runtime fs); applied
  // files are tracked in _migrations. The glob does not descend, so the opt-in
  // auth schema under migrations/auth/ stays out. Runs once per module instance
  // — so an HMR reload after adding a migration file applies it live — with
  // passes serialized on a global chain so concurrent callers never
  // double-apply.
  const migrate = async (): Promise<void> => {
    const migrations = import.meta.glob("/migrations/*.sql", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;
    const doneRows = await pg.query<{ name: string }>(
      "select name from _migrations",
    );
    const done = doneRows.rows.map((r) => r.name);
    for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) {
      // Apply + record atomically (parity with scripts/migrate.mjs) so a failed
      // statement can't leave a file half-applied but untracked.
      await pg.transaction(async (tx) => {
        await tx.exec(migrations[path]);
        await tx.query("insert into _migrations (name) values ($1)", [name]);
      });
    }
  };
  const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve())
    .catch(() => undefined) // an earlier failed pass must not wedge the chain
    .then(migrate);
  globalRef.__pgliteMigrateChain__ = pass;
  await pass;

  return toSql(async <T>(text: string, params: unknown[]) => {
    const result = await pg.query<T>(text, params);
    return result.rows;
  });
}

let sqlPromise: Promise<Sql> | null = null;

async function createSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    throw new Error(
      "@/lib/db is server-only — call getSql() from a createServerFn handler " +
        "or a server route loader, never from client code.",
    );
  }
  const mode = readDbMode();
  if (mode.source === "postgres") {
    if (!mode.url) {
      throw new Error("DATABASE_URL is required in production. PGlite fallback is disabled.");
    }
    return createPostgresSql(mode.url);
  }
  return createPgliteSql();
}

/**
 * Get the shared, **server-only** SQL client. PostgreSQL when the mode resolver
 * selects it, otherwise the local PGlite database. Memoized — safe to call per
 * request.
 *
 * Schema comes from `migrations/*.sql`, auto-applied before the first query on
 * PGlite. PostgreSQL is migrated by `npm run db:migrate` before the server starts.
 */
export function getSql(): Promise<Sql> {
  sqlPromise ??= createSql().catch((err) => {
    sqlPromise = null; // don't memoize failures — let the next call retry
    throw err;
  });
  return sqlPromise;
}

/**
 * The shared PGLite instance, with `migrations/*.sql` applied.
 * Throws unless this process explicitly selected the embedded database.
 */
export async function getPglite(): Promise<import("@electric-sql/pglite").PGlite> {
  if (readDbMode().source !== "pglite") {
    throw new Error("getPglite() is only available when the embedded PGlite database is selected");
  }
  await getSql();
  const pg = await globalRef.__pgliteInstance__;
  if (!pg) throw new Error("PGLite instance failed to initialize");
  return pg;
}

/**
 * Finish DB bootstrap before the server treats itself as ready.
 *
 * - **PGlite**: open the in-memory DB, apply `migrations/*.sql`, then `select 1`.
 * - **PostgreSQL**: `select 1` on the configured database. Migrations are not
 *   repeated here; the deploy runs them first.
 */
export async function ensureDbReady(): Promise<void> {
  const sql = await getSql();
  await sql`select 1 as ok`;
}

// PGlite migrates itself before the first request. PostgreSQL stays lazy.
// A missing production URL is remembered and reported by `/api/health` as 503
// instead of taking the whole server down while it is still starting.
const globalBoot = globalThis as typeof globalThis & {
  __pgBootstrapPromise__?: Promise<void>;
};
if (typeof window === "undefined" && process.env.npm_lifecycle_event !== "build") {
  try {
    if (readDbMode().source === "pglite") {
      globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
        globalBoot.__pgBootstrapPromise__ = undefined;
        console.error("[db] PGLite bootstrap failed:", err);
        throw err;
      });
    }
  } catch {
    // readDbMode already logged the configuration error.
  }
}
