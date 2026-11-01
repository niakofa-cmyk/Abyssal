import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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

test("the workspace pins pnpm to the lockfile-compatible version", () => {
  const workspace = JSON.parse(read("../../package.json"));
  const lockfile = read("../../pnpm-lock.yaml");
  assert.equal(workspace.packageManager, "pnpm@10.26.1");
  assert.match(lockfile, /lockfileVersion: '9\.0'/);
});

test("a scaffold HTML renderer cannot override the TanStack server routes", () => {
  assert.equal(existsSync(join(root, "index.html")), false);
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
