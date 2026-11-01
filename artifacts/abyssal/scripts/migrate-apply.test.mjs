import assert from "node:assert/strict";
import { test } from "node:test";
import { MIGRATION_ADVISORY_LOCK, applyPendingMigrations } from "./migrate-apply.mjs";

/**
 * In-memory stand-in for one Postgres session. Advisory locks serialize callers
 * the way `pg_advisory_lock` does. `_migrations` is a unique set of names.
 */
function memoryDatabase() {
  /** @type {Set<string>} */
  const applied = new Set();
  /** @type {string | null} */
  let holder = null;
  /** @type {Array<() => void>} */
  const waiters = [];

  /**
   * @param {string} id
   */
  function client(id) {
    return {
      /**
       * @param {string} text
       * @param {unknown[]} [params]
       */
      async query(text, params = []) {
        if (text.startsWith("SELECT pg_advisory_lock")) {
          assert.equal(params[0], MIGRATION_ADVISORY_LOCK);
          if (holder !== null) {
            await new Promise((resolve) => {
              waiters.push(resolve);
            });
          }
          holder = id;
          return { rows: [] };
        }
        if (text.startsWith("SELECT pg_advisory_unlock")) {
          assert.equal(holder, id);
          holder = null;
          const next = waiters.shift();
          if (next) next();
          return { rows: [] };
        }
        if (text.startsWith("SELECT name")) {
          return { rows: [...applied].map((name) => ({ name })) };
        }
        if (text.startsWith("INSERT")) {
          const name = String(params[0]);
          if (applied.has(name)) {
            const err = new Error("duplicate key");
            // @ts-expect-error test double matches node-pg
            err.code = "23505";
            throw err;
          }
          applied.add(name);
          return { rows: [] };
        }
        if (text.includes("BOOM")) throw new Error("bad migration");
        return { rows: [] };
      },
    };
  }

  return { applied, client };
}

test("a migration applies once and a second pass is a no-op", async () => {
  const db = memoryDatabase();
  const names = ["0002_abyssal_ocean.sql", "auth"];
  const readSql = async (name) => `create table ${name} ();`;
  const first = await applyPendingMigrations({
    client: db.client("a"),
    names,
    readSql,
  });
  const second = await applyPendingMigrations({
    client: db.client("b"),
    names,
    readSql,
  });
  assert.equal(first, 1);
  assert.equal(second, 0);
  assert.deepEqual([...db.applied], ["0002_abyssal_ocean.sql"]);
});

test("concurrent passes take the advisory lock and record each file once", async () => {
  const db = memoryDatabase();
  const names = ["0002_abyssal_ocean.sql"];
  const readSql = async () => "create table abyssal_ocean ();";
  const [left, right] = await Promise.all([
    applyPendingMigrations({ client: db.client("a"), names, readSql }),
    applyPendingMigrations({ client: db.client("b"), names, readSql }),
  ]);
  assert.equal(left + right, 1);
  assert.deepEqual([...db.applied], ["0002_abyssal_ocean.sql"]);
});

test("a failed migration rolls back, releases the lock, and can be retried", async () => {
  const db = memoryDatabase();
  const names = ["0002_abyssal_ocean.sql"];
  let attempt = 0;
  const readSql = async () => {
    attempt += 1;
    return attempt === 1 ? "BOOM" : "create table abyssal_ocean ();";
  };
  await assert.rejects(
    applyPendingMigrations({ client: db.client("a"), names, readSql }),
    /bad migration/,
  );
  assert.equal(db.applied.size, 0);
  const retried = await Promise.race([
    applyPendingMigrations({ client: db.client("b"), names, readSql }),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("advisory lock was not released")), 500);
    }),
  ]);
  assert.equal(retried, 1);
  assert.deepEqual([...db.applied], ["0002_abyssal_ocean.sql"]);
});
