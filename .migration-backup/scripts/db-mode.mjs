// @ts-check
/**
 * Shared database-mode policy for the running server (`src/lib/db.ts`) and the
 * deploy migrator (`scripts/migrate.mjs`).
 *
 * PostgreSQL is selected by `DATABASE_URL` (Railway, Neon, or any Postgres).
 * PGlite is the embedded database for local development and an explicit local
 * preview. It is never the silent fallback when production is missing its URL.
 *
 * An empty or whitespace `DATABASE_URL` is unset.
 */

export const PRODUCTION_DATABASE_ERROR =
  "DATABASE_URL is required in production. PGlite fallback is disabled.";

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {string | undefined}
 */
export function databaseUrlFrom(env) {
  const raw = env.DATABASE_URL;
  if (!nonEmpty(raw)) return undefined;
  return raw.trim();
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {boolean}
 */
export function isRailway(env) {
  return (
    nonEmpty(env.RAILWAY_ENVIRONMENT) ||
    nonEmpty(env.RAILWAY_PROJECT_ID) ||
    nonEmpty(env.RAILWAY_SERVICE_ID)
  );
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {boolean}
 */
export function requiresDatabase(env) {
  const flag = env.ABYSSAL_REQUIRE_DATABASE;
  if (!nonEmpty(flag)) return false;
  const normalized = flag.trim().toLowerCase();
  return normalized === "1" || normalized === "true";
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {"postgres" | "pglite" | ""}
 */
export function explicitDatabase(env) {
  const raw = env.ABYSSAL_DB;
  if (!nonEmpty(raw)) return "";
  const value = raw.trim().toLowerCase();
  if (value === "neon") return "postgres";
  if (value === "postgres" || value === "pglite") return value;
  throw new Error('ABYSSAL_DB must be "postgres" or "pglite".');
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {boolean}
 */
function productionLocked(env) {
  return isRailway(env) || requiresDatabase(env) || env.NODE_ENV === "production";
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ source: "postgres", url: string } | { source: "pglite", url: undefined }}
 */
export function resolveDatabaseMode(env) {
  const url = databaseUrlFrom(env);
  const explicit = explicitDatabase(env);
  const railway = isRailway(env);
  const required = requiresDatabase(env);

  if (explicit === "pglite") {
    if (railway || required) throw new Error(PRODUCTION_DATABASE_ERROR);
    return { source: "pglite", url: undefined };
  }

  if (explicit === "postgres" || railway || required) {
    if (!url) throw new Error(PRODUCTION_DATABASE_ERROR);
    return { source: "postgres", url };
  }

  if (url) return { source: "postgres", url };

  if (productionLocked(env)) throw new Error(PRODUCTION_DATABASE_ERROR);

  return { source: "pglite", url: undefined };
}

/**
 * What `npm run db:migrate` should do. The production build must not call this.
 * PGlite applies its own copy of the files when that mode is actually selected.
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ action: "run", url: string, message: string } | { action: "skip" | "fail", message: string }}
 */
export function migrationDecision(env) {
  const url = databaseUrlFrom(env);
  let explicit = "";
  try {
    explicit = explicitDatabase(env);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { action: "fail", message };
  }

  if (explicit === "pglite") {
    if (isRailway(env) || requiresDatabase(env)) {
      return { action: "fail", message: PRODUCTION_DATABASE_ERROR };
    }
    return {
      action: "skip",
      message: "ABYSSAL_DB=pglite — skipping (the embedded database migrates itself).",
    };
  }

  if (!url) {
    if (
      isRailway(env) ||
      requiresDatabase(env) ||
      env.NODE_ENV === "production" ||
      explicit === "postgres"
    ) {
      return { action: "fail", message: PRODUCTION_DATABASE_ERROR };
    }
    return {
      action: "skip",
      message: "DATABASE_URL not set — skipping (local embedded database migrates itself).",
    };
  }

  return { action: "run", url, message: "applying pending migrations." };
}
