import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { projectRoot } from "./with-app-env.mjs";

const root = projectRoot();
const read = (path) => readFileSync(join(root, path), "utf8");

test("the production build does not migrate and does not need a live database", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts.build.includes("db:migrate"), false);
  assert.equal(pkg.scripts.build.includes("migrate"), false);
  assert.equal(pkg.scripts["db:migrate"], "node scripts/migrate.mjs");
  assert.equal(pkg.scripts.start, "node .output/server/index.mjs");
});

test("Railway runs the Node server, migrates before start, and checks /api/health", () => {
  const railway = read("railway.toml");
  assert.match(railway, /builder = "RAILPACK"/);
  assert.match(railway, /buildCommand = "npm run build"/);
  assert.match(railway, /preDeployCommand = \["npm run db:migrate"\]/);
  assert.match(railway, /startCommand = "node \.output\/server\/index\.mjs"/);
  assert.match(railway, /healthcheckPath = "\/api\/health"/);
  assert.match(railway, /restartPolicyType = "ON_FAILURE"/);
  assert.doesNotMatch(railway, /vercel/i);
});

test("build and preview share the Node server preset", () => {
  const vite = read("vite.config.ts");
  assert.match(vite, /preset: "node-server"/);
  assert.doesNotMatch(vite, /preset:\s*"vercel"/);
  assert.match(vite, /serverDir:\s*"\.\/server"/);
  assert.match(vite, /command === "build" \|\| isPreview/);
});

test("the server resolves the database through the shared policy", () => {
  const db = read("src/lib/db.ts");
  assert.match(db, /resolveDatabaseMode/);
  assert.doesNotMatch(db, /databaseUrl \? "postgres" : "pglite"/);
  assert.doesNotMatch(db, /"neon"/);
});
