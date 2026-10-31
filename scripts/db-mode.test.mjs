import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PRODUCTION_DATABASE_ERROR,
  databaseUrlFrom,
  migrationDecision,
  resolveDatabaseMode,
} from "./db-mode.mjs";

test("whitespace DATABASE_URL is unset", () => {
  assert.equal(databaseUrlFrom({ DATABASE_URL: "   " }), undefined);
  assert.equal(databaseUrlFrom({ DATABASE_URL: "\n\t" }), undefined);
  assert.equal(databaseUrlFrom({}), undefined);
  assert.equal(databaseUrlFrom({ DATABASE_URL: "  postgres://db/abyssal  " }), "postgres://db/abyssal");
});

test("local development without a URL uses explicit-free PGlite", () => {
  assert.deepEqual(resolveDatabaseMode({ NODE_ENV: "development" }), {
    source: "pglite",
    url: undefined,
  });
});

test("an explicit local PGlite mode works even when NODE_ENV is production", () => {
  assert.deepEqual(
    resolveDatabaseMode({ NODE_ENV: "production", ABYSSAL_DB: "pglite" }),
    { source: "pglite", url: undefined },
  );
});

test("a URL selects PostgreSQL", () => {
  assert.deepEqual(
    resolveDatabaseMode({ NODE_ENV: "development", DATABASE_URL: "postgres://db/abyssal" }),
    { source: "postgres", url: "postgres://db/abyssal" },
  );
  assert.deepEqual(resolveDatabaseMode({ ABYSSAL_DB: "neon", DATABASE_URL: "postgres://db/abyssal" }), {
    source: "postgres",
    url: "postgres://db/abyssal",
  });
});

test("production without DATABASE_URL fails closed", () => {
  assert.throws(
    () => resolveDatabaseMode({ NODE_ENV: "production" }),
    new RegExp(PRODUCTION_DATABASE_ERROR),
  );
  assert.throws(
    () => resolveDatabaseMode({ NODE_ENV: "production", DATABASE_URL: "  " }),
    new RegExp(PRODUCTION_DATABASE_ERROR),
  );
});

test("Railway and ABYSSAL_REQUIRE_DATABASE refuse a missing URL and refuse PGlite", () => {
  for (const env of [
    { RAILWAY_ENVIRONMENT: "production" },
    { RAILWAY_PROJECT_ID: "proj" },
    { ABYSSAL_REQUIRE_DATABASE: "1", NODE_ENV: "development" },
    { RAILWAY_ENVIRONMENT: "production", ABYSSAL_DB: "pglite", DATABASE_URL: "postgres://db/abyssal" },
  ]) {
    assert.throws(() => resolveDatabaseMode(env), new RegExp(PRODUCTION_DATABASE_ERROR));
  }
  assert.deepEqual(
    resolveDatabaseMode({
      RAILWAY_ENVIRONMENT: "production",
      DATABASE_URL: "postgres://railway/abyssal",
    }),
    { source: "postgres", url: "postgres://railway/abyssal" },
  );
});

test("ABYSSAL_DB=postgres without a URL fails even in development", () => {
  assert.throws(
    () => resolveDatabaseMode({ NODE_ENV: "development", ABYSSAL_DB: "postgres" }),
    new RegExp(PRODUCTION_DATABASE_ERROR),
  );
});

test("an unknown ABYSSAL_DB value fails", () => {
  assert.throws(
    () => resolveDatabaseMode({ ABYSSAL_DB: "sqlite" }),
    /ABYSSAL_DB must be "postgres" or "pglite"/,
  );
});

test("migrations fail closed in production and on Railway when the URL is missing", () => {
  assert.equal(migrationDecision({ NODE_ENV: "production" }).action, "fail");
  assert.equal(migrationDecision({ RAILWAY_SERVICE_ID: "svc" }).action, "fail");
  assert.equal(migrationDecision({ ABYSSAL_REQUIRE_DATABASE: "true" }).action, "fail");
  assert.match(migrationDecision({ NODE_ENV: "production" }).message, new RegExp(PRODUCTION_DATABASE_ERROR));
});

test("migrations skip locally and for an explicit PGlite preview", () => {
  assert.equal(migrationDecision({ NODE_ENV: "development" }).action, "skip");
  assert.equal(migrationDecision({ NODE_ENV: "production", ABYSSAL_DB: "pglite" }).action, "skip");
  assert.equal(
    migrationDecision({ NODE_ENV: "production", ABYSSAL_DB: "pglite", DATABASE_URL: "postgres://db/abyssal" })
      .action,
    "skip",
  );
});

test("migrations run when a PostgreSQL URL is selected", () => {
  const decision = migrationDecision({
    NODE_ENV: "production",
    RAILWAY_ENVIRONMENT: "production",
    DATABASE_URL: "postgres://railway/abyssal",
  });
  assert.equal(decision.action, "run");
  if (decision.action === "run") assert.equal(decision.url, "postgres://railway/abyssal");
});
