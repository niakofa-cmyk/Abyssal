// @ts-check
/**
 * One migration pass against a single Postgres client.
 *
 * The advisory lock is held on that client for the whole pass, and `_migrations`
 * is read again after the lock is acquired. A second deploy waits, then sees the
 * rows the first deploy committed. The primary key on `_migrations.name` is the
 * backstop if a locker and a locker-less process overlap.
 */
import { pendingMigrations } from "./migration-plan.mjs";

/** Stable signed bigint. Same key for every Abyssal deploy. */
export const MIGRATION_ADVISORY_LOCK = "814257331";

/**
 * @typedef {{ rows?: Array<{ name?: string }> }} QueryResult
 * @typedef {{ query: (text: string, params?: unknown[]) => Promise<QueryResult>, code?: string }} MigrationClient
 */

/**
 * @param {{
 *   client: { query: (text: string, params?: unknown[]) => Promise<QueryResult> },
 *   names: Iterable<string>,
 *   readSql: (name: string) => Promise<string>,
 *   log?: (line: string) => void,
 * }} opts
 * @returns {Promise<number>}
 */
export async function applyPendingMigrations({ client, names, readSql, log = () => {} }) {
  await client.query("SELECT pg_advisory_lock($1::bigint)", [MIGRATION_ADVISORY_LOCK]);
  let count = 0;
  try {
    await client.query(
      "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
    );
    const appliedRows = await client.query("SELECT name FROM _migrations");
    const applied = (appliedRows.rows ?? []).map((row) => row.name).filter((name) => Boolean(name));
    for (const { name } of pendingMigrations(names, applied)) {
      const text = await readSql(name);
      try {
        await client.query("BEGIN");
        await client.query(text);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
      } catch (err) {
        try {
          await client.query("ROLLBACK");
        } catch {
          // The connection is already dead. Keep the original error.
        }
        const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
        if (code === "23505") {
          log(`[migrate] ${name} already recorded`);
          continue;
        }
        throw err;
      }
      log(`[migrate] applied ${name}`);
      count += 1;
    }
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1::bigint)", [MIGRATION_ADVISORY_LOCK]);
    } catch {
      // Unlock fails when the connection died. The session lock dies with it.
    }
  }
  return count;
}
