import { getSql } from "@/lib/db";
import { Ocean, type OceanBody, type OceanIntent } from "./ocean.ts";

const BUILD = 3;

type Runtime = {
  build: number;
  ocean: Ocean;
  version: number;
  last: number;
  savedAt: number;
  timer: ReturnType<typeof setInterval> | null;
};

const globalRef = globalThis as typeof globalThis & { __abyssalOcean?: Runtime };

let tail: Promise<void> = Promise.resolve();

function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = tail.then(fn, fn);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function asBody(value: unknown): OceanBody | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as OceanBody;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value as OceanBody;
  return null;
}

async function persist(rt: Runtime) {
  const sql = await getSql();
  const body = JSON.stringify(rt.ocean.toBody());
  if (rt.version <= 0) {
    const inserted = await sql.query<{ version: number }>(
      `insert into abyssal_ocean (id, version, body) values ('world', 1, $1::jsonb)
       on conflict (id) do nothing
       returning version`,
      [body],
    );
    if (inserted[0]) {
      rt.version = Number(inserted[0].version);
      return;
    }
  }
  const updated = await sql.query<{ version: number }>(
    `update abyssal_ocean set body = $1::jsonb, version = version + 1, updated_at = now()
     where id = 'world' and version = $2
     returning version`,
    [body, rt.version],
  );
  if (!updated[0]) throw new Error("stale");
  rt.version = Number(updated[0].version);
}

async function pull(rt: Runtime) {
  const sql = await getSql();
  const rows = await sql.query<{ version: number; body: unknown }>("select version, body from abyssal_ocean where id = 'world'", []);
  const row = rows[0];
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

async function ensure(): Promise<Runtime> {
  const existing = globalRef.__abyssalOcean;
  if (existing && existing.build === BUILD) return existing;
  if (existing?.timer) clearInterval(existing.timer);
  let ocean = new Ocean();
  let version = 0;
  try {
    const sql = await getSql();
    const rows = await sql.query<{ version: number; body: unknown }>("select version, body from abyssal_ocean where id = 'world'", []);
    const body = asBody(rows[0]?.body);
    if (body) ocean = Ocean.revive(body);
    if (rows[0]) version = Number(rows[0].version) || 0;
  } catch (err) {
    console.error("[ocean] journal unreadable", err);
  }
  const runtime: Runtime = { build: BUILD, ocean, version, last: Date.now(), savedAt: Date.now(), timer: null };
  globalRef.__abyssalOcean = runtime;
  runtime.timer = setInterval(() => {
    void exclusive(async () => {
      const rt = globalRef.__abyssalOcean;
      if (!rt || rt.build !== BUILD) return;
      const now = Date.now();
      const gap = now - rt.last;
      rt.last = now;
      const swept = rt.ocean.sweep(now);
      if (!REGIONS_BUSY(rt.ocean)) {
        if (swept) await save(rt);
        return;
      }
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

function REGIONS_BUSY(ocean: Ocean) {
  return (["breach", "plains", "city", "works", "reef"] as const).some((id) =>
    ocean.sectors[id].divers.some((d) => d.alive || d.respawn > 0),
  );
}

async function catchUp(rt: Runtime) {
  const now = Date.now();
  rt.ocean.sweep(now);
  const gap = now - rt.last;
  if (gap < 40) return;
  const steps = Math.max(1, Math.min(4, Math.round(gap / 50)));
  for (let i = 0; i < steps; i += 1) rt.ocean.step(1 / 20);
  rt.last = now;
}

async function save(rt: Runtime) {
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

export async function oceanRoster() {
  return exclusive(async () => {
    const rt = await ensure();
    return { roster: rt.ocean.roster(), flags: rt.ocean.flags };
  });
}

export async function oceanJoin(token: string | null, callsign: string) {
  return exclusive(async () => {
    const rt = await ensure();
    const id = rt.ocean.join(token, callsign);
    await save(rt);
    return { token: id, snap: rt.ocean.snapshot(id) };
  });
}

export async function oceanSync(token: string, input: OceanIntent) {
  return exclusive(async () => {
    const rt = await ensure();
    if (!rt.ocean.players.has(token)) return null;
    rt.ocean.setIntent(token, input);
    await catchUp(rt);
    if (Date.now() - rt.savedAt > 400) await save(rt);
    if (!rt.ocean.players.has(token)) return null;
    return { token, snap: rt.ocean.snapshot(token) };
  });
}
