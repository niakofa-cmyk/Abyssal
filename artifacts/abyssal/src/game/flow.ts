import type { Region, RegionId, Sim } from "./types.ts";
import { TILE } from "./types.ts";
import { isSolid } from "./world.ts";

const REGIONS: RegionId[] = ["breach", "plains", "city", "works", "reef"];
const SIDE = 56;
const SHAFT = 108;
const SOLVE = 14;
const WAKE_DECAY = 1.7;
const WAKE_CAP = 70;

type Field = {
  w: number;
  h: number;
  vx: Float32Array;
  vy: Float32Array;
  nx: Float32Array;
  ny: Float32Array;
};

const staticCache = new Map<string, Field>();
const wakes = new WeakMap<Sim, Map<RegionId, Field>>();

function empty(w: number, h: number): Field {
  const n = w * h;
  return { w, h, vx: new Float32Array(n), vy: new Float32Array(n), nx: new Float32Array(n), ny: new Float32Array(n) };
}

function solidAt(region: Region, tx: number, ty: number, mawDead: boolean) {
  return isSolid(region, (tx + 0.5) * TILE, (ty + 0.5) * TILE, mawDead);
}

function staticField(region: Region, mawDead: boolean): Field {
  const key = `${region.id}:${mawDead ? 1 : 0}`;
  const cached = staticCache.get(key);
  if (cached) return cached;
  const { w, h, tiles } = region;
  const field = empty(w, h);
  const source = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (solidAt(region, x, y, mawDead)) continue;
      const tile = tiles[i] ?? 0;
      if (tile === 4) {
        field.vx[i] = SIDE;
        source[i] = 1;
      } else if (tile === 5) {
        field.vx[i] = -SIDE;
        source[i] = 1;
      } else if (tile === 6) {
        field.vy[i] = SHAFT;
        source[i] = 1;
      }
    }
  }
  for (let iter = 0; iter < SOLVE; iter++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (source[i] || solidAt(region, x, y, mawDead)) {
          field.nx[i] = field.vx[i];
          field.ny[i] = field.vy[i];
          continue;
        }
        let sx = 0;
        let sy = 0;
        let n = 0;
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const tx = x + ox;
          const ty = y + oy;
          if (tx < 0 || ty < 0 || tx >= w || ty >= h || solidAt(region, tx, ty, mawDead)) continue;
          const j = ty * w + tx;
          sx += field.vx[j] ?? 0;
          sy += field.vy[j] ?? 0;
          n += 1;
        }
        field.nx[i] = n ? sx / n : 0;
        field.ny[i] = n ? sy / n : 0;
      }
    }
    const vx = field.vx;
    field.vx = field.nx;
    field.nx = vx;
    const vy = field.vy;
    field.vy = field.ny;
    field.ny = vy;
  }
  for (let i = 0; i < field.vx.length; i++) {
    if (Math.hypot(field.vx[i] ?? 0, field.vy[i] ?? 0) < 8) {
      field.vx[i] = 0;
      field.vy[i] = 0;
    }
  }
  staticCache.set(key, field);
  return field;
}

function wakeField(sim: Sim, region: Region): Field {
  let map = wakes.get(sim);
  if (!map) {
    map = new Map();
    wakes.set(sim, map);
  }
  let field = map.get(region.id);
  if (!field || field.w !== region.w || field.h !== region.h) {
    field = empty(region.w, region.h);
    map.set(region.id, field);
  }
  return field;
}

function sampleGrid(field: Field, x: number, y: number) {
  const gx = x / TILE - 0.5;
  const gy = y / TILE - 0.5;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const tx = gx - x0;
  const ty = gy - y0;
  let sx = 0;
  let sy = 0;
  let wsum = 0;
  for (const [ox, oy, wt] of [
    [0, 0, (1 - tx) * (1 - ty)],
    [1, 0, tx * (1 - ty)],
    [0, 1, (1 - tx) * ty],
    [1, 1, tx * ty],
  ] as const) {
    const ix = x0 + ox;
    const iy = y0 + oy;
    if (ix < 0 || iy < 0 || ix >= field.w || iy >= field.h || wt <= 0) continue;
    const i = iy * field.w + ix;
    sx += (field.vx[i] ?? 0) * wt;
    sy += (field.vy[i] ?? 0) * wt;
    wsum += wt;
  }
  if (wsum <= 0) return { x: 0, y: 0 };
  return { x: sx / wsum, y: sy / wsum };
}

/** The tiled current only. A stroke does not cancel the shaft that made it. */
export function sampleCurrent(sim: Sim, regionId: RegionId, x: number, y: number) {
  const region = sim.regions[regionId];
  if (!region) return { x: 0, y: 0 };
  return sampleGrid(staticField(region, sim.flags.mawDead), x, y);
}

/** Static current plus the dying wake. Still water is zero. */
export function sampleFlow(sim: Sim, regionId: RegionId, x: number, y: number) {
  const region = sim.regions[regionId];
  if (!region) return { x: 0, y: 0 };
  const still = sampleGrid(staticField(region, sim.flags.mawDead), x, y);
  const wake = wakes.get(sim)?.get(regionId);
  if (!wake) return still;
  const gust = sampleGrid(wake, x, y);
  return { x: still.x + gust.x, y: still.y + gust.y };
}

function stamp(field: Field, tx: number, ty: number, ivx: number, ivy: number) {
  if (tx < 0 || ty < 0 || tx >= field.w || ty >= field.h) return;
  const i = ty * field.w + tx;
  let x = (field.vx[i] ?? 0) + ivx;
  let y = (field.vy[i] ?? 0) + ivy;
  const mag = Math.hypot(x, y);
  if (mag > WAKE_CAP) {
    x = (x / mag) * WAKE_CAP;
    y = (y / mag) * WAKE_CAP;
  }
  field.vx[i] = x;
  field.vy[i] = y;
}

/** A stroke, a shot, or a leak. The wake is not saved. */
export function noteWake(sim: Sim, regionId: RegionId, x: number, y: number, ivx: number, ivy: number) {
  const region = sim.regions[regionId];
  if (!region || (ivx === 0 && ivy === 0)) return;
  const field = wakeField(sim, region);
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  stamp(field, tx, ty, ivx, ivy);
  stamp(field, tx - 1, ty, ivx * 0.35, ivy * 0.35);
  stamp(field, tx + 1, ty, ivx * 0.35, ivy * 0.35);
}

const drift = new WeakMap<object, { vx: number; vy: number }>();

/** A loose body catches the water. The velocity stays off the save. */
export function carry(key: object, flowX: number, flowY: number, dt: number) {
  const prev = drift.get(key) ?? { vx: 0, vy: 0 };
  const rate = 1 - Math.exp(-1.6 * dt);
  const vx = prev.vx + (flowX - prev.vx) * rate;
  const vy = prev.vy + (flowY - prev.vy) * rate;
  drift.set(key, { vx, vy });
  return { vx, vy };
}
export function stepFlow(sim: Sim, dt: number, alive: (region: RegionId) => boolean) {
  for (const id of REGIONS) {
    if (!alive(id)) continue;
    const region = sim.regions[id];
    const wake = wakes.get(sim)?.get(id);
    if (!wake) continue;
    const still = staticField(region, sim.flags.mawDead);
    const decay = Math.exp(-WAKE_DECAY * dt);
    for (let y = 0; y < wake.h; y++) {
      for (let x = 0; x < wake.w; x++) {
        const i = y * wake.w + x;
        const cx = (x + 0.5) * TILE;
        const cy = (y + 0.5) * TILE;
        const back = sampleGrid(wake, cx - ((still.vx[i] ?? 0) + (wake.vx[i] ?? 0)) * dt, cy - ((still.vy[i] ?? 0) + (wake.vy[i] ?? 0)) * dt);
        const vx = back.x * decay;
        const vy = back.y * decay;
        if (Math.hypot(vx, vy) < 0.35) {
          wake.nx[i] = 0;
          wake.ny[i] = 0;
        } else {
          wake.nx[i] = vx;
          wake.ny[i] = vy;
        }
      }
    }
    const vx = wake.vx;
    wake.vx = wake.nx;
    wake.nx = vx;
    const vy = wake.vy;
    wake.vy = wake.ny;
    wake.ny = vy;
  }
}
