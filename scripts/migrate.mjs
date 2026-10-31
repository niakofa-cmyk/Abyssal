#!/usr/bin/env node
/**
 * Deploy-time database migrator (node-postgres, `pg`).
 *
 * Railway runs this as `preDeployCommand`, not as part of `npm run build`.
 * The build must succeed with no database. Each file is applied in one
 * transaction, recorded in `_migrations`, and the pass holds a Postgres
 * advisory lock so overlapping deploys cannot apply the same file twice.
 *
 * No `DATABASE_URL` on a local machine skips. Production, Railway, or
 * `ABYSSAL_REQUIRE_DATABASE=1` without a URL exits 1. An explicit
 * `ABYSSAL_DB=pglite` (local preview only) also skips: that database migrates
 * itself at startup.
 *
 * The read is non-recursive, so `migrations/auth/` stays out until sign-in is on.
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { migrationDecision } from "./db-mode.mjs";
import { pendingMigrations } from "./migration-plan.mjs";
import { applyPendingMigrations } from "./migrate-apply.mjs";

const decision = migrationDecision(process.env);
if (decision.action === "fail") {
  console.error(`[migrate] ${decision.message}`);
  process.exit(1);
}
if (decision.action === "skip") {
  console.log(`[migrate] ${decision.message}`);
  process.exit(0);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

async function main() {
  let entries;
  try {
    entries = await readdir(migrationsDir);
  } catch {
    console.log("[migrate] no migrations/ directory — nothing to do.");
    return;
  }
  if (pendingMigrations(entries, []).length === 0) {
    console.log("[migrate] no migrations — nothing to do.");
    return;
  }

  const pool = new pg.Pool({ connectionString: decision.url, max: 1 });
  const client = await pool.connect();
  try {
    const count = await applyPendingMigrations({
      client,
      names: entries,
      readSql: (name) => readFile(join(migrationsDir, name), "utf8"),
      log: (line) => console.log(line),
    });
    console.log(count ? `[migrate] done — ${count} migration(s) applied.` : "[migrate] up to date.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[migrate] failed:", err?.message || err);
  for (const key of ["code", "detail", "hint", "position", "where"]) {
    if (err?.[key] != null) console.error(`[migrate]   ${key}: ${err[key]}`);
  }
  process.exit(1);
});
