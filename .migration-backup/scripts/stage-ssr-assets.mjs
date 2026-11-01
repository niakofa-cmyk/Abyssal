#!/usr/bin/env node
/**
 * The server-rendered document links the CSS emitted by the SSR build.
 * Vite's client build hashes that same stylesheet differently, and only the
 * client file is copied into the public assets directory. Publish the SSR
 * file too, or the production page requests a stylesheet that 404s.
 */
import { copyFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules/.nitro/vite/services/ssr/assets");
const dest = join(root, ".output/public/assets");

if (!existsSync(src) || !existsSync(dest)) {
  console.error("[stage-ssr-assets] production assets were not generated");
  process.exit(1);
}

let copied = 0;
for (const name of readdirSync(src)) {
  if (!name.endsWith(".css")) continue;
  const target = join(dest, name);
  if (existsSync(target)) continue;
  copyFileSync(join(src, name), target);
  copied += 1;
  console.log(`[stage-ssr-assets] ${name}`);
}
console.log(
  copied
    ? `[stage-ssr-assets] published ${copied} server-rendered asset(s)`
    : "[stage-ssr-assets] public assets already include the server-rendered files",
);
