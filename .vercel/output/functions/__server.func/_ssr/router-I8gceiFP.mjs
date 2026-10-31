import { o as __toESM } from "../_runtime.mjs";
import { K as require_react, _ as createFileRoute, b as require_jsx_runtime, d as Scripts, f as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, v as createRootRoute, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as literal, c as string, i as discriminatedUnion, l as union, n as _enum, o as number, r as boolean, s as object, t as number$1, u as unknown } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-I8gceiFP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* Path-based preview hosts serve the dev server under `/{port_id}/` and strip
* that prefix before forwarding, so SSR sees `/` while the browser URL keeps the
* prefix. TanStack Start resets `basepath` on hydration, so a `rewrite` keeps
* client routing and generated links aligned with the public URL.
*/
var PATH_BASED_PREVIEW_HOSTS = /* @__PURE__ */ new Set([
	"preview.grok.genai.mil",
	"preview.grok.mil",
	"preview.grokgsac.com"
]);
var PORT_ID_PREFIX = /^\/hds-[a-z0-9]+-\d+-[a-z0-9]+(?=\/|$)/i;
function previewPathPrefix(hostname, pathname) {
	if (!PATH_BASED_PREVIEW_HOSTS.has(hostname.toLowerCase())) return void 0;
	return PORT_ID_PREFIX.exec(pathname)?.[0];
}
function prefixRewrite(prefix) {
	return {
		input: ({ url }) => {
			if (url.pathname === prefix) url.pathname = "/";
			else if (url.pathname.startsWith(`${prefix}/`)) url.pathname = url.pathname.slice(prefix.length);
			return url;
		},
		output: ({ url }) => {
			url.pathname = `${prefix}${url.pathname}`;
			return url;
		}
	};
}
function previewPathRewrite() {
	if (typeof window === "undefined") return void 0;
	const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
	return prefix ? prefixRewrite(prefix) : void 0;
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-D7JISE9O.css";
var APP_NAME = "Abyssal: The Last Ascent";
var Route$3 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, maximum-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#06141C"
			},
			{
				name: "description",
				content: "A cooperative underwater descent. Swim the ruined grid, share a submarine, and find out if the surface is still there."
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,520;9..144,680&family=Outfit:wght@360;520;640&display=swap"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter = () => import("./routes-D5dHLFS-.mjs");
var Route$2 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var _0002_abyssal_ocean_default = "create table if not exists abyssal_ocean (\n  id text primary key,\n  version bigint not null default 0,\n  body jsonb not null,\n  updated_at timestamptz not null default now()\n);\n";
/**
* Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
* (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
*
* Applied files are keyed by BASENAME, so the same file applies once no matter
* which directory it is globbed from. That is what makes the auth schema safe to
* copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
* a database that already has `0001_auth.sql` will not re-run it.
*
* Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
* out of scope for both until it is copied up.
*/
/**
* The `_migrations` key for a migration path (or bare filename).
* @param {string} path
* @returns {string}
*/
function migrationName(path) {
	return path.split("/").pop() ?? path;
}
/**
* @param {string} path
* @returns {boolean}
*/
function isMigrationFile(path) {
	return path.endsWith(".sql");
}
/**
* Migrations in `paths` that are not yet in `applied`, in apply order.
* Non-`.sql` entries (a `readdir` also yields `migrations/auth/`) are dropped.
* @param {Iterable<string>} paths
* @param {Iterable<string>} applied
* @returns {Array<{ name: string, path: string }>}
*/
function pendingMigrations(paths, applied) {
	const done = new Set(applied);
	return [...paths].filter(isMigrationFile).map((path) => ({
		name: migrationName(path),
		path
	})).sort((a, b) => a.name.localeCompare(b.name)).filter(({ name }) => !done.has(name));
}
var rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : void 0;
var databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : void 0;
/**
* Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
* sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
* the app has a working database even with nothing configured — the live preview
* included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
*/
var dbSource = databaseUrl ? "neon" : "pglite";
/**
* Init state lives on globalThis as promises: dev HMR creates new instances of
* this module, and two instances racing module-level state would open a second
* pool or run two concurrent PGLite migration passes (whose duplicate
* `_migrations` insert rejects — and would get memoized, poisoning every later
* `getSql()`). A failed init clears its slot so the next call retries.
*/
var globalRef$2 = globalThis;
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
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (v) => v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0];
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
function createNeonSql() {
	globalRef$2.__pgSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.t);
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({ connectionString: databaseUrl });
		return toSql(async (text, params) => {
			return (await pool.query(text, params)).rows;
		});
	})().catch((err) => {
		globalRef$2.__pgSqlPromise__ = void 0;
		throw err;
	});
	return globalRef$2.__pgSqlPromise__;
}
async function createPgliteSql() {
	globalRef$2.__pgliteInstance__ ??= (async () => {
		const { PGlite } = await import("../_libs/electric-sql__pglite.mjs").then((n) => n.t);
		const pg = new PGlite({ parsers: {
			[OID_INT8]: Number,
			[OID_DATE]: identity,
			[OID_INTERVAL]: identity
		} });
		await pg.waitReady;
		await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
		return pg;
	})().catch((err) => {
		globalRef$2.__pgliteInstance__ = void 0;
		throw err;
	});
	const pg = await globalRef$2.__pgliteInstance__;
	const migrate = async () => {
		const migrations = /* #__PURE__ */ Object.assign({ "/migrations/0002_abyssal_ocean.sql": _0002_abyssal_ocean_default });
		const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
		for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) await pg.transaction(async (tx) => {
			await tx.exec(migrations[path]);
			await tx.query("insert into _migrations (name) values ($1)", [name]);
		});
	};
	const pass = (globalRef$2.__pgliteMigrateChain__ ?? Promise.resolve()).catch(() => void 0).then(migrate);
	globalRef$2.__pgliteMigrateChain__ = pass;
	await pass;
	return toSql(async (text, params) => {
		return (await pg.query(text, params)).rows;
	});
}
var sqlPromise = null;
async function createSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only — call getSql() from a createServerFn handler or a server route loader, never from client code.");
	return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}
/**
* Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
* otherwise the local PGLite fallback. Memoized — safe to call per request.
*
* Schema comes from `migrations/*.sql`, auto-applied before the first query on
* both backends — define tables there, never inline in server functions.
*/
function getSql() {
	sqlPromise ??= createSql().catch((err) => {
		sqlPromise = null;
		throw err;
	});
	return sqlPromise;
}
/**
* Finish DB bootstrap before the server handles traffic.
*
* - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
*   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
* - **Neon**: no-op (pool is created lazily on first query).
*
* Vite `configureServer` awaits this at dev startup; production imports of this
* module kick it off immediately (see bottom of file).
*/
function ensureDbReady() {
	if (dbSource !== "pglite") return Promise.resolve();
	return getSql().then(() => void 0);
}
var globalBoot = globalThis;
if (typeof window === "undefined" && dbSource === "pglite") globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
	globalBoot.__pgBootstrapPromise__ = void 0;
	console.error("[db] PGLite bootstrap failed:", err);
	throw err;
});
var ZONES = [
	{
		id: "breach",
		name: "The Breach",
		depth: "140 m",
		state: "live"
	},
	{
		id: "plains",
		name: "Abyssal Plains",
		depth: "310 m",
		state: "live"
	},
	{
		id: "city",
		name: "Submerged City",
		depth: "90 m",
		state: "live"
	},
	{
		id: "works",
		name: "Industrial Depths",
		depth: "260 m",
		state: "live"
	},
	{
		id: "reef",
		name: "Living Reef",
		depth: "70 m",
		state: "live"
	},
	{
		id: "trench",
		name: "Abyssal Trench",
		depth: "640 m",
		state: "sealed"
	},
	{
		id: "upper",
		name: "Upper Ocean",
		depth: "40 m",
		state: "sealed"
	},
	{
		id: "surface",
		name: "Surface Frontier",
		depth: "0 m",
		state: "sealed"
	}
];
function cave(w, h) {
	const tiles = new Uint8Array(w * h);
	tiles.fill(1);
	return tiles;
}
function paint(tiles, w, h, x, y, rw, rh, tile) {
	for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) if (i >= 0 && j >= 0 && i < w && j < h) tiles[j * w + i] = tile;
}
function pillar(tiles, w, h, x) {
	paint(tiles, w, h, x, 4, 2, 4, 1);
	paint(tiles, w, h, x, 11, 2, 3, 1);
}
function withGates(region) {
	const primary = region.gates[0];
	return {
		...region,
		gateX: primary.x,
		gateDir: primary.dir,
		gateTo: primary.to,
		arrive: primary.arrive
	};
}
function tileAt(region, px, py) {
	const tx = Math.floor(px / 32);
	const ty = Math.floor(py / 32);
	if (tx < 0 || ty < 0 || tx >= region.w || ty >= region.h) return 1;
	return region.tiles[ty * region.w + tx] ?? 1;
}
function isSolid(region, px, py, mawDead) {
	const t = tileAt(region, px, py);
	if (t === 1 || t === 9) return true;
	if (t === 8 && !mawDead) return true;
	return false;
}
function buildBreach() {
	const w = 150;
	const h = 18;
	const tiles = cave(w, h);
	paint(tiles, w, h, 2, 4, 144, 10, 0);
	paint(tiles, w, h, 70, 2, 18, 3, 0);
	paint(tiles, w, h, 88, 13, 22, 3, 0);
	for (const x of [
		28,
		48,
		86,
		110,
		128
	]) pillar(tiles, w, h, x);
	paint(tiles, w, h, 58, 6, 3, 7, 2);
	for (let x = 8; x < 140; x += 7) {
		if (tiles[1950 + x] === 0) tiles[1950 + x] = 3;
		if (tiles[750 + (x + 3)] === 0 && x % 2 === 0) tiles[750 + (x + 3)] = 3;
	}
	paint(tiles, w, h, 14, 1, 12, 3, 0);
	paint(tiles, w, h, 18, 1, 4, 9, 0);
	for (let y = 2; y <= 7; y++) {
		if (tiles[y * w + 17] === 0) tiles[y * w + 17] = 3;
		if (tiles[y * w + 22] === 0) tiles[y * w + 22] = 3;
	}
	return withGates({
		id: "breach",
		name: "The Breach",
		depth: 140,
		w,
		h,
		tiles,
		spawn: {
			x: 192,
			y: 288
		},
		gates: [{
			x: 4224,
			dir: 1,
			to: "plains",
			arrive: {
				x: 256,
				y: 320
			},
			lock: "none"
		}]
	});
}
function buildPlains() {
	const w = 186;
	const h = 20;
	const tiles = cave(w, h);
	paint(tiles, w, h, 2, 3, 150, 14, 0);
	paint(tiles, w, h, 36, 15, 40, 3, 0);
	paint(tiles, w, h, 152, 5, 3, 11, 8);
	paint(tiles, w, h, 155, 4, 28, 12, 0);
	for (const x of [
		24,
		64,
		96
	]) paint(tiles, w, h, x, 4, 2, 5, 1);
	for (let x = 18; x < 140; x += 5) if (tiles[1488 + x] === 0) tiles[1488 + x] = x % 10 === 0 ? 5 : 4;
	for (let x = 160; x < 180; x += 4) if (tiles[1116 + x] === 0) tiles[1116 + x] = 3;
	return withGates({
		id: "plains",
		name: "Abyssal Plains",
		depth: 310,
		w,
		h,
		tiles,
		spawn: {
			x: 256,
			y: 320
		},
		gates: [{
			x: 102.4,
			dir: -1,
			to: "breach",
			arrive: {
				x: 3968,
				y: 288
			},
			lock: "none"
		}, {
			x: 5632,
			dir: 1,
			to: "city",
			arrive: {
				x: 256,
				y: 256
			},
			lock: "maw"
		}]
	});
}
function buildCity() {
	const w = 132;
	const h = 18;
	const tiles = cave(w, h);
	paint(tiles, w, h, 2, 3, 126, 12, 0);
	for (const x of [
		24,
		48,
		76,
		102
	]) {
		paint(tiles, w, h, x, 3, 5, 12, 1);
		paint(tiles, w, h, x, 7, 5, 3, 0);
	}
	for (const x of [
		36,
		62,
		90
	]) paint(tiles, w, h, x, 4, 2, 10, 6);
	paint(tiles, w, h, 14, 13, 10, 1, 2);
	return withGates({
		id: "city",
		name: "Submerged City",
		depth: 90,
		w,
		h,
		tiles,
		spawn: {
			x: 256,
			y: 256
		},
		gates: [{
			x: 83.2,
			dir: -1,
			to: "plains",
			arrive: {
				x: 5376,
				y: 288
			},
			lock: "none"
		}, {
			x: 3968,
			dir: 1,
			to: "works",
			arrive: {
				x: 256,
				y: 256
			},
			lock: "none"
		}]
	});
}
function buildWorks() {
	const w = 118;
	const h = 16;
	const tiles = cave(w, h);
	paint(tiles, w, h, 2, 4, 112, 8, 0);
	for (const x of [
		30,
		60,
		88
	]) paint(tiles, w, h, x, 4, 4, 3, 1);
	for (let x = 16; x < 100; x += 14) paint(tiles, w, h, x, 10, 6, 1, 2);
	for (let x = 42; x < 52; x++) if (tiles[826 + x] === 0) tiles[826 + x] = 4;
	return withGates({
		id: "works",
		name: "Industrial Depths",
		depth: 260,
		w,
		h,
		tiles,
		spawn: {
			x: 256,
			y: 256
		},
		gates: [{
			x: 89.6,
			dir: -1,
			to: "city",
			arrive: {
				x: 3648,
				y: 256
			},
			lock: "none"
		}, {
			x: 3520,
			dir: 1,
			to: "reef",
			arrive: {
				x: 256,
				y: 256
			},
			lock: "none"
		}]
	});
}
function buildReef() {
	const w = 124;
	const h = 16;
	const tiles = cave(w, h);
	paint(tiles, w, h, 2, 3, 108, 10, 0);
	for (let x = 12; x < 100; x += 4) {
		if (tiles[1488 + x] === 0) tiles[1488 + x] = 3;
		if (x % 8 === 0 && tiles[620 + x] === 0) tiles[620 + x] = 3;
	}
	for (const x of [
		32,
		54,
		80
	]) paint(tiles, w, h, x, 7, 5, 2, 7);
	paint(tiles, w, h, 112, 3, 4, 10, 9);
	return withGates({
		id: "reef",
		name: "Living Reef",
		depth: 70,
		w,
		h,
		tiles,
		spawn: {
			x: 256,
			y: 256
		},
		gates: [{
			x: 83.2,
			dir: -1,
			to: "works",
			arrive: {
				x: 3200,
				y: 256
			},
			lock: "none"
		}]
	});
}
function diverCreature(id, kind, region, x, y, hp) {
	return {
		id,
		kind,
		region,
		x,
		y,
		vx: 0,
		vy: 0,
		facing: 1,
		hp,
		hpMax: hp,
		homeX: x,
		homeY: y,
		state: "patrol",
		timer: 0,
		alive: true,
		hurt: 0,
		touchCd: 0,
		aimX: 1,
		aimY: 0,
		didHit: false,
		aggro: false,
		netX: x,
		netY: y
	};
}
function hull(partial) {
	return {
		...partial,
		vx: 0,
		vy: 0,
		facing: 1,
		fireCd: 0,
		shield: 0,
		shieldCd: 0,
		destroyed: false,
		seats: {
			pilot: null,
			gunner: null,
			engineer: null
		},
		netX: partial.x,
		netY: partial.y,
		seen: false
	};
}
function buildLayout() {
	const regions = {
		breach: buildBreach(),
		plains: buildPlains(),
		city: buildCity(),
		works: buildWorks(),
		reef: buildReef()
	};
	const creatures = [
		diverCreature("b-d1", "darter", "breach", 448, 256, 8),
		diverCreature("b-d2", "darter", "breach", 704, 352, 8),
		diverCreature("b-d3", "darter", "breach", 1280, 224, 8),
		diverCreature("b-d4", "darter", "breach", 3200, 320, 8),
		diverCreature("b-e1", "eel", "breach", 1088, 288, 36),
		diverCreature("b-e2", "eel", "breach", 2304, 384, 36),
		diverCreature("b-e3", "eel", "breach", 3712, 256, 42),
		diverCreature("b-h1", "hunter", "breach", 3136, 448, 78),
		diverCreature("p-d1", "darter", "plains", 640, 256, 8),
		diverCreature("p-d2", "darter", "plains", 1600, 384, 8),
		diverCreature("p-d3", "darter", "plains", 2560, 224, 8),
		diverCreature("p-e1", "eel", "plains", 896, 448, 40),
		diverCreature("p-e2", "eel", "plains", 2880, 352, 44),
		diverCreature("p-h1", "hunter", "plains", 1856, 288, 90),
		diverCreature("p-h2", "hunter", "plains", 3456, 416, 90),
		diverCreature("p-maw", "maw", "plains", 3904, 288, 480),
		diverCreature("c-d1", "darter", "city", 384, 320, 8),
		diverCreature("c-d2", "darter", "city", 1280, 192, 8),
		diverCreature("c-e1", "eel", "city", 1280, 352, 40),
		diverCreature("c-h1", "hunter", "city", 2752, 320, 84),
		diverCreature("w-e1", "eel", "works", 704, 256, 42),
		diverCreature("w-s1", "sentry", "works", 1408, 256, 46),
		diverCreature("w-s2", "sentry", "works", 2304, 224, 46),
		diverCreature("w-s3", "sentry", "works", 3136, 256, 52),
		diverCreature("r-d1", "darter", "reef", 576, 192, 8),
		diverCreature("r-d2", "darter", "reef", 1472, 320, 8),
		diverCreature("r-b1", "bloom", "reef", 832, 288, 70),
		diverCreature("r-b2", "bloom", "reef", 1856, 256, 70),
		diverCreature("r-b3", "bloom", "reef", 2880, 320, 80),
		diverCreature("r-e1", "eel", "reef", 2304, 192, 40)
	];
	const vehicles = [
		hull({
			id: "scooter-1",
			kind: "scooter",
			region: "breach",
			x: 2496,
			y: 108.8,
			hull: 70,
			hullMax: 70,
			energy: 80,
			energyMax: 100
		}),
		hull({
			id: "kite-1",
			kind: "kite",
			region: "plains",
			x: 1088,
			y: 384,
			hull: 160,
			hullMax: 160,
			energy: 100,
			energyMax: 100
		}),
		hull({
			id: "barrow-1",
			kind: "barrow",
			region: "city",
			x: 448,
			y: 288,
			hull: 260,
			hullMax: 260,
			energy: 140,
			energyMax: 140
		})
	];
	const pickup = (id, region, kind, x, y) => ({
		id,
		region,
		kind,
		x,
		y,
		taken: false
	});
	return {
		regions,
		creatures,
		vehicles,
		pickups: [
			pickup("o2-a", "breach", "o2", 640, 96),
			pickup("o2-a2", "breach", "o2", 768, 96),
			pickup("o2-b", "breach", "o2", 2304, 128),
			pickup("med-a", "breach", "med", 1088, 352),
			pickup("o2-c", "breach", "o2", 3200, 384),
			pickup("ammo-a", "breach", "ammo", 1984, 256),
			pickup("cell-a", "breach", "cell", 1408, 256),
			pickup("o2-d", "breach", "o2", 2688, 384),
			pickup("med-b", "breach", "med", 3456, 288),
			pickup("o2-e", "breach", "o2", 3840, 352),
			pickup("ammo-b", "breach", "ammo", 2368, 128),
			pickup("o2-f", "plains", "o2", 512, 288),
			pickup("o2-g", "plains", "o2", 960, 416),
			pickup("cell-b", "plains", "cell", 1280, 320),
			pickup("med-c", "plains", "med", 1664, 256),
			pickup("ammo-c", "plains", "ammo", 2240, 384),
			pickup("o2-h", "plains", "o2", 2816, 224),
			pickup("o2-i", "plains", "o2", 3328, 448),
			pickup("med-d", "plains", "med", 3584, 256),
			pickup("cell-c", "plains", "cell", 5312, 288),
			pickup("o2-j", "plains", "o2", 5440, 352),
			pickup("o2-k", "city", "o2", 320, 192),
			pickup("med-e", "city", "med", 576, 352),
			pickup("cell-d", "city", "cell", 640, 256),
			pickup("o2-l", "city", "o2", 1344, 192),
			pickup("ammo-d", "city", "ammo", 2112, 320),
			pickup("o2-m", "city", "o2", 3072, 352),
			pickup("cell-e", "works", "cell", 576, 224),
			pickup("o2-n", "works", "o2", 768, 288),
			pickup("med-f", "works", "med", 1600, 256),
			pickup("ammo-e", "works", "ammo", 2432, 288),
			pickup("o2-o", "works", "o2", 3008, 224),
			pickup("cell-f", "works", "cell", 3328, 288),
			pickup("o2-p", "reef", "o2", 512, 256),
			pickup("med-g", "reef", "med", 1280, 192),
			pickup("o2-q", "reef", "o2", 2240, 352),
			pickup("cell-g", "reef", "cell", 3072, 224)
		],
		markers: [
			{
				id: "m1",
				region: "breach",
				x: 640,
				y: 256,
				kind: "lore",
				logId: "breach-blackbox"
			},
			{
				id: "m2",
				region: "breach",
				x: 2112,
				y: 384,
				kind: "lore",
				logId: "breach-bio"
			},
			{
				id: "m3",
				region: "breach",
				x: 3328,
				y: 224,
				kind: "lore",
				logId: "breach-order"
			},
			{
				id: "m4",
				region: "breach",
				x: 1408,
				y: 208,
				kind: "upgrade"
			},
			{
				id: "m5",
				region: "breach",
				x: 2560,
				y: 160,
				kind: "repair"
			},
			{
				id: "m6",
				region: "plains",
				x: 704,
				y: 192,
				kind: "lore",
				logId: "plains-city"
			},
			{
				id: "m7",
				region: "plains",
				x: 3200,
				y: 192,
				kind: "lore",
				logId: "plains-maw"
			},
			{
				id: "m8",
				region: "plains",
				x: 5376,
				y: 256,
				kind: "lore",
				logId: "plains-surface"
			},
			{
				id: "m9",
				region: "plains",
				x: 1152,
				y: 320,
				kind: "repair"
			},
			{
				id: "m10",
				region: "city",
				x: 576,
				y: 192,
				kind: "lore",
				logId: "city-barrow"
			},
			{
				id: "m11",
				region: "city",
				x: 2240,
				y: 352,
				kind: "lore",
				logId: "city-tram"
			},
			{
				id: "m12",
				region: "city",
				x: 512,
				y: 384,
				kind: "repair"
			},
			{
				id: "m13",
				region: "works",
				x: 1152,
				y: 288,
				kind: "lore",
				logId: "works-vent"
			},
			{
				id: "m14",
				region: "works",
				x: 2560,
				y: 192,
				kind: "repair"
			},
			{
				id: "m15",
				region: "reef",
				x: 1088,
				y: 160,
				kind: "lore",
				logId: "reef-spore"
			},
			{
				id: "m16",
				region: "reef",
				x: 3328,
				y: 256,
				kind: "lore",
				logId: "reef-collar"
			}
		]
	};
}
var SWIM_ACCEL = 920;
var SWIM_DRAG = 3.4;
var SWIM_MAX = 156;
var O2_DRAIN = 4.4;
var ASCENT = [
	"breach",
	"plains",
	"city",
	"works",
	"reef"
];
function craftOf(kind) {
	if (kind === "barrow") return {
		accel: 480,
		drag: 1.65,
		max: 150,
		hw: 48,
		hh: 16,
		air: 22,
		repair: 74
	};
	if (kind === "kite") return {
		accel: 640,
		drag: 1.45,
		max: 230,
		hw: 36,
		hh: 14,
		air: 18,
		repair: 58
	};
	return {
		accel: 880,
		drag: 2.2,
		max: 198,
		hw: 16,
		hh: 8,
		air: 13,
		repair: 32
	};
}
function hullName(kind) {
	if (kind === "barrow") return "Barrow";
	if (kind === "kite") return "Kite";
	return "Scooter";
}
function clamp(v, a, b) {
	return Math.max(a, Math.min(b, v));
}
function hypot(ax, ay) {
	return Math.hypot(ax, ay);
}
function note(sim, text) {
	sim.toasts.unshift({
		id: ++sim.toastId,
		text,
		life: 3.4
	});
	sim.toasts = sim.toasts.slice(0, 4);
}
function discover(sim, id) {
	if (sim.discovered.includes(id)) return;
	sim.discovered.push(id);
	sim.events.push(`log:${id}`);
}
function makeDiver(partial) {
	return {
		region: "breach",
		vx: 0,
		vy: 0,
		facing: 1,
		hp: 100,
		hpMax: 100,
		o2: 100,
		o2Max: 100,
		ammo: partial.kind === "you" ? 12 : 10,
		cells: 0,
		iframe: 0,
		fireCd: 0,
		fireLatch: false,
		hypoxia: 0,
		warned: false,
		alive: true,
		respawn: 0,
		beaconX: partial.x,
		beaconY: partial.y,
		beaconRegion: "breach",
		vehicleId: null,
		seat: null,
		order: "follow",
		holdX: partial.x,
		holdY: partial.y,
		holdRegion: "breach",
		ax: 0,
		ay: 0,
		aimX: 1,
		aimY: 0,
		netX: partial.x,
		netY: partial.y,
		...partial
	};
}
function createSim(opts) {
	const layout = buildLayout();
	const spawn = layout.regions.breach.spawn;
	const divers = [];
	if (opts.crew !== false) {
		divers.push(makeDiver({
			id: opts.selfId,
			owner: opts.selfId,
			name: opts.name || "Unmarked",
			kind: "you",
			tint: "you",
			x: spawn.x,
			y: spawn.y
		}));
		if (opts.partner) divers.push(makeDiver({
			id: `${opts.selfId}p`,
			owner: opts.selfId,
			name: "Imani",
			kind: "partner",
			tint: "partner",
			x: spawn.x + 46,
			y: spawn.y + 8
		}));
		if (opts.soren) divers.push(makeDiver({
			id: `${opts.selfId}s`,
			owner: opts.selfId,
			name: "Soren",
			kind: "ai",
			tint: "ai",
			x: spawn.x + 18,
			y: spawn.y + 36
		}));
		divers[0].o2 = 70;
	}
	const chunks = (n) => Array.from({ length: n }, () => 0);
	const sim = {
		time: 0,
		nextId: 1,
		toastId: 0,
		regions: layout.regions,
		divers,
		vehicles: layout.vehicles,
		creatures: layout.creatures,
		projectiles: [],
		pickups: layout.pickups,
		markers: layout.markers,
		taken: [],
		discovered: [],
		explored: {
			breach: chunks(Math.ceil(layout.regions.breach.w / 4)),
			plains: chunks(Math.ceil(layout.regions.plains.w / 4)),
			city: chunks(Math.ceil(layout.regions.city.w / 4)),
			works: chunks(Math.ceil(layout.regions.works.w / 4)),
			reef: chunks(Math.ceil(layout.regions.reef.w / 4))
		},
		flags: {
			mawDead: false,
			upgraded: false,
			scooterSeen: false,
			kiteSeen: false,
			collarRead: false,
			barrowSeen: false
		},
		toasts: [],
		events: [],
		outbox: [],
		shake: 0,
		bossBanner: 0
	};
	if (opts.crew !== false) {
		note(sim, "You came to in the dark. The air is already leaving.");
		for (const d of divers) unstick(sim, d);
	}
	return sim;
}
function findDiver(sim, id) {
	return sim.divers.find((d) => d.id === id);
}
function findVehicle(sim, id) {
	if (!id) return void 0;
	return sim.vehicles.find((v) => v.id === id);
}
function overlapsSolid(region, x, y, hw, hh, mawDead) {
	return [
		[x - hw, y - hh],
		[x + hw, y - hh],
		[x - hw, y + hh],
		[x + hw, y + hh],
		[x, y]
	].some(([sx, sy]) => isSolid(region, sx, sy, mawDead));
}
function unstick(sim, body) {
	const region = sim.regions[body.region];
	if (!overlapsSolid(region, body.x, body.y, 10, 14, sim.flags.mawDead)) return;
	for (let r = 8; r < 280; r += 8) for (const [dx, dy] of [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1]
	]) {
		const nx = body.x + dx * r;
		const ny = body.y + dy * r;
		if (!overlapsSolid(region, nx, ny, 10, 14, sim.flags.mawDead)) {
			body.x = nx;
			body.y = ny;
			return;
		}
	}
}
function resolveAxis(region, body, hw, hh, axis, mawDead) {
	const x0 = Math.floor((body.x - hw) / 32);
	const x1 = Math.floor((body.x + hw - .01) / 32);
	const y0 = Math.floor((body.y - hh) / 32);
	const y1 = Math.floor((body.y + hh - .01) / 32);
	for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
		if (!isSolid(region, tx * 32 + 8, ty * 32 + 8, mawDead)) continue;
		const left = tx * 32;
		const top = ty * 32;
		const overlapX = Math.min(body.x + hw, left + 32) - Math.max(body.x - hw, left);
		const overlapY = Math.min(body.y + hh, top + 32) - Math.max(body.y - hh, top);
		if (overlapX <= 0 || overlapY <= 0) continue;
		if (axis === "x") {
			if (overlapY < 3) continue;
			body.x += body.x < left + 16 ? -overlapX : overlapX;
			body.vx = 0;
		} else {
			if (overlapX < 3) continue;
			body.y += body.y < top + 16 ? -overlapY : overlapY;
			body.vy = 0;
		}
	}
}
function moveBody(region, body, hw, hh, dt, mawDead) {
	const steps = clamp(Math.ceil(Math.max(Math.abs(body.vx), Math.abs(body.vy)) * dt / 8), 1, 8);
	const sdt = dt / steps;
	for (let i = 0; i < steps; i++) {
		body.x += body.vx * sdt;
		resolveAxis(region, body, hw, hh, "x", mawDead);
		body.y += body.vy * sdt;
		resolveAxis(region, body, hw, hh, "y", mawDead);
	}
}
function drive(vx, vy, ax, ay, accel, drag, max, dt) {
	let nx = vx + ax * accel * dt;
	let ny = vy + ay * accel * dt;
	const damp = Math.exp(-drag * dt);
	nx *= damp;
	ny *= damp;
	const s = Math.hypot(nx, ny);
	if (s > max) {
		nx = nx / s * max;
		ny = ny / s * max;
	}
	return {
		vx: nx,
		vy: ny
	};
}
function faceFrom(ax, vx, prev) {
	if (ax < -.25 || vx < -12) return -1;
	if (ax > .25 || vx > 12) return 1;
	return prev;
}
function boxHit(ax, ay, aw, ah, bx, by, bw, bh) {
	return Math.abs(ax - bx) < aw + bw && Math.abs(ay - by) < ah + bh;
}
function objective(sim, diver) {
	if (!diver) return "";
	const loft = sim.pickups.find((p) => p.id === "o2-a");
	if (loft && !loft.taken && diver.region === "breach" && !sim.flags.scooterSeen) return "A canister is in the loft above the west wreck. Swim up. The air will not wait.";
	if (!sim.flags.scooterSeen && diver.region === "breach") return "Air is leaving you. A motor is wedged in the upper gallery.";
	if (diver.region === "breach") return "The east lock still cycles. It drops into the plains.";
	if (!sim.flags.kiteSeen) return "A two-seat hull is in the wreck light. It will not swim itself.";
	if (!sim.flags.mawDead) return "The lantern is a mouth. It telegraphs. Share the shot.";
	if (!sim.flags.barrowSeen) return "The shelf door is open. A three-seat hull waits in the drowned city.";
	if (diver.region === "city" || diver.region === "plains") return "East of the glass, the works are still live. The reef is past the furnaces.";
	if (diver.region === "works") return "Furnaces and sentries. The reef shaft is the far lock.";
	return "Light from above. The upper lock is shut.";
}
function hullStage(v) {
	const p = v.hull / Math.max(1, v.hullMax);
	if (v.destroyed || v.hull <= 0) return 5;
	if (p < .15) return 4;
	if (p < .3) return 3;
	if (p < .5) return 2;
	if (p < .75) return 1;
	return 0;
}
function chip(sim, diver, amount) {
	if (!diver.alive || amount <= 0) return;
	diver.hp -= amount;
	if (diver.hp <= 0) {
		diver.iframe = 0;
		diver.hp = .1;
		hurtDiver(sim, diver.id, 1);
	}
}
function awake(sim, region) {
	return sim.divers.some((d) => d.alive && d.region === region);
}
function gateToward(sim, from, to) {
	const open = sim.regions[from].gates.filter((g) => g.lock === "none" || sim.flags.mawDead);
	const direct = open.find((g) => g.to === to);
	if (direct) return direct;
	const want = ASCENT.indexOf(to) > ASCENT.indexOf(from) ? 1 : -1;
	return open.find((g) => g.dir === want) ?? open[0];
}
function nearestFoe(sim, c) {
	let best;
	let bestD = c.kind === "maw" ? 560 : c.kind === "hunter" ? 340 : c.kind === "sentry" ? 320 : c.kind === "eel" ? 220 : c.kind === "bloom" ? 160 : 130;
	for (const d of sim.divers) {
		if (!d.alive || d.region !== c.region) continue;
		let dist = hypot(d.x - c.x, d.y - c.y);
		if ((c.kind === "hunter" || c.kind === "maw") && d.vehicleId) dist *= .7;
		if (dist < bestD) {
			bestD = dist;
			best = d;
		}
	}
	return c.kind === "darter" ? best : best;
}
function stepMaw(sim, c, foe, dt) {
	const region = sim.regions[c.region];
	if (!c.aggro && foe && hypot(foe.x - c.x, foe.y - c.y) < 430) {
		c.aggro = true;
		const extras = sim.divers.filter((d) => d.alive && d.region === c.region).length - 1;
		if (extras > 0) {
			c.hpMax = 480 + extras * 90;
			c.hp += extras * 70;
		}
		c.state = "warn";
		c.timer = .95;
		sim.bossBanner = 2.8;
		sim.events.push("bosswarn");
		note(sim, "The Lantern Maw has your scent. The lure flares before it moves.");
	}
	if (!c.aggro) {
		c.vx = Math.sin(sim.time * .6) * 28;
		c.vy = Math.cos(sim.time * .4) * 16;
		c.facing = faceFrom(0, c.vx, c.facing);
		moveBody(region, c, 46, 22, dt, sim.flags.mawDead);
		return;
	}
	c.timer -= dt;
	if (c.state === "warn") {
		c.vx *= Math.exp(-3 * dt);
		c.vy *= Math.exp(-3 * dt);
		if (foe && c.timer > .35) {
			c.aimX = foe.x - c.x;
			c.aimY = foe.y - c.y;
			c.facing = c.aimX < 0 ? -1 : 1;
		}
		if (c.timer <= 0) {
			const m = hypot(c.aimX, c.aimY) || 1;
			c.vx = c.aimX / m * 250;
			c.vy = c.aimY / m * 200;
			c.state = "dash";
			c.timer = .52;
			c.didHit = false;
			sim.events.push("dash");
		}
	} else if (c.state === "dash") {
		if (foe && !c.didHit && boxHit(c.x, c.y, 52, 24, foe.x, foe.y, 16, 18)) {
			c.didHit = true;
			strikeDiver(sim, foe, foe.vehicleId ? 20 : 26, true);
			sim.shake = Math.max(sim.shake, 8);
		}
		if (c.timer <= 0) {
			c.state = "open";
			c.timer = 1.15;
			sim.events.push("open");
		}
	} else if (c.state === "open") {
		c.vx *= Math.exp(-2.2 * dt);
		c.vy *= Math.exp(-2.2 * dt);
		if (c.timer <= 0) {
			c.state = "warn";
			c.timer = c.hp < c.hpMax * .45 ? .5 : .85;
			sim.events.push("bosswarn");
		}
	}
	moveBody(region, c, 46, 22, dt, sim.flags.mawDead);
}
function stepSentry(sim, c, foe, dt) {
	const region = sim.regions[c.region];
	c.timer -= dt;
	c.vx += (c.homeX - c.x) * .9 * dt;
	c.vy += (c.homeY - c.y) * .9 * dt + Math.sin(sim.time * 2 + c.homeX) * 18 * dt;
	if (c.state === "patrol") {
		if (foe) {
			c.state = "warn";
			c.timer = .55;
			sim.events.push("warn");
		}
	} else if (c.state === "warn") {
		c.vx *= Math.exp(-3 * dt);
		if (foe) {
			c.aimX = foe.x - c.x;
			c.aimY = foe.y - c.y;
			c.facing = c.aimX < 0 ? -1 : 1;
		}
		if (c.timer <= 0) {
			const m = hypot(c.aimX, c.aimY) || 1;
			sim.projectiles.push({
				id: sim.nextId++,
				region: c.region,
				x: c.x + c.aimX / m * 16,
				y: c.y + c.aimY / m * 8,
				vx: c.aimX / m * 168,
				vy: c.aimY / m * 168,
				life: 1.15,
				dmg: 12,
				team: "wild",
				ownerId: c.id,
				kind: "bite",
				hw: 5,
				hh: 5
			});
			sim.events.push("shot");
			c.state = "recover";
			c.timer = .85;
		}
	} else if (c.timer <= 0) {
		c.state = foe ? "warn" : "patrol";
		c.timer = c.state === "warn" ? .5 : 0;
	}
	moveBody(region, c, 14, 10, dt, sim.flags.mawDead);
	c.facing = faceFrom(0, c.vx, c.facing);
}
function stepBloom(sim, c, foe, dt) {
	c.timer -= dt;
	c.vx = 0;
	c.vy = 0;
	const near = !!foe && hypot(foe.x - c.x, foe.y - c.y) < 150;
	if (c.state === "patrol") {
		if (near) {
			c.state = "warn";
			c.timer = .7;
			sim.events.push("warn");
		}
		return;
	}
	if (c.state === "warn") {
		if (c.timer <= 0) {
			c.state = "pulse";
			c.timer = .28;
			c.didHit = false;
		}
		return;
	}
	if (c.state === "pulse") {
		if (!c.didHit) {
			c.didHit = true;
			for (const diver of sim.divers) {
				if (!diver.alive || diver.region !== c.region) continue;
				if (hypot(diver.x - c.x, diver.y - c.y) < 86) strikeDiver(sim, diver, diver.vehicleId ? 10 : 16, true);
			}
			sim.events.push("open");
		}
		if (c.timer <= 0) {
			c.state = "recover";
			c.timer = 1.45;
		}
		return;
	}
	if (c.timer <= 0) c.state = "patrol";
}
function stepCreature(sim, c, dt) {
	if (!c.alive) return;
	c.hurt = Math.max(0, c.hurt - dt);
	c.touchCd = Math.max(0, c.touchCd - dt);
	const region = sim.regions[c.region];
	const foe = nearestFoe(sim, c);
	if (c.kind === "maw") {
		stepMaw(sim, c, foe, dt);
		return;
	}
	if (c.kind === "sentry") {
		stepSentry(sim, c, foe, dt);
		return;
	}
	if (c.kind === "bloom") {
		stepBloom(sim, c, foe, dt);
		return;
	}
	if (c.kind === "darter") {
		if (foe && hypot(foe.x - c.x, foe.y - c.y) < 130) {
			const dx = c.x - foe.x;
			const dy = c.y - foe.y;
			const m = hypot(dx, dy) || 1;
			c.vx = dx / m * 92;
			c.vy = dy / m * 70;
		} else {
			c.vx += Math.sin(sim.time * 1.3 + c.homeX) * 30 * dt;
			c.vy += Math.cos(sim.time * .8 + c.homeY) * 20 * dt;
			c.vx += (c.homeX - c.x) * .5 * dt;
			c.vy += (c.homeY - c.y) * .5 * dt;
		}
		c.facing = faceFrom(0, c.vx, c.facing);
		moveBody(region, c, 10, 6, dt, sim.flags.mawDead);
		return;
	}
	c.timer -= dt;
	const lunge = c.kind === "hunter" ? 214 : 176;
	if (c.state === "patrol") {
		c.vx += (c.homeX - c.x) * .4 * dt;
		c.vy += (c.homeY - c.y) * .4 * dt;
		c.vx *= Math.exp(-1.5 * dt);
		if (foe) {
			c.state = "warn";
			c.timer = c.kind === "hunter" ? .4 : .55;
			c.didHit = false;
			sim.events.push("warn");
		}
	} else if (c.state === "warn") {
		c.vx *= Math.exp(-4 * dt);
		c.vy *= Math.exp(-4 * dt);
		if (foe) {
			c.aimX = foe.x - c.x;
			c.aimY = foe.y - c.y;
			c.facing = c.aimX < 0 ? -1 : 1;
		}
		if (c.timer <= 0) {
			const m = hypot(c.aimX, c.aimY) || 1;
			c.vx = c.aimX / m * lunge;
			c.vy = c.aimY / m * lunge * .8;
			c.state = "lunge";
			c.timer = .36;
		}
	} else if (c.state === "lunge") {
		if (foe && !c.didHit && c.touchCd <= 0 && boxHit(c.x, c.y, c.kind === "hunter" ? 26 : 20, 12, foe.x, foe.y, 12, 16)) {
			c.didHit = true;
			c.touchCd = .5;
			strikeDiver(sim, foe, c.kind === "hunter" ? 18 : 14, true);
		}
		if (c.timer <= 0) {
			c.state = "recover";
			c.timer = .7;
		}
	} else {
		c.vx *= Math.exp(-2 * dt);
		if (c.timer <= 0) c.state = "patrol";
	}
	moveBody(region, c, c.kind === "hunter" ? 22 : 16, 10, dt, sim.flags.mawDead);
	c.facing = faceFrom(0, c.vx, c.facing);
}
function strikeDiver(sim, diver, dmg, _fromWorld) {
	if (!diver.alive || diver.iframe > 0) return;
	if (diver.kind === "remote") {
		diver.iframe = .75;
		sim.outbox.push({
			k: "hurt",
			id: diver.id,
			dmg
		});
		return;
	}
	hurtDiver(sim, diver.id, dmg);
}
function hurtDiver(sim, id, dmg) {
	const diver = findDiver(sim, id);
	if (!diver || !diver.alive || diver.iframe > 0) return;
	let dealt = dmg;
	const vehicle = findVehicle(sim, diver.vehicleId);
	if (vehicle && !vehicle.destroyed) {
		if (vehicle.shield > 0) dmg *= .35;
		vehicle.hull -= dmg;
		dealt = dmg * (hullStage(vehicle) >= 3 ? .7 : .28);
		sim.events.push("hull");
		sim.shake = Math.max(sim.shake, 4);
		if (vehicle.hull <= 0) destroyVehicle(sim, vehicle);
	}
	diver.hp -= dealt;
	diver.iframe = .72;
	sim.events.push("hit");
	if (diver.hp <= 0) {
		diver.hp = 0;
		diver.alive = false;
		diver.respawn = diver.kind === "you" ? 2.6 : 4.5;
		if (diver.vehicleId) leaveSeat(sim, diver);
		sim.events.push(`dead:${diver.id}`);
		if (diver.kind === "you") note(sim, "Blackout. The beacon still has your name.");
	}
}
function destroyVehicle(sim, vehicle) {
	if (vehicle.destroyed) return;
	vehicle.destroyed = true;
	vehicle.hull = 0;
	vehicle.vx = 0;
	vehicle.vy = 0;
	for (const rider of sim.divers.filter((d) => d.vehicleId === vehicle.id)) leaveSeat(sim, rider);
	sim.events.push("destroy");
	sim.shake = 10;
	note(sim, `${hullName(vehicle.kind)} is open to the sea. Swim.`);
}
function leaveSeat(sim, diver) {
	const vehicle = findVehicle(sim, diver.vehicleId);
	if (vehicle) {
		if (vehicle.seats.pilot === diver.id) vehicle.seats.pilot = null;
		if (vehicle.seats.gunner === diver.id) vehicle.seats.gunner = null;
		if (vehicle.seats.engineer === diver.id) vehicle.seats.engineer = null;
		const off = diver.seat === "gunner" ? 36 : diver.seat === "engineer" ? 8 : -30;
		diver.x = vehicle.x + off * vehicle.facing;
		diver.y = vehicle.y + 28;
	}
	diver.vehicleId = null;
	diver.seat = null;
	diver.vx = 0;
	diver.vy = 0;
	unstick(sim, diver);
}
function takeSeat(sim, diver, vehicle, seat) {
	if (vehicle.seats[seat]) return;
	vehicle.seats[seat] = diver.id;
	diver.vehicleId = vehicle.id;
	diver.seat = seat;
	diver.vx = 0;
	diver.vy = 0;
	sim.events.push("board");
	if (diver.kind !== "you") return;
	if (seat === "engineer") note(sim, "Pumps are yours. Fire spends charge and braces the skin.");
	else if (seat === "gunner") note(sim, "Weapons station. You do not steer.");
	else if (vehicle.kind === "barrow") note(sim, "Barrow's helm. She is slow, and she holds air. Tab cycles the seats.");
	else if (vehicle.kind === "kite") note(sim, "Helm is yours. The other seat runs the tube.");
	else note(sim, "Scooter wakes. It shares what air it has.");
}
function board(sim, diver, vehicle) {
	const seat = !vehicle.seats.pilot ? "pilot" : vehicle.kind !== "scooter" && !vehicle.seats.gunner ? "gunner" : vehicle.kind === "barrow" && !vehicle.seats.engineer ? "engineer" : null;
	if (!seat) {
		if (diver.kind === "you") note(sim, vehicle.kind === "barrow" ? "All three seats are taken." : "Both seats are taken.");
		return;
	}
	takeSeat(sim, diver, vehicle, seat);
}
function insertDiver(sim, partial) {
	const diver = makeDiver({
		id: partial.id,
		owner: partial.owner,
		name: partial.name,
		kind: partial.kind,
		tint: partial.tint,
		x: partial.x,
		y: partial.y
	});
	if (partial.region) {
		diver.region = partial.region;
		diver.beaconRegion = partial.region;
		diver.holdRegion = partial.region;
	}
	diver.o2 = 70;
	diver.netX = diver.x;
	diver.netY = diver.y;
	sim.divers.push(diver);
	unstick(sim, diver);
	return diver;
}
function cycleSeat(sim, diver) {
	const vehicle = findVehicle(sim, diver.vehicleId);
	if (!vehicle || !diver.seat || vehicle.destroyed) return;
	const order = vehicle.kind === "barrow" ? [
		"pilot",
		"gunner",
		"engineer"
	] : vehicle.kind === "kite" ? ["pilot", "gunner"] : ["pilot"];
	if (order.length < 2) return;
	const next = order[(Math.max(0, order.indexOf(diver.seat)) + 1) % order.length];
	const prev = diver.seat;
	const otherId = vehicle.seats[next];
	vehicle.seats[prev] = otherId;
	vehicle.seats[next] = diver.id;
	diver.seat = next;
	if (otherId) {
		const other = findDiver(sim, otherId);
		if (other) other.seat = prev;
	}
	if (diver.kind === "you") note(sim, next === "pilot" ? "You take the helm." : next === "gunner" ? "You take the tube." : "You take the pumps. Fire braces the skin.");
}
function pressUse(sim, diver) {
	if (!diver.alive) return;
	if (diver.vehicleId) {
		leaveSeat(sim, diver);
		sim.events.push("exit");
		return;
	}
	let best;
	let bestD = 96;
	for (const vehicle of sim.vehicles) {
		if (vehicle.region !== diver.region || vehicle.destroyed) continue;
		const dist = hypot(vehicle.x - diver.x, vehicle.y - diver.y);
		if (dist < bestD) {
			bestD = dist;
			best = vehicle;
		}
	}
	if (best) {
		board(sim, diver, best);
		return;
	}
	for (const marker of sim.markers) {
		if (marker.region !== diver.region || marker.kind !== "upgrade") continue;
		if (hypot(marker.x - diver.x, marker.y - diver.y) > 52) continue;
		if (sim.flags.upgraded) {
			note(sim, "The bench already gave up its spring.");
			return;
		}
		if (diver.cells <= 0) {
			note(sim, "The bench wants an energy cell.");
			return;
		}
		diver.cells -= 1;
		sim.flags.upgraded = true;
		note(sim, "Harpoon relined. It hits harder.");
		sim.events.push("upgrade");
	}
}
function pressRepair(sim, diver) {
	if (!diver.alive || diver.cells <= 0 || diver.vehicleId) return;
	let best;
	let bestD = 170;
	for (const vehicle of sim.vehicles) {
		if (vehicle.region !== diver.region) continue;
		const dist = hypot(vehicle.x - diver.x, vehicle.y - diver.y);
		if (dist < bestD) {
			bestD = dist;
			best = vehicle;
		}
	}
	if (!best) {
		if (diver.kind === "you") note(sim, "No hull close enough to take the cell.");
		return;
	}
	diver.cells -= 1;
	best.destroyed = false;
	best.hull = clamp(best.hull + craftOf(best.kind).repair, 1, best.hullMax);
	best.energy = clamp(best.energy + 45, 0, best.energyMax);
	if (diver.kind === "you") note(sim, `${hullName(best.kind)} takes the cell. She will swim.`);
	sim.events.push("repair");
}
function grant(sim, diver, kind, amount) {
	if (kind === "o2") diver.o2 = clamp(diver.o2 + amount, 0, diver.o2Max);
	if (kind === "med") diver.hp = clamp(diver.hp + amount, 0, diver.hpMax);
	if (kind === "ammo") diver.ammo = clamp(diver.ammo + amount, 0, 28);
	if (kind === "cell") diver.cells += amount;
	diver.hypoxia = 0;
	diver.warned = false;
}
function applyGrant(sim, id, kind, amount) {
	const diver = findDiver(sim, id);
	if (!diver) return;
	grant(sim, diver, kind, amount);
	if (diver.kind === "you") {
		note(sim, `${kind === "o2" ? "Oxygen" : kind === "med" ? "Medicine" : kind === "ammo" ? "Darts" : "Energy cell"} aboard.`);
		sim.events.push("pickup");
	}
}
function collect(sim, diver, kind, amount) {
	if (diver.kind === "remote") {
		sim.outbox.push({
			k: "grant",
			id: diver.id,
			kind,
			amount
		});
		return;
	}
	applyGrant(sim, diver.id, kind, amount);
}
function nearestPrey(sim, diver, reach) {
	let best;
	let bestD = reach;
	for (const creature of sim.creatures) {
		if (!creature.alive || creature.region !== diver.region || creature.kind === "darter") continue;
		const dist = hypot(creature.x - diver.x, creature.y - diver.y);
		if (dist < bestD) {
			bestD = dist;
			best = creature;
		}
	}
	return best;
}
function thinkAi(sim, diver, auth) {
	if (!diver.alive) return;
	const you = sim.divers.find((d) => d.kind === "you" && d.owner === diver.owner);
	if (!you) return;
	if (auth && diver.order === "follow" && !diver.vehicleId && you.vehicleId && you.region === diver.region) {
		const vehicle = findVehicle(sim, you.vehicleId);
		if (vehicle && !vehicle.destroyed && hypot(vehicle.x - diver.x, vehicle.y - diver.y) < 110) {
			if (vehicle.kind === "barrow" && !vehicle.seats.engineer) {
				takeSeat(sim, diver, vehicle, "engineer");
				return;
			}
			if (vehicle.kind !== "scooter" && !vehicle.seats.gunner) {
				takeSeat(sim, diver, vehicle, "gunner");
				return;
			}
		}
	}
	let tx = you.x - you.facing * 36;
	let ty = you.y + 18;
	let region = you.region;
	if (diver.order === "hold") {
		tx = diver.holdX;
		ty = diver.holdY;
		region = diver.holdRegion;
	}
	if (diver.region !== region) {
		const gate = gateToward(sim, diver.region, region);
		if (gate) {
			tx = gate.x + gate.dir * 64;
			ty = diver.y;
		}
	}
	if (diver.vehicleId) {
		diver.ax = 0;
		diver.ay = 0;
		const hostile = nearestPrey(sim, diver, 280);
		if (hostile) {
			diver.aimX = hostile.x - diver.x;
			diver.aimY = hostile.y - diver.y;
			diver.fireLatch = true;
		} else {
			diver.aimX = diver.facing;
			diver.aimY = 0;
			diver.fireLatch = false;
		}
		return;
	}
	if (diver.o2 < 32) {
		const can = sim.pickups.find((p) => !p.taken && p.kind === "o2" && p.region === diver.region);
		if (can) {
			tx = can.x;
			ty = can.y;
			region = diver.region;
		}
	}
	const dx = tx - diver.x;
	const dy = ty - diver.y;
	const dist = hypot(dx, dy) || 1;
	if (dist < 26 && diver.region === region) {
		diver.ax = 0;
		diver.ay = 0;
	} else {
		diver.ax = clamp(dx / dist, -1, 1);
		diver.ay = clamp(dy / dist, -1, 1);
	}
	const prey = nearestPrey(sim, diver, 190);
	if (prey && diver.ammo > 0) {
		diver.aimX = prey.x - diver.x;
		diver.aimY = prey.y - diver.y;
		diver.fireLatch = true;
	} else {
		diver.aimX = diver.facing;
		diver.aimY = diver.ay * .35;
		diver.fireLatch = false;
	}
}
function aimDir(diver) {
	let x = diver.aimX;
	let y = diver.aimY;
	let m = hypot(x, y);
	if (m < .2) {
		x = diver.facing;
		y = diver.ay * .35;
		m = hypot(x, y) || 1;
	}
	return {
		x: x / m,
		y: y / m
	};
}
function tryFire(sim, diver) {
	if (!diver.alive || !diver.fireLatch) return;
	const vehicle = findVehicle(sim, diver.vehicleId);
	if (vehicle && !vehicle.destroyed) {
		if (diver.seat === "engineer") {
			if (vehicle.kind !== "barrow" || vehicle.shieldCd > 0 || vehicle.shield > 0 || vehicle.energy < 16) return;
			vehicle.shield = 1.35;
			vehicle.shieldCd = 2.7;
			vehicle.energy -= 16;
			sim.events.push("shield");
			if (diver.kind === "you") note(sim, "Brace up. The skin will take the next bite.");
			return;
		}
		if ((vehicle.seats.gunner ?? vehicle.seats.pilot) !== diver.id || vehicle.kind === "scooter") return;
		if (vehicle.fireCd > 0 || vehicle.energy < 6) return;
		const heavy = vehicle.kind === "barrow";
		const aim = aimDir(diver);
		const speed = heavy ? 250 : 290;
		sim.projectiles.push({
			id: sim.nextId++,
			region: vehicle.region,
			x: vehicle.x + aim.x * (heavy ? 62 : 48),
			y: vehicle.y + aim.y * 8,
			vx: aim.x * speed + vehicle.vx * .25,
			vy: aim.y * speed,
			life: heavy ? 1.5 : 1.3,
			dmg: heavy ? 34 : 26,
			team: "crew",
			ownerId: diver.id,
			kind: "torpedo",
			hw: heavy ? 12 : 10,
			hh: 4
		});
		vehicle.fireCd = vehicle.seats.gunner ? heavy ? .62 : .5 : 1.05;
		vehicle.energy -= heavy ? 9 : 7;
		sim.events.push("torpedo");
		return;
	}
	if (diver.vehicleId || diver.fireCd > 0 || diver.ammo <= 0) return;
	const bonus = sim.flags.upgraded ? 8 : 0;
	const aim = aimDir(diver);
	sim.projectiles.push({
		id: sim.nextId++,
		region: diver.region,
		x: diver.x + aim.x * 18,
		y: diver.y + aim.y * 14,
		vx: aim.x * 340,
		vy: aim.y * 340,
		life: .62,
		dmg: 14 + bonus,
		team: "crew",
		ownerId: diver.id,
		kind: "harpoon",
		hw: 8,
		hh: 3
	});
	diver.ammo -= 1;
	diver.fireCd = sim.flags.upgraded ? .32 : .42;
	sim.events.push("shot");
}
function killCreature(sim, c) {
	c.alive = false;
	c.hp = 0;
	sim.events.push(`kill:${c.kind}`);
	sim.shake = Math.max(sim.shake, c.kind === "maw" ? 12 : 3);
	if (c.kind !== "maw") return;
	sim.flags.mawDead = true;
	sim.bossBanner = 3.4;
	discover(sim, "plains-maw");
	note(sim, "The Maw folds. The collar behind it answers.");
	for (const d of sim.divers) {
		if (!d.alive || d.region !== c.region || d.kind === "remote") continue;
		d.ammo = clamp(d.ammo + 6, 0, 28);
		d.hp = clamp(d.hp + 22, 0, d.hpMax);
		d.cells += 1;
	}
	sim.events.push("victory");
}
function stepProjectiles(sim, dt) {
	const next = [];
	for (const p of sim.projectiles) {
		p.life -= dt;
		if (p.life <= 0) continue;
		p.x += p.vx * dt;
		p.y += p.vy * dt;
		if (isSolid(sim.regions[p.region], p.x, p.y, sim.flags.mawDead)) continue;
		if (p.team === "crew") {
			let hit = false;
			for (const c of sim.creatures) {
				if (!c.alive || c.region !== p.region) continue;
				const hw = c.kind === "maw" ? 54 : c.kind === "bloom" ? 30 : c.kind === "hunter" ? 26 : c.kind === "sentry" ? 16 : c.kind === "eel" ? 20 : 12;
				const hh = c.kind === "maw" ? 24 : 11;
				if (!boxHit(p.x, p.y, p.hw, p.hh, c.x, c.y, hw, hh)) continue;
				let dmg = p.dmg;
				if (c.kind === "maw" && c.state === "open") dmg *= 2;
				else if (c.kind === "maw") dmg *= .4;
				c.hp -= dmg;
				c.hurt = .12;
				if (c.kind !== "darter") c.aggro = true;
				hit = true;
				sim.events.push("impact");
				if (c.hp <= 0) killCreature(sim, c);
				break;
			}
			if (hit) continue;
		} else {
			let hit = false;
			for (const diver of sim.divers) {
				if (!diver.alive || diver.region !== p.region) continue;
				if (!boxHit(p.x, p.y, p.hw, p.hh, diver.x, diver.y, 14, 16)) continue;
				strikeDiver(sim, diver, p.dmg, true);
				hit = true;
				sim.events.push("hit");
				break;
			}
			if (hit) continue;
		}
		next.push(p);
	}
	sim.projectiles = next;
}
function stepVehicle(sim, vehicle, dt) {
	vehicle.fireCd = Math.max(0, vehicle.fireCd - dt);
	vehicle.shield = Math.max(0, vehicle.shield - dt);
	vehicle.shieldCd = Math.max(0, vehicle.shieldCd - dt);
	if (vehicle.destroyed) return;
	const pilot = vehicle.seats.pilot ? findDiver(sim, vehicle.seats.pilot) : void 0;
	const stage = hullStage(vehicle);
	const stageMul = stage >= 4 ? .45 : stage >= 3 ? .62 : stage >= 2 ? .8 : 1;
	const ax = pilot?.alive ? pilot.ax : 0;
	const ay = pilot?.alive ? pilot.ay : 0;
	const moving = Math.abs(ax) + Math.abs(ay) > .08;
	if (pilot?.alive) vehicle.energy = Math.max(0, vehicle.energy - (moving ? 6 : .45) * dt);
	if ((vehicle.seats.engineer ? findDiver(sim, vehicle.seats.engineer) : void 0)?.alive && vehicle.energy > 8 && vehicle.hull < vehicle.hullMax) {
		vehicle.hull = clamp(vehicle.hull + 7 * dt, 0, vehicle.hullMax);
		vehicle.energy = Math.max(0, vehicle.energy - 3.5 * dt);
	}
	const energyMul = vehicle.energy > 4 ? 1 : .4;
	const spec = craftOf(vehicle.kind);
	const driven = drive(vehicle.vx, vehicle.vy, ax, ay, spec.accel * stageMul * energyMul, spec.drag, spec.max * stageMul * energyMul, dt);
	vehicle.vx = driven.vx;
	vehicle.vy = driven.vy;
	vehicle.facing = faceFrom(ax, vehicle.vx, vehicle.facing);
	const tile = tileAt(sim.regions[vehicle.region], vehicle.x, vehicle.y);
	if (tile === 4) vehicle.vx += 48 * dt;
	if (tile === 5) vehicle.vx -= 48 * dt;
	if (tile === 6) vehicle.vy = Math.min(140, vehicle.vy + 180 * dt);
	if (tile === 2) {
		vehicle.hull -= 12 * dt;
		if (vehicle.hull <= 0) destroyVehicle(sim, vehicle);
	}
	moveBody(sim.regions[vehicle.region], vehicle, spec.hw, spec.hh, dt, sim.flags.mawDead);
	for (const diver of sim.divers) {
		if (diver.vehicleId !== vehicle.id) continue;
		const off = diver.seat === "gunner" ? 22 : diver.seat === "engineer" ? 0 : -16;
		diver.x = vehicle.x + off * vehicle.facing;
		diver.y = vehicle.y + (diver.seat === "engineer" ? 6 : 2);
		diver.region = vehicle.region;
		diver.facing = vehicle.facing;
		diver.vx = vehicle.vx;
		diver.vy = vehicle.vy;
	}
}
function drives(diver, selfId) {
	if (selfId === "*") return diver.kind !== "remote";
	return diver.owner === selfId;
}
function stepDiverBody(sim, diver, dt, selfId) {
	diver.fireCd = Math.max(0, diver.fireCd - dt);
	diver.iframe = Math.max(0, diver.iframe - dt);
	if (!diver.alive) {
		if (!drives(diver, selfId)) return;
		diver.respawn -= dt;
		if (diver.respawn <= 0) {
			diver.alive = true;
			diver.hp = 64;
			diver.o2 = 74;
			diver.region = diver.beaconRegion;
			diver.x = diver.beaconX;
			diver.y = diver.beaconY;
			diver.vx = 0;
			diver.vy = 0;
			unstick(sim, diver);
			if (diver.kind === "you") note(sim, "You come back on the beacon. Less air than before.");
		}
		return;
	}
	if (diver.vehicleId) return;
	if (!drives(diver, selfId)) {
		const dx = diver.netX - diver.x;
		const dy = diver.netY - diver.y;
		if (hypot(dx, dy) > 200) {
			diver.x = diver.netX;
			diver.y = diver.netY;
		} else {
			diver.x += dx * Math.min(1, dt * 11);
			diver.y += dy * Math.min(1, dt * 11);
		}
		return;
	}
	const region = sim.regions[diver.region];
	const driven = drive(diver.vx, diver.vy, diver.ax, diver.ay, SWIM_ACCEL, SWIM_DRAG, SWIM_MAX, dt);
	diver.vx = driven.vx;
	diver.vy = driven.vy;
	const tile = tileAt(region, diver.x, diver.y);
	if (tile === 4) diver.vx += 68 * dt;
	if (tile === 5) diver.vx -= 68 * dt;
	if (tile === 6) diver.vy = Math.min(170, diver.vy + 220 * dt);
	if (tile === 7) diver.o2 = Math.max(0, diver.o2 - 8 * dt);
	diver.facing = faceFrom(diver.ax, diver.vx, diver.facing);
	moveBody(region, diver, 10, 14, dt, sim.flags.mawDead);
	if (tile === 2) chip(sim, diver, 16 * dt);
	diver.o2 = Math.max(0, diver.o2 - O2_DRAIN * dt);
	if (diver.o2 <= 0) {
		diver.hypoxia += dt;
		if (!diver.warned && diver.kind === "you") {
			diver.warned = true;
			note(sim, "Lungs empty. A few seconds before the dark takes the rest.");
			sim.events.push("hypoxia");
		}
		if (diver.hypoxia > 3.1) chip(sim, diver, 11 * dt);
	} else {
		diver.hypoxia = 0;
		diver.warned = diver.o2 < 30;
	}
}
function refillIfRiding(sim, diver, dt) {
	const vehicle = findVehicle(sim, diver.vehicleId);
	if (!vehicle || !diver.alive) return;
	if (vehicle.destroyed || vehicle.energy <= 0) {
		diver.o2 = Math.max(0, diver.o2 - 1.6 * dt);
		return;
	}
	if (tileAt(sim.regions[vehicle.region], vehicle.x, vehicle.y) === 7 && vehicle.kind !== "barrow") diver.o2 = Math.max(0, diver.o2 - 6 * dt);
	diver.o2 = Math.min(diver.o2Max, diver.o2 + craftOf(vehicle.kind).air * dt);
	if (diver.o2 > 8) diver.hypoxia = 0;
}
function transit(sim, diver) {
	if (!diver.alive) return;
	const open = sim.regions[diver.region].gates.filter((g) => g.lock === "none" || sim.flags.mawDead);
	let gate;
	for (const candidate of open) {
		if (!(candidate.dir === 1 ? diver.x > candidate.x : diver.x < candidate.x)) continue;
		if (!gate || (candidate.dir === 1 ? candidate.x > gate.x : candidate.x < gate.x)) gate = candidate;
	}
	if (!gate) return;
	const dest = sim.regions[gate.to];
	const arriveX = gate.arrive.x;
	const arriveY = gate.arrive.y;
	if (diver.vehicleId) {
		const vehicle = findVehicle(sim, diver.vehicleId);
		if (!vehicle || vehicle.seats.pilot !== diver.id) return;
		vehicle.region = dest.id;
		vehicle.x = arriveX;
		vehicle.y = arriveY;
		vehicle.vx = 0;
		vehicle.vy = 0;
		for (const rider of sim.divers) {
			if (rider.vehicleId !== vehicle.id) continue;
			rider.region = dest.id;
			rider.beaconRegion = dest.id;
			rider.beaconX = arriveX;
			rider.beaconY = arriveY;
		}
		if (diver.kind === "you") {
			note(sim, dest.name);
			sim.events.push("region");
		}
		return;
	}
	diver.region = dest.id;
	diver.x = arriveX + (diver.kind === "partner" ? 34 : diver.kind === "ai" ? -24 : 0);
	diver.y = arriveY;
	diver.vx = 0;
	diver.vy = 0;
	diver.beaconRegion = dest.id;
	diver.beaconX = diver.x;
	diver.beaconY = diver.y;
	unstick(sim, diver);
	if (diver.kind === "you") {
		note(sim, dest.name);
		sim.events.push("region");
	}
}
function explore(sim, diver) {
	const idx = clamp(Math.floor(diver.x / 128), 0, sim.explored[diver.region].length - 1);
	sim.explored[diver.region][idx] = 1;
	for (const vehicle of sim.vehicles) {
		if (vehicle.region !== diver.region || vehicle.seen) continue;
		if (hypot(vehicle.x - diver.x, vehicle.y - diver.y) > 250) continue;
		vehicle.seen = true;
		if (vehicle.kind === "scooter") sim.flags.scooterSeen = true;
		if (vehicle.kind === "kite") sim.flags.kiteSeen = true;
		if (vehicle.kind === "barrow") sim.flags.barrowSeen = true;
		if (diver.kind === "you") note(sim, vehicle.kind === "barrow" ? "Barrow. Helm, tube, and pumps. She was built for the furnaces." : vehicle.kind === "kite" ? "Kite. Two seats — helm and tube. Battered, and yours if you board." : "A scooter. One rider. Kinder than lungs.");
	}
	for (const marker of sim.markers) {
		if (marker.kind !== "lore" || !marker.logId || marker.region !== diver.region) continue;
		if (hypot(marker.x - diver.x, marker.y - diver.y) > 40) continue;
		if (marker.logId === "plains-surface") sim.flags.collarRead = true;
		const before = sim.discovered.length;
		discover(sim, marker.logId);
		if (sim.discovered.length !== before && diver.kind === "you") note(sim, "A record. It is in the journal.");
	}
	for (const c of sim.creatures) if (c.region === diver.region && hypot(c.x - diver.x, c.y - diver.y) < 230) discover(sim, `beast:${c.kind}`);
}
function stepPickups(sim) {
	for (const pickup of sim.pickups) {
		if (pickup.taken) continue;
		for (const diver of sim.divers) {
			if (!diver.alive || diver.region !== pickup.region || diver.vehicleId) continue;
			if (hypot(pickup.x - diver.x, pickup.y - diver.y) > 40) continue;
			pickup.taken = true;
			const amount = pickup.kind === "o2" ? 52 : pickup.kind === "med" ? 38 : pickup.kind === "ammo" ? 8 : 1;
			collect(sim, diver, pickup.kind, amount);
			break;
		}
	}
}
function stepSim(sim, dt, auth, selfId) {
	sim.time += dt;
	sim.shake = Math.max(0, sim.shake - dt * 18);
	sim.bossBanner = Math.max(0, sim.bossBanner - dt);
	for (const toast of sim.toasts) toast.life -= dt;
	sim.toasts = sim.toasts.filter((t) => t.life > 0);
	sim.events.length = 0;
	for (const diver of sim.divers) if (diver.kind === "ai" && diver.owner === selfId) thinkAi(sim, diver, auth);
	if (auth) {
		for (const diver of sim.divers) tryFire(sim, diver);
		for (const vehicle of sim.vehicles) if (awake(sim, vehicle.region)) stepVehicle(sim, vehicle, dt);
		for (const creature of sim.creatures) if (awake(sim, creature.region)) stepCreature(sim, creature, dt);
		stepProjectiles(sim, dt);
		stepPickups(sim);
	} else {
		for (const creature of sim.creatures) {
			const dx = creature.netX - creature.x;
			const dy = creature.netY - creature.y;
			if (hypot(dx, dy) > 240) {
				creature.x = creature.netX;
				creature.y = creature.netY;
			} else {
				creature.x += dx * Math.min(1, dt * 12);
				creature.y += dy * Math.min(1, dt * 12);
			}
		}
		for (const vehicle of sim.vehicles) {
			const dx = vehicle.netX - vehicle.x;
			const dy = vehicle.netY - vehicle.y;
			if (hypot(dx, dy) > 220) {
				vehicle.x = vehicle.netX;
				vehicle.y = vehicle.netY;
			} else {
				vehicle.x += dx * Math.min(1, dt * 12);
				vehicle.y += dy * Math.min(1, dt * 12);
			}
		}
	}
	for (const diver of sim.divers) {
		stepDiverBody(sim, diver, dt, selfId);
		if (drives(diver, selfId)) {
			refillIfRiding(sim, diver, dt);
			transit(sim, diver);
			explore(sim, diver);
		}
	}
}
function exportWorld(sim) {
	return {
		t: sim.time,
		flags: { ...sim.flags },
		taken: sim.pickups.filter((p) => p.taken).map((p) => p.id),
		creatures: sim.creatures.map((c) => ({
			id: c.id,
			x: c.x,
			y: c.y,
			vx: c.vx,
			vy: c.vy,
			hp: c.hp,
			facing: c.facing,
			state: c.state,
			alive: c.alive,
			aggro: c.aggro,
			aimX: c.aimX,
			aimY: c.aimY,
			timer: c.timer
		})),
		vehicles: sim.vehicles.map((v) => ({
			id: v.id,
			x: v.x,
			y: v.y,
			vx: v.vx,
			vy: v.vy,
			facing: v.facing,
			hull: v.hull,
			energy: v.energy,
			destroyed: v.destroyed,
			shield: v.shield,
			seats: {
				pilot: v.seats.pilot,
				gunner: v.seats.gunner,
				engineer: v.seats.engineer
			},
			region: v.region
		})),
		projectiles: sim.projectiles.map((p) => ({
			id: p.id,
			region: p.region,
			x: p.x,
			y: p.y,
			vx: p.vx,
			vy: p.vy,
			life: p.life,
			kind: p.kind,
			team: p.team
		})),
		divers: sim.divers.map((d) => ({
			id: d.id,
			owner: d.owner,
			name: d.name,
			kind: d.kind === "you" ? "remote" : d.kind,
			region: d.region,
			x: d.x,
			y: d.y,
			vx: d.vx,
			vy: d.vy,
			facing: d.facing,
			hp: d.hp,
			o2: d.o2,
			alive: d.alive,
			vehicleId: d.vehicleId,
			seat: d.seat,
			tint: d.tint
		}))
	};
}
function importWorld(sim, snap, selfId) {
	sim.flags = {
		...sim.flags,
		...snap.flags
	};
	for (const id of snap.taken) {
		const p = sim.pickups.find((item) => item.id === id);
		if (p) p.taken = true;
	}
	for (const c of snap.creatures) {
		const local = sim.creatures.find((item) => item.id === c.id);
		if (!local) continue;
		Object.assign(local, {
			netX: c.x,
			netY: c.y,
			hp: c.hp,
			facing: c.facing,
			state: c.state,
			alive: c.alive,
			aggro: c.aggro,
			aimX: c.aimX,
			aimY: c.aimY,
			timer: c.timer
		});
		if (hypot(local.x - c.x, local.y - c.y) > 240) {
			local.x = c.x;
			local.y = c.y;
		}
	}
	for (const v of snap.vehicles) {
		const local = sim.vehicles.find((item) => item.id === v.id);
		if (!local) continue;
		local.netX = v.x;
		local.netY = v.y;
		local.vx = v.vx;
		local.vy = v.vy;
		local.facing = v.facing;
		local.hull = v.hull;
		local.energy = v.energy;
		local.destroyed = v.destroyed;
		local.region = v.region;
		local.shield = v.shield ?? 0;
		local.seats = {
			pilot: v.seats.pilot,
			gunner: v.seats.gunner,
			engineer: v.seats.engineer ?? null
		};
	}
	sim.projectiles = snap.projectiles.map((p) => ({
		...p,
		dmg: p.kind === "torpedo" ? 26 : 14,
		ownerId: "net",
		hw: 8,
		hh: 4
	}));
	for (const d of snap.divers) {
		if (d.owner === selfId) continue;
		let local = sim.divers.find((item) => item.id === d.id);
		if (!local) {
			local = makeDiver({
				id: d.id,
				owner: d.owner,
				name: d.name,
				kind: "remote",
				tint: "remote",
				x: d.x,
				y: d.y
			});
			sim.divers.push(local);
		}
		local.netX = d.x;
		local.netY = d.y;
		local.region = d.region;
		local.facing = d.facing;
		local.hp = d.hp;
		local.o2 = d.o2;
		local.alive = d.alive;
		local.vehicleId = d.vehicleId;
		local.seat = d.seat;
		local.name = d.name;
		local.kind = "remote";
	}
}
function applyOwn(sim, snap, selfId) {
	if (snap.owner === selfId) return;
	let local = sim.divers.find((d) => d.id === snap.id);
	if (!local) {
		local = makeDiver({
			id: snap.id,
			owner: snap.owner,
			name: snap.name,
			kind: "remote",
			tint: "remote",
			x: snap.x,
			y: snap.y
		});
		sim.divers.push(local);
	}
	local.netX = snap.x;
	local.netY = snap.y;
	local.vx = snap.vx;
	local.vy = snap.vy;
	local.region = snap.region;
	local.facing = snap.facing;
	local.hp = snap.hp;
	local.o2 = snap.o2;
	local.alive = snap.alive;
	local.ax = snap.ax;
	local.ay = snap.ay;
	if (typeof snap.aimX === "number") local.aimX = snap.aimX;
	if (typeof snap.aimY === "number") local.aimY = snap.aimY;
	local.vehicleId = snap.vehicleId;
	local.seat = snap.seat;
	local.name = snap.name;
	local.fireLatch = snap.fire;
}
function velocityOf(sim, selfId) {
	const you = sim.divers.find((d) => d.id === selfId);
	if (!you) return {
		vx: 0,
		vy: 0
	};
	const vehicle = findVehicle(sim, you.vehicleId);
	if (vehicle && you.seat === "pilot") return {
		vx: vehicle.vx,
		vy: vehicle.vy
	};
	return {
		vx: you.vx,
		vy: you.vy
	};
}
var REGIONS = [
	"breach",
	"plains",
	"city",
	"works",
	"reef"
];
var MAX_DIVERS = 16;
var QUIET_MS = 9e3;
var SHELVE_MS = 9e4;
function mint() {
	const bytes = /* @__PURE__ */ new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function cleanName(value) {
	return value.replace(/[<>]/g, "").trim().slice(0, 18) || "Unmarked";
}
function blankExplored(sectors) {
	return {
		breach: sectors.breach.explored.breach.map(() => 0),
		plains: sectors.plains.explored.plains.map(() => 0),
		city: sectors.city.explored.city.map(() => 0),
		works: sectors.works.explored.works.map(() => 0),
		reef: sectors.reef.explored.reef.map(() => 0)
	};
}
function createRegionSim(id) {
	const sim = createSim({
		selfId: id,
		name: id,
		partner: false,
		soren: false,
		crew: false
	});
	sim.creatures = sim.creatures.filter((c) => c.region === id);
	sim.vehicles = sim.vehicles.filter((v) => v.region === id);
	sim.pickups = sim.pickups.filter((p) => p.region === id);
	sim.markers = sim.markers.filter((m) => m.region === id);
	sim.divers = [];
	return sim;
}
function viewDiver(d) {
	return {
		id: d.id,
		name: d.name,
		region: d.region,
		x: d.x,
		y: d.y,
		vx: d.vx,
		vy: d.vy,
		facing: d.facing,
		hp: d.hp,
		o2: d.o2,
		ammo: d.ammo,
		cells: d.cells,
		alive: d.alive,
		vehicleId: d.vehicleId,
		seat: d.seat,
		aimX: d.aimX,
		aimY: d.aimY
	};
}
var Ocean = class Ocean {
	flags;
	sectors;
	players = /* @__PURE__ */ new Map();
	constructor() {
		const sectors = {};
		for (const id of REGIONS) sectors[id] = createRegionSim(id);
		this.sectors = sectors;
		this.flags = { ...sectors.breach.flags };
	}
	locate(token) {
		for (const id of REGIONS) {
			const diver = findDiver(this.sectors[id], token);
			if (diver) return {
				sim: this.sectors[id],
				diver,
				region: id
			};
		}
	}
	join(token, callsign) {
		const name = cleanName(callsign);
		if (token && this.players.has(token)) {
			const player = this.players.get(token);
			const quiet = player.adrift;
			player.callsign = name;
			player.heard = Date.now();
			player.adrift = false;
			const hadBody = !!this.locate(token);
			this.ensurePresent(token);
			const found = this.locate(token);
			if (found) found.diver.name = name;
			if (quiet && hadBody) this.toast(token, "Signal back. You are where the sea left you.");
			return token;
		}
		if (this.players.size >= MAX_DIVERS) {
			const victim = [...this.players.values()].filter((player) => player.stash && !this.locate(player.token)).sort((a, b) => a.heard - b.heard)[0];
			if (!victim) throw new Error("The ocean is holding as many divers as it can.");
			this.players.delete(victim.token);
		}
		const id = mint();
		const spawn = this.sectors.breach.regions.breach.spawn;
		const diver = insertDiver(this.sectors.breach, {
			id,
			owner: id,
			name,
			kind: "partner",
			tint: "remote",
			x: spawn.x + this.players.size % 4 * 36,
			y: spawn.y + this.players.size % 3 * 18,
			region: "breach"
		});
		diver.o2 = 70;
		this.players.set(id, {
			token: id,
			callsign: name,
			seen: [],
			explored: blankExplored(this.sectors),
			toasts: [],
			pending: [],
			heard: Date.now(),
			adrift: false,
			stash: null
		});
		this.toast(id, "You are alone in this sector. The air is already leaving.");
		return id;
	}
	/** Moves a diver between sector sims. Not exposed to clients. */
	place(token, region, x, y) {
		const found = this.locate(token);
		if (!found || found.diver.vehicleId) return;
		found.sim.divers = found.sim.divers.filter((d) => d.id !== token);
		found.diver.region = region;
		found.diver.x = x;
		found.diver.y = y;
		found.diver.vx = 0;
		found.diver.vy = 0;
		found.diver.netX = x;
		found.diver.netY = y;
		found.diver.beaconRegion = region;
		found.diver.beaconX = x;
		found.diver.beaconY = y;
		this.sectors[region].divers.push(found.diver);
	}
	setIntent(token, intent) {
		const player = this.players.get(token);
		if (!player) return;
		const quiet = player.adrift;
		const shelved = !!player.stash && !this.locate(token);
		player.heard = Date.now();
		this.ensurePresent(token);
		player.adrift = false;
		if (quiet && !shelved) this.toast(token, "Signal back. You are where the sea left you.");
		const found = this.locate(token);
		if (!found || !found.diver.alive) return;
		const { sim, diver } = found;
		diver.ax = Math.max(-1, Math.min(1, intent.ax || 0));
		diver.ay = Math.max(-1, Math.min(1, intent.ay || 0));
		diver.aimX = Number.isFinite(intent.aimX) ? intent.aimX : diver.facing;
		diver.aimY = Number.isFinite(intent.aimY) ? intent.aimY : 0;
		diver.fireLatch = !!intent.fire;
		if (intent.use) this.actUse(sim, diver);
		if (intent.repair) {
			const cells = diver.cells;
			pressRepair(sim, diver);
			if (diver.cells < cells) this.toast(diver.id, "The cell takes. The hull drinks it.");
		}
		if (intent.cycle) {
			const seat = diver.seat;
			cycleSeat(sim, diver);
			if (diver.seat && diver.seat !== seat) this.toast(diver.id, diver.seat === "pilot" ? "You have the helm." : diver.seat === "gunner" ? "You have the tube." : "You have the pumps.");
		}
	}
	step(dt) {
		for (const player of this.players.values()) {
			for (const crumb of player.toasts) crumb.life -= dt;
			player.toasts = player.toasts.filter((c) => c.life > 0).slice(0, 4);
		}
		const occupied = REGIONS.filter((id) => this.liveHere(id));
		for (const id of occupied) {
			const sim = this.sectors[id];
			sim.flags = { ...this.flags };
			stepSim(sim, dt, true, "*");
			this.pullFlags(sim);
			for (const event of sim.events) for (const diver of sim.divers) {
				const player = this.players.get(diver.id);
				if (!player) continue;
				player.pending.push(event);
				if (player.pending.length > 24) player.pending.splice(0, player.pending.length - 24);
			}
			for (const diver of sim.divers) {
				const player = this.players.get(diver.id);
				if (player) this.harvest(player, diver);
			}
		}
		this.transfer();
	}
	snapshot(token) {
		const found = this.locate(token);
		if (!found) throw new Error("That dive is gone. Enter the ocean again.");
		const { sim, diver } = found;
		sim.flags = { ...this.flags };
		const player = this.players.get(token);
		const events = player.pending.splice(0, player.pending.length);
		return {
			time: sim.time,
			flags: { ...this.flags },
			you: viewDiver(diver),
			divers: sim.divers.map(viewDiver),
			creatures: sim.creatures.map((c) => ({
				id: c.id,
				region: c.region,
				x: c.x,
				y: c.y,
				vx: c.vx,
				vy: c.vy,
				facing: c.facing,
				hp: c.hp,
				hpMax: c.hpMax,
				alive: c.alive,
				state: c.state,
				aimX: c.aimX,
				aimY: c.aimY,
				aggro: c.aggro
			})),
			vehicles: sim.vehicles.map((v) => ({
				id: v.id,
				region: v.region,
				x: v.x,
				y: v.y,
				vx: v.vx,
				vy: v.vy,
				facing: v.facing,
				hull: v.hull,
				hullMax: v.hullMax,
				energy: v.energy,
				energyMax: v.energyMax,
				destroyed: v.destroyed,
				shield: v.shield,
				seats: { ...v.seats },
				kind: v.kind
			})),
			hullWhere: REGIONS.flatMap((id) => this.sectors[id].vehicles.map((v) => ({
				id: v.id,
				region: v.region,
				destroyed: v.destroyed
			}))),
			projectiles: sim.projectiles.map((p) => ({
				id: p.id,
				region: p.region,
				x: p.x,
				y: p.y,
				vx: p.vx,
				vy: p.vy,
				life: p.life,
				kind: p.kind,
				team: p.team
			})),
			taken: sim.pickups.filter((p) => p.taken).map((p) => p.id),
			toasts: player.toasts.map((c) => c.text),
			events,
			seen: player.seen,
			explored: player.explored,
			roster: this.roster()
		};
	}
	roster() {
		return ZONES.map((zone) => {
			if (zone.state === "sealed" || !REGIONS.includes(zone.id)) return {
				id: zone.id,
				name: zone.name,
				depth: zone.depth,
				state: "sealed",
				divers: [],
				hulls: []
			};
			const id = zone.id;
			const sim = this.sectors[id];
			const maw = id === "plains" ? sim.creatures.find((c) => c.kind === "maw") : void 0;
			return {
				id,
				name: zone.name,
				depth: zone.depth,
				state: sim.divers.some((d) => d.alive) ? "live" : "sleep",
				divers: sim.divers.filter((d) => d.alive).map((d) => ({ name: this.players.get(d.id)?.adrift ? `${d.name} · adrift` : d.name })),
				boss: maw ? {
					name: "Lantern Maw",
					hp: maw.hp,
					hpMax: maw.hpMax,
					alive: maw.alive,
					phase: maw.alive ? maw.state : "down"
				} : void 0,
				hulls: sim.vehicles.map((v) => ({
					name: v.kind,
					riders: [
						v.seats.pilot,
						v.seats.gunner,
						v.seats.engineer
					].filter(Boolean).length,
					destroyed: v.destroyed
				}))
			};
		});
	}
	toBody() {
		const sectors = {};
		for (const id of REGIONS) {
			const sim = this.sectors[id];
			sectors[id] = {
				time: sim.time,
				creatures: sim.creatures.map((c) => ({
					id: c.id,
					region: c.region,
					x: c.x,
					y: c.y,
					vx: c.vx,
					vy: c.vy,
					facing: c.facing,
					hp: c.hp,
					hpMax: c.hpMax,
					alive: c.alive,
					state: c.state,
					aimX: c.aimX,
					aimY: c.aimY,
					aggro: c.aggro,
					timer: c.timer,
					hurt: c.hurt,
					didHit: c.didHit
				})),
				vehicles: sim.vehicles.map((v) => ({
					id: v.id,
					region: v.region,
					x: v.x,
					y: v.y,
					vx: v.vx,
					vy: v.vy,
					facing: v.facing,
					hull: v.hull,
					energy: v.energy,
					destroyed: v.destroyed,
					shield: v.shield,
					shieldCd: v.shieldCd,
					fireCd: v.fireCd,
					seats: { ...v.seats }
				})),
				taken: sim.pickups.filter((p) => p.taken).map((p) => p.id),
				projectiles: sim.projectiles.map((p) => ({
					id: p.id,
					region: p.region,
					x: p.x,
					y: p.y,
					vx: p.vx,
					vy: p.vy,
					life: p.life,
					kind: p.kind,
					team: p.team
				}))
			};
		}
		const divers = [];
		for (const id of REGIONS) for (const diver of this.sectors[id].divers) divers.push({
			...viewDiver(diver),
			beaconX: diver.beaconX,
			beaconY: diver.beaconY,
			beaconRegion: diver.beaconRegion,
			respawn: diver.respawn,
			ax: diver.ax,
			ay: diver.ay,
			fire: diver.fireLatch
		});
		return {
			v: 1,
			flags: { ...this.flags },
			sectors,
			divers,
			players: [...this.players.values()].map((p) => ({
				token: p.token,
				callsign: p.callsign,
				seen: p.seen,
				explored: p.explored,
				stash: p.stash
			}))
		};
	}
	static revive(body) {
		const ocean = new Ocean();
		if (body?.v !== 1 || !body.sectors || !body.flags) return ocean;
		ocean.flags = {
			...ocean.flags,
			...body.flags
		};
		for (const id of REGIONS) {
			const saved = body.sectors[id];
			const sim = ocean.sectors[id];
			if (!saved) continue;
			sim.time = saved.time || 0;
			for (const c of saved.creatures ?? []) {
				const local = sim.creatures.find((item) => item.id === c.id);
				if (!local) continue;
				local.x = c.x;
				local.y = c.y;
				local.vx = c.vx;
				local.vy = c.vy;
				local.facing = c.facing;
				local.hp = c.hp;
				local.alive = c.alive;
				local.state = c.state;
				local.aimX = c.aimX;
				local.aimY = c.aimY;
				local.aggro = c.aggro;
				local.timer = c.timer ?? 0;
				local.hurt = c.hurt ?? 0;
				local.didHit = !!c.didHit;
				local.netX = c.x;
				local.netY = c.y;
			}
			for (const v of saved.vehicles ?? []) {
				let local = sim.vehicles.find((item) => item.id === v.id);
				if (!local) {
					const holder = REGIONS.map((rid) => ocean.sectors[rid]).find((sector) => sector.vehicles.some((item) => item.id === v.id));
					local = holder?.vehicles.find((item) => item.id === v.id);
					if (local && holder) holder.vehicles = holder.vehicles.filter((item) => item.id !== v.id);
				}
				if (!local) continue;
				local.region = v.region;
				local.x = v.x;
				local.y = v.y;
				local.vx = v.vx;
				local.vy = v.vy;
				local.facing = v.facing;
				local.hull = v.hull;
				local.energy = v.energy;
				local.destroyed = v.destroyed;
				local.shield = v.shield ?? 0;
				local.shieldCd = v.shieldCd ?? 0;
				local.fireCd = v.fireCd ?? 0;
				local.seats = {
					pilot: v.seats?.pilot ?? null,
					gunner: v.seats?.gunner ?? null,
					engineer: v.seats?.engineer ?? null
				};
				local.netX = v.x;
				local.netY = v.y;
				if (!sim.vehicles.includes(local)) sim.vehicles.push(local);
			}
			for (const taken of saved.taken ?? []) {
				const pickup = sim.pickups.find((p) => p.id === taken);
				if (pickup) pickup.taken = true;
			}
			sim.projectiles = (saved.projectiles ?? []).map((p) => ({
				...p,
				dmg: p.kind === "torpedo" ? 26 : 14,
				ownerId: "ocean",
				hw: 8,
				hh: 4
			}));
			const next = sim.projectiles.reduce((max, p) => Math.max(max, p.id + 1), 1);
			sim.nextId = Math.max(sim.nextId, next);
		}
		for (const saved of body.divers ?? []) ocean.implant(saved);
		for (const meta of body.players ?? []) {
			const already = ocean.players.get(meta.token);
			if (already) {
				already.callsign = meta.callsign || already.callsign;
				already.seen = meta.seen ?? already.seen;
				already.explored = meta.explored ?? already.explored;
				already.stash = null;
				continue;
			}
			ocean.players.set(meta.token, {
				token: meta.token,
				callsign: meta.callsign || "Unmarked",
				seen: meta.seen ?? [],
				explored: meta.explored ?? blankExplored(ocean.sectors),
				toasts: [],
				pending: [],
				heard: Date.now(),
				adrift: false,
				stash: meta.stash ?? null
			});
		}
		return ocean;
	}
	sweep(now) {
		for (const player of [...this.players.values()]) {
			const quiet = now - player.heard;
			if (!player.adrift && !player.stash && quiet > QUIET_MS) {
				const found = this.locate(player.token);
				if (found?.diver.vehicleId) this.actUse(found.sim, found.diver);
				if (found) {
					found.diver.ax = 0;
					found.diver.ay = 0;
					found.diver.fireLatch = false;
					for (const other of found.sim.divers) {
						if (other.id === player.token || !other.alive) continue;
						this.toast(other.id, `${player.callsign}'s signal dropped. The seat is open.`);
					}
				}
				player.adrift = true;
				this.toast(player.token, "Signal lost. The beacon keeps your place, and the seat is open.");
			}
			if (quiet > SHELVE_MS && this.locate(player.token)) this.shelve(player.token);
		}
	}
	liveHere(id) {
		return this.sectors[id].divers.some((diver) => {
			if (this.players.get(diver.id)?.adrift) return false;
			return diver.alive || diver.respawn > 0;
		});
	}
	ensurePresent(token) {
		if (this.locate(token)) return;
		const player = this.players.get(token);
		if (!player) return;
		if (player.stash) {
			const diver = this.implant(player.stash);
			diver.name = player.callsign;
			player.stash = null;
			player.adrift = false;
			this.toast(token, "Signal back. You are where the sea left you.");
			return;
		}
		this.rebeacon(player);
	}
	shelve(token) {
		const found = this.locate(token);
		const player = this.players.get(token);
		if (!found || !player) return;
		if (found.diver.vehicleId) this.actUse(found.sim, found.diver);
		player.stash = this.saveDiver(found.diver);
		player.adrift = true;
		found.sim.divers = found.sim.divers.filter((diver) => diver.id !== token);
	}
	saveDiver(diver) {
		return {
			...viewDiver(diver),
			beaconX: diver.beaconX,
			beaconY: diver.beaconY,
			beaconRegion: diver.beaconRegion,
			respawn: diver.respawn,
			ax: 0,
			ay: 0,
			fire: false
		};
	}
	implant(saved) {
		const region = REGIONS.includes(saved.region) ? saved.region : "breach";
		for (const id of REGIONS) this.sectors[id].divers = this.sectors[id].divers.filter((diver) => diver.id !== saved.id);
		const diver = insertDiver(this.sectors[region], {
			id: saved.id,
			owner: saved.id,
			name: saved.name,
			kind: "partner",
			tint: "remote",
			x: saved.x,
			y: saved.y,
			region
		});
		diver.vx = saved.vx;
		diver.vy = saved.vy;
		diver.facing = saved.facing;
		diver.hp = saved.hp;
		diver.o2 = saved.o2;
		diver.ammo = saved.ammo;
		diver.cells = saved.cells;
		diver.alive = saved.alive;
		diver.vehicleId = saved.vehicleId;
		diver.seat = saved.seat;
		diver.aimX = saved.aimX;
		diver.aimY = saved.aimY;
		diver.beaconX = saved.beaconX;
		diver.beaconY = saved.beaconY;
		diver.beaconRegion = saved.beaconRegion;
		diver.respawn = saved.respawn;
		diver.ax = saved.ax;
		diver.ay = saved.ay;
		diver.fireLatch = saved.fire;
		diver.netX = saved.x;
		diver.netY = saved.y;
		if (!this.players.has(saved.id)) this.players.set(saved.id, {
			token: saved.id,
			callsign: saved.name,
			seen: [],
			explored: blankExplored(this.sectors),
			toasts: [],
			pending: [],
			heard: Date.now(),
			adrift: false,
			stash: null
		});
		return diver;
	}
	rebeacon(player) {
		const spawn = this.sectors.breach.regions.breach.spawn;
		insertDiver(this.sectors.breach, {
			id: player.token,
			owner: player.token,
			name: player.callsign,
			kind: "partner",
			tint: "remote",
			x: spawn.x,
			y: spawn.y,
			region: "breach"
		});
		this.toast(player.token, "The beacon pulled you back to the breach.");
	}
	actUse(sim, diver) {
		const had = diver.vehicleId;
		const seat = diver.seat;
		pressUse(sim, diver);
		if (had && !diver.vehicleId) this.toast(diver.id, "You slip off the hull.");
		else if (diver.vehicleId && diver.seat !== seat) this.toast(diver.id, diver.seat === "pilot" ? "You have the helm." : diver.seat === "gunner" ? "You have the tube." : "You have the pumps.");
	}
	toast(token, text) {
		const player = this.players.get(token);
		if (!player) return;
		player.toasts.unshift({
			text,
			life: 3.4
		});
		player.toasts = player.toasts.slice(0, 4);
	}
	pullFlags(sim) {
		if (sim.flags.mawDead) this.flags.mawDead = true;
		if (sim.flags.upgraded) this.flags.upgraded = true;
		if (sim.flags.scooterSeen) this.flags.scooterSeen = true;
		if (sim.flags.kiteSeen) this.flags.kiteSeen = true;
		if (sim.flags.collarRead) this.flags.collarRead = true;
		if (sim.flags.barrowSeen) this.flags.barrowSeen = true;
	}
	harvest(player, diver) {
		const row = player.explored[diver.region];
		if (row?.length) {
			const idx = Math.max(0, Math.min(row.length - 1, Math.floor(diver.x / 128)));
			row[idx] = 1;
		}
		const sim = this.sectors[diver.region];
		for (const marker of sim.markers) {
			if (marker.kind !== "lore" || !marker.logId || marker.region !== diver.region) continue;
			if (Math.hypot(marker.x - diver.x, marker.y - diver.y) > 40) continue;
			if (!player.seen.includes(marker.logId)) {
				player.seen.push(marker.logId);
				this.toast(player.token, "A record. It is in the journal.");
			}
		}
		for (const creature of sim.creatures) {
			if (!creature.alive || creature.region !== diver.region) continue;
			if (Math.hypot(creature.x - diver.x, creature.y - diver.y) > 230) continue;
			const id = `beast:${creature.kind}`;
			if (!player.seen.includes(id)) player.seen.push(id);
		}
	}
	transfer() {
		for (const id of REGIONS) {
			const sim = this.sectors[id];
			for (const vehicle of [...sim.vehicles]) {
				if (vehicle.region === id || !this.sectors[vehicle.region]) continue;
				sim.vehicles = sim.vehicles.filter((item) => item.id !== vehicle.id);
				this.sectors[vehicle.region].vehicles.push(vehicle);
			}
			for (const diver of [...sim.divers]) {
				if (diver.region === id || !this.sectors[diver.region]) continue;
				sim.divers = sim.divers.filter((item) => item.id !== diver.id);
				const dest = this.sectors[diver.region];
				const others = dest.divers.filter((item) => item.alive && item.id !== diver.id);
				dest.divers.push(diver);
				const sectorName = dest.regions[diver.region].name;
				if (others.length) {
					this.toast(diver.id, `Another diver is already in ${sectorName}.`);
					for (const other of others) this.toast(other.id, `${diver.name} enters this sector.`);
				} else this.toast(diver.id, sectorName);
			}
		}
	}
};
function glideOcean(sim, dt) {
	const k = Math.min(1, dt * 12);
	for (const diver of sim.divers) {
		diver.x += (diver.netX - diver.x) * k;
		diver.y += (diver.netY - diver.y) * k;
	}
	for (const creature of sim.creatures) {
		if (!creature.alive) continue;
		creature.x += (creature.netX - creature.x) * k;
		creature.y += (creature.netY - creature.y) * k;
	}
	for (const vehicle of sim.vehicles) {
		vehicle.x += (vehicle.netX - vehicle.x) * k;
		vehicle.y += (vehicle.netY - vehicle.y) * k;
	}
	for (const shot of sim.projectiles) {
		shot.life -= dt;
		shot.x += shot.vx * dt;
		shot.y += shot.vy * dt;
	}
	sim.projectiles = sim.projectiles.filter((shot) => shot.life > 0);
}
function applyOceanView(sim, selfId, snap) {
	sim.time = snap.time;
	sim.flags = { ...snap.flags };
	sim.discovered = [...snap.seen];
	for (const id of REGIONS) {
		const incoming = snap.explored[id];
		if (!incoming) continue;
		const next = sim.explored[id].slice();
		for (let i = 0; i < Math.min(next.length, incoming.length); i += 1) next[i] = incoming[i] ? 1 : 0;
		sim.explored[id] = next;
	}
	for (const pickup of sim.pickups) {
		if (pickup.region !== snap.you.region) continue;
		pickup.taken = snap.taken.includes(pickup.id);
	}
	const seenCreatures = new Set(snap.creatures.map((c) => c.id));
	for (const creature of sim.creatures) {
		const saved = snap.creatures.find((c) => c.id === creature.id);
		if (!saved) {
			if (creature.region === snap.you.region && !seenCreatures.has(creature.id)) creature.alive = false;
			continue;
		}
		creature.netX = saved.x;
		creature.netY = saved.y;
		if (creature.region !== saved.region || Math.hypot(creature.x - saved.x, creature.y - saved.y) > 180) {
			creature.x = saved.x;
			creature.y = saved.y;
		}
		creature.region = saved.region;
		creature.hp = saved.hp;
		creature.hpMax = saved.hpMax;
		creature.alive = saved.alive;
		creature.state = saved.state;
		creature.facing = saved.facing;
		creature.aimX = saved.aimX;
		creature.aimY = saved.aimY;
		creature.vx = saved.vx;
		creature.vy = saved.vy;
		creature.aggro = saved.aggro;
	}
	for (const where of snap.hullWhere) {
		const vehicle = sim.vehicles.find((item) => item.id === where.id);
		if (!vehicle) continue;
		vehicle.region = where.region;
		vehicle.destroyed = where.destroyed;
	}
	for (const saved of snap.vehicles) {
		const vehicle = sim.vehicles.find((item) => item.id === saved.id);
		if (!vehicle) continue;
		vehicle.netX = saved.x;
		vehicle.netY = saved.y;
		if (Math.hypot(vehicle.x - saved.x, vehicle.y - saved.y) > 180) {
			vehicle.x = saved.x;
			vehicle.y = saved.y;
		}
		vehicle.region = saved.region;
		vehicle.vx = saved.vx;
		vehicle.vy = saved.vy;
		vehicle.facing = saved.facing;
		vehicle.hull = saved.hull;
		vehicle.hullMax = saved.hullMax;
		vehicle.energy = saved.energy;
		vehicle.energyMax = saved.energyMax;
		vehicle.destroyed = saved.destroyed;
		vehicle.shield = saved.shield;
		vehicle.seats = { ...saved.seats };
	}
	sim.projectiles = snap.projectiles.map((p) => ({
		...p,
		dmg: p.kind === "torpedo" ? 26 : 14,
		ownerId: "ocean",
		hw: 8,
		hh: 4
	}));
	const ids = new Set(snap.divers.map((d) => d.id));
	sim.divers = sim.divers.filter((d) => ids.has(d.id));
	for (const saved of snap.divers) {
		let local = sim.divers.find((d) => d.id === saved.id);
		if (!local) local = insertDiver(sim, {
			id: saved.id,
			owner: saved.id,
			name: saved.name,
			kind: saved.id === selfId ? "you" : "remote",
			tint: saved.id === selfId ? "you" : "remote",
			x: saved.x,
			y: saved.y,
			region: saved.region
		});
		const far = local.region !== saved.region || Math.hypot(local.x - saved.x, local.y - saved.y) > 180;
		local.netX = saved.x;
		local.netY = saved.y;
		if (far) {
			local.x = saved.x;
			local.y = saved.y;
		}
		local.region = saved.region;
		local.hp = saved.hp;
		local.o2 = saved.o2;
		local.ammo = saved.ammo;
		local.cells = saved.cells;
		local.alive = saved.alive;
		local.vehicleId = saved.vehicleId;
		local.seat = saved.seat;
		local.facing = saved.facing;
		local.vx = saved.vx;
		local.vy = saved.vy;
		local.name = saved.name;
		local.kind = saved.id === selfId ? "you" : "remote";
		local.tint = saved.id === selfId ? "you" : "remote";
		if (saved.id !== selfId) {
			local.aimX = saved.aimX;
			local.aimY = saved.aimY;
		}
	}
	sim.toasts = snap.toasts.map((text, index) => ({
		id: index + 1,
		text,
		life: 2.4
	}));
}
var BUILD = 2;
var globalRef$1 = globalThis;
var tail = Promise.resolve();
function exclusive(fn) {
	const run = tail.then(fn, fn);
	tail = run.then(() => void 0, () => void 0);
	return run;
}
function asBody(value) {
	if (!value) return null;
	if (typeof value === "string") try {
		return JSON.parse(value);
	} catch {
		return null;
	}
	if (typeof value === "object") return value;
	return null;
}
async function persist(rt) {
	const sql = await getSql();
	const body = JSON.stringify(rt.ocean.toBody());
	if (rt.version <= 0) {
		const inserted = await sql.query(`insert into abyssal_ocean (id, version, body) values ('world', 1, $1::jsonb)
       on conflict (id) do nothing
       returning version`, [body]);
		if (inserted[0]) {
			rt.version = Number(inserted[0].version);
			return;
		}
	}
	const updated = await sql.query(`update abyssal_ocean set body = $1::jsonb, version = version + 1, updated_at = now()
     where id = 'world' and version = $2
     returning version`, [body, rt.version]);
	if (!updated[0]) throw new Error("stale");
	rt.version = Number(updated[0].version);
}
async function pull(rt) {
	const row = (await (await getSql()).query("select version, body from abyssal_ocean where id = 'world'", []))[0];
	if (!row) {
		rt.version = 0;
		return;
	}
	const version = Number(row.version);
	if (version === rt.version) return;
	const body = asBody(row.body);
	if (body) rt.ocean = Ocean.revive(body);
	rt.version = version;
}
async function ensure() {
	const existing = globalRef$1.__abyssalOcean;
	if (existing && existing.build === BUILD) return existing;
	if (existing?.timer) clearInterval(existing.timer);
	let ocean = new Ocean();
	let version = 0;
	try {
		const rows = await (await getSql()).query("select version, body from abyssal_ocean where id = 'world'", []);
		const body = asBody(rows[0]?.body);
		if (body) ocean = Ocean.revive(body);
		if (rows[0]) version = Number(rows[0].version) || 0;
	} catch (err) {
		console.error("[ocean] journal unreadable", err);
	}
	const runtime = {
		build: BUILD,
		ocean,
		version,
		last: Date.now(),
		savedAt: Date.now(),
		timer: null
	};
	globalRef$1.__abyssalOcean = runtime;
	runtime.timer = setInterval(() => {
		exclusive(async () => {
			const rt = globalRef$1.__abyssalOcean;
			if (!rt || rt.build !== BUILD) return;
			const now = Date.now();
			const gap = now - rt.last;
			rt.last = now;
			rt.ocean.sweep(now);
			if (!REGIONS_BUSY(rt.ocean)) return;
			const steps = Math.max(1, Math.min(3, Math.round(gap / 50)));
			for (let i = 0; i < steps; i += 1) rt.ocean.step(1 / 20);
			if (now - rt.savedAt > 400) {
				rt.savedAt = now;
				try {
					await persist(rt);
				} catch (err) {
					if (err instanceof Error && err.message === "stale") {
						await pull(rt);
						return;
					}
					console.error("[ocean] journal failed", err);
				}
			}
		});
	}, 50);
	return runtime;
}
function REGIONS_BUSY(ocean) {
	return [
		"breach",
		"plains",
		"city",
		"works",
		"reef"
	].some((id) => ocean.sectors[id].divers.some((d) => d.alive || d.respawn > 0));
}
async function catchUp(rt) {
	const now = Date.now();
	rt.ocean.sweep(now);
	const gap = now - rt.last;
	if (gap < 40) return;
	const steps = Math.max(1, Math.min(4, Math.round(gap / 50)));
	for (let i = 0; i < steps; i += 1) rt.ocean.step(1 / 20);
	rt.last = now;
}
async function save(rt) {
	try {
		await persist(rt);
		rt.savedAt = Date.now();
	} catch (err) {
		if (err instanceof Error && err.message === "stale") {
			await pull(rt);
			return;
		}
		console.error("[ocean] journal failed", err);
	}
}
async function oceanRoster() {
	return exclusive(async () => {
		const rt = await ensure();
		return {
			roster: rt.ocean.roster(),
			flags: rt.ocean.flags
		};
	});
}
async function oceanJoin(token, callsign) {
	return exclusive(async () => {
		const rt = await ensure();
		const id = rt.ocean.join(token, callsign);
		await save(rt);
		return {
			token: id,
			snap: rt.ocean.snapshot(id)
		};
	});
}
async function oceanSync(token, input) {
	return exclusive(async () => {
		const rt = await ensure();
		if (!rt.ocean.players.has(token)) return null;
		rt.ocean.setIntent(token, input);
		await catchUp(rt);
		if (Date.now() - rt.savedAt > 400) await save(rt);
		if (!rt.ocean.players.has(token)) return null;
		return {
			token,
			snap: rt.ocean.snapshot(token)
		};
	});
}
var intent = object({
	ax: number(),
	ay: number(),
	aimX: number(),
	aimY: number(),
	fire: boolean(),
	use: boolean().optional(),
	repair: boolean().optional(),
	cycle: boolean().optional()
});
var bodySchema = discriminatedUnion("action", [
	object({ action: literal("roster") }),
	object({
		action: literal("join"),
		token: string().nullable().optional(),
		callsign: string().optional()
	}),
	object({
		action: literal("sync"),
		token: string(),
		input: intent
	})
]);
async function handle$1({ request }) {
	let json;
	try {
		json = await request.json();
	} catch {
		return Response.json({
			ok: false,
			error: "The ocean could not read that."
		}, { status: 400 });
	}
	const parsed = bodySchema.safeParse(json);
	if (!parsed.success) return Response.json({
		ok: false,
		error: "The ocean refused that."
	}, { status: 400 });
	try {
		if (parsed.data.action === "roster") {
			const data = await oceanRoster();
			return Response.json({
				ok: true,
				...data
			});
		}
		if (parsed.data.action === "join") {
			const data = await oceanJoin(parsed.data.token ?? null, parsed.data.callsign ?? "");
			return Response.json({
				ok: true,
				...data
			});
		}
		const data = await oceanSync(parsed.data.token, parsed.data.input);
		if (!data) return Response.json({
			ok: false,
			error: "That dive is gone. Enter the ocean again."
		}, { status: 404 });
		return Response.json({
			ok: true,
			...data
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "The sea did not answer.";
		return Response.json({
			ok: false,
			error: message
		}, { status: 400 });
	}
}
var Route$1 = createFileRoute("/api/ocean")({ server: { handlers: { POST: handle$1 } } });
/**
* WebRTC signaling over the app database (Neon deployed, PGLite in preview).
* Only rendezvous traffic passes through here — roster + SDP/ICE relay while a
* mesh forms; game data then flows peer-to-peer.
*/
var ID = string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
var signalSchema = object({
	op: literal("signal"),
	room: ID,
	from: ID,
	to: ID,
	kind: _enum([
		"offer",
		"answer",
		"ice"
	]),
	payload: unknown().refine((v) => v !== void 0 && JSON.stringify(v).length <= 32768, { message: "payload too large" })
});
var leaveSchema = object({
	op: literal("leave"),
	room: ID,
	peer: ID
});
var postSchema = discriminatedUnion("op", [signalSchema, leaveSchema]);
var PEER_TTL_SECONDS = 30;
var SIGNAL_TTL_SECONDS = 60;
var globalRef = globalThis;
function ensureSchema(sql) {
	globalRef.__rtcSchemaPromise__ ??= (async () => {
		await sql.query(`CREATE TABLE IF NOT EXISTS webrtc_peers (
         room TEXT NOT NULL,
         peer_id TEXT NOT NULL,
         name TEXT NOT NULL DEFAULT '',
         last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
         PRIMARY KEY (room, peer_id)
       )`);
		await sql.query(`CREATE TABLE IF NOT EXISTS webrtc_signals (
         id BIGSERIAL PRIMARY KEY,
         room TEXT NOT NULL,
         to_peer TEXT NOT NULL,
         from_peer TEXT NOT NULL,
         kind TEXT NOT NULL,
         payload JSONB NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`);
		await sql.query(`CREATE INDEX IF NOT EXISTS webrtc_signals_inbox
         ON webrtc_signals (room, to_peer, id)`);
	})().catch((err) => {
		globalRef.__rtcSchemaPromise__ = void 0;
		throw err;
	});
	return globalRef.__rtcSchemaPromise__;
}
async function roster(sql, room) {
	return (await sql.query(`SELECT peer_id, name FROM webrtc_peers
     WHERE room = $1 AND last_seen > now() - make_interval(secs => $2)
     ORDER BY peer_id LIMIT 32`, [room, PEER_TTL_SECONDS])).map((r) => ({
		id: r.peer_id,
		name: r.name
	}));
}
async function touchPeer(sql, room, peer, name) {
	await sql.query(`INSERT INTO webrtc_peers (room, peer_id, name, last_seen)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (room, peer_id)
     DO UPDATE SET last_seen = now(), name = EXCLUDED.name`, [
		room,
		peer,
		name
	]);
}
async function prune(sql) {
	await Promise.all([sql.query(`DELETE FROM webrtc_signals WHERE created_at < now() - make_interval(secs => $1)`, [SIGNAL_TTL_SECONDS]), sql.query(`DELETE FROM webrtc_peers WHERE last_seen < now() - make_interval(secs => $1)`, [PEER_TTL_SECONDS])]);
}
function json(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json",
			"cache-control": "no-store"
		}
	});
}
async function handleGet(url) {
	const parsed = object({
		room: ID,
		peer: ID,
		name: string().max(64).default(""),
		since: number$1().int().min(0).default(0)
	}).safeParse({
		room: url.searchParams.get("room"),
		peer: url.searchParams.get("peer"),
		name: url.searchParams.get("name") ?? "",
		since: url.searchParams.get("since") ?? 0
	});
	if (!parsed.success) return json({ error: "invalid query" }, 400);
	const { room, peer, name, since } = parsed.data;
	const sql = await getSql();
	await ensureSchema(sql);
	if (since === 0 || Math.random() < .02) await prune(sql);
	await touchPeer(sql, room, peer, name);
	const rows = await sql.query(`SELECT id, from_peer, kind, payload FROM webrtc_signals
     WHERE room = $1 AND to_peer = $2 AND id > $3
     ORDER BY id LIMIT 200`, [
		room,
		peer,
		since
	]);
	return json({
		peers: await roster(sql, room),
		signals: rows.map((r) => ({
			id: r.id,
			from: r.from_peer,
			kind: r.kind,
			payload: r.payload
		}))
	});
}
async function handlePost(request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: "invalid JSON" }, 400);
	}
	const parsed = postSchema.safeParse(body);
	if (!parsed.success) return json({ error: "invalid request" }, 400);
	const msg = parsed.data;
	const sql = await getSql();
	await ensureSchema(sql);
	if (msg.op === "signal") await sql.query(`INSERT INTO webrtc_signals (room, to_peer, from_peer, kind, payload)
       VALUES ($1, $2, $3, $4, $5)`, [
		msg.room,
		msg.to,
		msg.from,
		msg.kind,
		JSON.stringify(msg.payload)
	]);
	else await sql.query(`DELETE FROM webrtc_peers WHERE room = $1 AND peer_id = $2`, [msg.room, msg.peer]);
	return json({ ok: true });
}
async function handleSignaling(request) {
	try {
		if (request.method === "GET") return await handleGet(new URL(request.url));
		if (request.method === "POST") return await handlePost(request);
		return json({ error: "method not allowed" }, 405);
	} catch (error) {
		console.error("[rtc] signaling error:", error);
		return json({ error: "signaling failed" }, 500);
	}
}
var handle = ({ request }) => handleSignaling(request);
var Route = createFileRoute("/api/rtc")({ server: { handlers: {
	GET: handle,
	POST: handle
} } });
var rootRouteChildren = {
	IndexRoute: Route$2.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$3
	}),
	ApiOceanRoute: Route$1.update({
		id: "/api/ocean",
		path: "/api/ocean",
		getParentRoute: () => Route$3
	}),
	ApiRtcRoute: Route.update({
		id: "/api/rtc",
		path: "/api/rtc",
		getParentRoute: () => Route$3
	})
};
var routeTree = Route$3._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		rewrite: previewPathRewrite(),
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { pressUse as _, applyOwn as a, ZONES as b, exportWorld as c, hullStage as d, hurtDiver as f, pressRepair as g, objective as h, applyGrant as i, findDiver as l, note as m, applyOceanView as n, createSim as o, importWorld as p, glideOcean as r, cycleSeat as s, router_exports as t, findVehicle as u, stepSim as v, velocityOf as y };
