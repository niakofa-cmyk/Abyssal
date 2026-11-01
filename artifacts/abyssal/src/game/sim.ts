import type {
  Creature,
  Diver,
  Facing,
  Gate,
  PickupKind,
  Projectile,
  Region,
  RegionId,
  Seat,
  Sim,
  Vehicle,
  VehicleKind,
  WorldSnap,
} from "./types.ts";
import { TILE } from "./types.ts";
import { isSolid, tileAt, buildLayout } from "./world.ts";
import { casesClosedBy } from "./archive.ts";
import { advanceEcology, createEcology, emitNoise, restorePower, ECOLOGY_EVENTS } from "./ecology.ts";

const SWIM_ACCEL = 920;
const SWIM_DRAG = 3.4;
const SWIM_MAX = 156;
const O2_DRAIN = 4.4;
const ASCENT: RegionId[] = ["breach", "plains", "city", "works", "reef"];

function craftOf(kind: VehicleKind) {
  if (kind === "barrow") return { accel: 480, drag: 1.65, max: 150, hw: 48, hh: 16, air: 22, repair: 74 };
  if (kind === "kite") return { accel: 640, drag: 1.45, max: 230, hw: 36, hh: 14, air: 18, repair: 58 };
  return { accel: 880, drag: 2.2, max: 198, hw: 16, hh: 8, air: 13, repair: 32 };
}

function hullName(kind: VehicleKind) {
  if (kind === "barrow") return "Barrow";
  if (kind === "kite") return "Kite";
  return "Scooter";
}

export type SpawnOpts = {
  selfId: string;
  name: string;
  partner: boolean;
  soren: boolean;
  /** False when a sector sim should start with no diver of its own. */
  crew?: boolean;
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function hypot(ax: number, ay: number) {
  return Math.hypot(ax, ay);
}

export function note(sim: Sim, text: string) {
  sim.toasts.unshift({ id: ++sim.toastId, text, life: 3.4 });
  sim.toasts = sim.toasts.slice(0, 4);
}

export function discover(sim: Sim, id: string) {
  if (sim.discovered.includes(id)) return;
  sim.discovered.push(id);
  sim.events.push(`log:${id}`);
}

function makeDiver(
  partial: Pick<Diver, "id" | "owner" | "name" | "kind" | "tint"> & { x: number; y: number },
): Diver {
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
    ...partial,
  };
}

export function createSim(opts: SpawnOpts): Sim {
  const layout = buildLayout();
  const spawn = layout.regions.breach.spawn;
  const divers: Diver[] = [];
  if (opts.crew !== false) {
    divers.push(
      makeDiver({
        id: opts.selfId,
        owner: opts.selfId,
        name: opts.name || "Unmarked",
        kind: "you",
        tint: "you",
        x: spawn.x,
        y: spawn.y,
      }),
    );
    if (opts.partner) {
      divers.push(
        makeDiver({
          id: `${opts.selfId}p`,
          owner: opts.selfId,
          name: "Imani",
          kind: "partner",
          tint: "partner",
          x: spawn.x + 46,
          y: spawn.y + 8,
        }),
      );
    }
    if (opts.soren) {
      divers.push(
        makeDiver({
          id: `${opts.selfId}s`,
          owner: opts.selfId,
          name: "Soren",
          kind: "ai",
          tint: "ai",
          x: spawn.x + 18,
          y: spawn.y + 36,
        }),
      );
    }
    divers[0].o2 = 70;
  }
  const chunks = (n: number) => Array.from({ length: n }, () => 0);
  const sim: Sim = {
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
    shared: [],
    ecology: createEcology(),
    explored: {
      breach: chunks(Math.ceil(layout.regions.breach.w / 4)),
      plains: chunks(Math.ceil(layout.regions.plains.w / 4)),
      city: chunks(Math.ceil(layout.regions.city.w / 4)),
      works: chunks(Math.ceil(layout.regions.works.w / 4)),
      reef: chunks(Math.ceil(layout.regions.reef.w / 4)),
    },
    flags: {
      mawDead: false,
      upgraded: false,
      scooterSeen: false,
      kiteSeen: false,
      collarRead: false,
      barrowSeen: false,
    },
    toasts: [],
    events: [],
    outbox: [],
    shake: 0,
    bossBanner: 0,
  };
  if (opts.crew !== false) {
    note(sim, "You came to in the dark. The air is already leaving.");
    for (const d of divers) unstick(sim, d);
  }
  return sim;
}

export function findDiver(sim: Sim, id: string) {
  return sim.divers.find((d) => d.id === id);
}

export function findVehicle(sim: Sim, id: string | null) {
  if (!id) return undefined;
  return sim.vehicles.find((v) => v.id === id);
}

function overlapsSolid(region: Region, x: number, y: number, hw: number, hh: number, mawDead: boolean) {
  return [
    [x - hw, y - hh],
    [x + hw, y - hh],
    [x - hw, y + hh],
    [x + hw, y + hh],
    [x, y],
  ].some(([sx, sy]) => isSolid(region, sx, sy, mawDead));
}

function unstick(sim: Sim, body: { region: RegionId; x: number; y: number }) {
  const region = sim.regions[body.region];
  if (!overlapsSolid(region, body.x, body.y, 10, 14, sim.flags.mawDead)) return;
  for (let r = 8; r < 280; r += 8) {
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = body.x + dx * r;
      const ny = body.y + dy * r;
      if (!overlapsSolid(region, nx, ny, 10, 14, sim.flags.mawDead)) {
        body.x = nx;
        body.y = ny;
        return;
      }
    }
  }
}

function resolveAxis(
  region: Region,
  body: { x: number; y: number; vx: number; vy: number },
  hw: number,
  hh: number,
  axis: "x" | "y",
  mawDead: boolean,
) {
  const x0 = Math.floor((body.x - hw) / TILE);
  const x1 = Math.floor((body.x + hw - 0.01) / TILE);
  const y0 = Math.floor((body.y - hh) / TILE);
  const y1 = Math.floor((body.y + hh - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!isSolid(region, tx * TILE + 8, ty * TILE + 8, mawDead)) continue;
      const left = tx * TILE;
      const top = ty * TILE;
      const overlapX = Math.min(body.x + hw, left + TILE) - Math.max(body.x - hw, left);
      const overlapY = Math.min(body.y + hh, top + TILE) - Math.max(body.y - hh, top);
      if (overlapX <= 0 || overlapY <= 0) continue;
      if (axis === "x") {
        if (overlapY < 3) continue;
        body.x += body.x < left + TILE / 2 ? -overlapX : overlapX;
        body.vx = 0;
      } else {
        if (overlapX < 3) continue;
        body.y += body.y < top + TILE / 2 ? -overlapY : overlapY;
        body.vy = 0;
      }
    }
  }
}

function moveBody(
  region: Region,
  body: { x: number; y: number; vx: number; vy: number },
  hw: number,
  hh: number,
  dt: number,
  mawDead: boolean,
) {
  const steps = clamp(Math.ceil((Math.max(Math.abs(body.vx), Math.abs(body.vy)) * dt) / 8), 1, 8);
  const sdt = dt / steps;
  for (let i = 0; i < steps; i++) {
    body.x += body.vx * sdt;
    resolveAxis(region, body, hw, hh, "x", mawDead);
    body.y += body.vy * sdt;
    resolveAxis(region, body, hw, hh, "y", mawDead);
  }
}

function drive(
  vx: number,
  vy: number,
  ax: number,
  ay: number,
  accel: number,
  drag: number,
  max: number,
  dt: number,
) {
  let nx = vx + ax * accel * dt;
  let ny = vy + ay * accel * dt;
  const damp = Math.exp(-drag * dt);
  nx *= damp;
  ny *= damp;
  const s = Math.hypot(nx, ny);
  if (s > max) {
    nx = (nx / s) * max;
    ny = (ny / s) * max;
  }
  return { vx: nx, vy: ny };
}

function faceFrom(ax: number, vx: number, prev: Facing): Facing {
  if (ax < -0.25 || vx < -12) return -1;
  if (ax > 0.25 || vx > 12) return 1;
  return prev;
}

function boxHit(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
  return Math.abs(ax - bx) < aw + bw && Math.abs(ay - by) < ah + bh;
}

export function objective(sim: Sim, diver: Diver | undefined) {
  if (!diver) return "";
  const loft = sim.pickups.find((p) => p.id === "o2-a");
  if (loft && !loft.taken && diver.region === "breach" && !sim.flags.scooterSeen) {
    return "A canister is in the loft above the west wreck. Swim up. The air will not wait.";
  }
  if (!sim.flags.scooterSeen && diver.region === "breach") {
    return "Air is leaving you. A motor is wedged in the upper gallery.";
  }
  if (diver.region === "breach" && !sim.discovered.includes("breach-blackbox")) {
    return "Recover the wreck's black-box record. Its account of the failure may not agree with the warning.";
  }
  if (diver.region === "breach" && !sim.ecology.breach.powered) {
    return "The east lock leads to the plains. Optional: restore a repair-station grid with E and one cell, then watch the life respond.";
  }
  if (diver.region === "breach") return "The east lock still cycles. It drops into the plains.";
  if (!sim.flags.kiteSeen) return "A two-seat hull is in the wreck light. It will not swim itself.";
  if (!sim.flags.mawDead) return "Watch the lantern before committing. Quiet water hides you; engines and weapons draw attention.";
  if (!sim.flags.barrowSeen) return "The shelf door is open. A three-seat hull waits in the drowned city.";
  if (diver.region === "city" || diver.region === "plains") return "East of the glass, the works are still live. The reef is past the furnaces.";
  if (diver.region === "works") return "Furnaces and sentries. The reef shaft is the far lock.";
  return "Light from above. The upper lock is shut.";
}

export function hullStage(v: Vehicle) {
  const p = v.hull / Math.max(1, v.hullMax);
  if (v.destroyed || v.hull <= 0) return 5;
  if (p < 0.15) return 4;
  if (p < 0.3) return 3;
  if (p < 0.5) return 2;
  if (p < 0.75) return 1;
  return 0;
}

function chip(sim: Sim, diver: Diver, amount: number) {
  if (!diver.alive || amount <= 0) return;
  diver.hp -= amount;
  if (diver.hp <= 0) {
    diver.iframe = 0;
    diver.hp = 0.1;
    hurtDiver(sim, diver.id, 1);
  }
}

function awake(sim: Sim, region: RegionId) {
  return sim.divers.some((d) => d.alive && d.region === region);
}

function gateToward(sim: Sim, from: RegionId, to: RegionId): Gate | undefined {
  const open = sim.regions[from].gates.filter((g) => g.lock === "none" || sim.flags.mawDead);
  const direct = open.find((g) => g.to === to);
  if (direct) return direct;
  const want = ASCENT.indexOf(to) > ASCENT.indexOf(from) ? 1 : -1;
  return open.find((g) => g.dir === want) ?? open[0];
}

function nearestFoe(sim: Sim, c: Creature) {
  let best: Diver | undefined;
  let bestD =
    c.kind === "maw"
      ? 560
      : c.kind === "hunter"
        ? 340
        : c.kind === "sentry"
          ? 320
          : c.kind === "eel"
            ? 220
            : c.kind === "bloom"
              ? 160
              : 130;
  for (const d of sim.divers) {
    if (!d.alive || d.region !== c.region) continue;
    let dist = hypot(d.x - c.x, d.y - c.y);
    if ((c.kind === "hunter" || c.kind === "maw") && d.vehicleId) dist *= 0.7;
    if (dist < bestD) {
      bestD = dist;
      best = d;
    }
  }
  return c.kind === "darter" ? best : best;
}

function stepMaw(sim: Sim, c: Creature, foe: Diver | undefined, dt: number) {
  const region = sim.regions[c.region];
  if (!c.aggro && foe && hypot(foe.x - c.x, foe.y - c.y) < 430) {
    c.aggro = true;
    const extras = sim.divers.filter((d) => d.alive && d.region === c.region).length - 1;
    if (extras > 0) {
      c.hpMax = 480 + extras * 90;
      c.hp += extras * 70;
    }
    c.state = "warn";
    c.timer = 0.95;
    sim.bossBanner = 2.8;
    sim.events.push("bosswarn");
    note(sim, "The Lantern Maw has your scent. The lure flares before it moves.");
  }
  if (!c.aggro) {
    const memory = sim.ecology[c.region];
    if (memory.noise > 25 && memory.source && hypot(memory.source.x - c.x, memory.source.y - c.y) < 760) {
      c.vx = (memory.source.x - c.x) * 0.12;
      c.vy = (memory.source.y - c.y) * 0.12;
      c.facing = faceFrom(0, c.vx, c.facing);
      moveBody(region, c, 46, 22, dt, sim.flags.mawDead);
      return;
    }
    c.vx = Math.sin(sim.time * 0.6) * 28;
    c.vy = Math.cos(sim.time * 0.4) * 16;
    c.facing = faceFrom(0, c.vx, c.facing);
    moveBody(region, c, 46, 22, dt, sim.flags.mawDead);
    return;
  }
  c.timer -= dt;
  if (c.state === "warn") {
    c.vx *= Math.exp(-3 * dt);
    c.vy *= Math.exp(-3 * dt);
    if (foe && c.timer > 0.35) {
      c.aimX = foe.x - c.x;
      c.aimY = foe.y - c.y;
      c.facing = c.aimX < 0 ? -1 : 1;
    }
    if (c.timer <= 0) {
      const m = hypot(c.aimX, c.aimY) || 1;
      c.vx = (c.aimX / m) * 250;
      c.vy = (c.aimY / m) * 200;
      c.state = "dash";
      c.timer = 0.52;
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
      c.timer = c.hp < c.hpMax * 0.45 ? 0.5 : 0.85;
      sim.events.push("bosswarn");
    }
  }
  moveBody(region, c, 46, 22, dt, sim.flags.mawDead);
}

function stepSentry(sim: Sim, c: Creature, foe: Diver | undefined, dt: number) {
  const region = sim.regions[c.region];
  c.timer -= dt;
  c.vx += (c.homeX - c.x) * 0.9 * dt;
  c.vy += (c.homeY - c.y) * 0.9 * dt + Math.sin(sim.time * 2 + c.homeX) * 18 * dt;
  if (c.state === "patrol") {
    if (foe) {
      c.state = "warn";
      c.timer = 0.55;
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
        x: c.x + (c.aimX / m) * 16,
        y: c.y + (c.aimY / m) * 8,
        vx: (c.aimX / m) * 168,
        vy: (c.aimY / m) * 168,
        life: 1.15,
        dmg: 12,
        team: "wild",
        ownerId: c.id,
        kind: "bite",
        hw: 5,
        hh: 5,
      });
      sim.events.push("shot");
      c.state = "recover";
      c.timer = 0.85;
    }
  } else if (c.timer <= 0) {
    c.state = foe ? "warn" : "patrol";
    c.timer = c.state === "warn" ? 0.5 : 0;
  }
  moveBody(region, c, 14, 10, dt, sim.flags.mawDead);
  c.facing = faceFrom(0, c.vx, c.facing);
}

function stepBloom(sim: Sim, c: Creature, foe: Diver | undefined, dt: number) {
  c.timer -= dt;
  c.vx = 0;
  c.vy = 0;
  const near = !!foe && hypot(foe.x - c.x, foe.y - c.y) < 150;
  if (c.state === "patrol") {
    if (near) {
      c.state = "warn";
      c.timer = 0.7;
      sim.events.push("warn");
    }
    return;
  }
  if (c.state === "warn") {
    if (c.timer <= 0) {
      c.state = "pulse";
      c.timer = 0.28;
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

function stepCreature(sim: Sim, c: Creature, dt: number) {
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
    const memory = sim.ecology[c.region];
    const disturbance = memory.noise > 25 && memory.source &&
      hypot(memory.source.x - c.x, memory.source.y - c.y) < 450 ? memory.source : null;
    const threat = disturbance ?? (foe && hypot(foe.x - c.x, foe.y - c.y) < 130 ? foe : null);
    if (threat) {
      const dx = c.x - threat.x;
      const dy = c.y - threat.y;
      const m = hypot(dx, dy) || 1;
      c.vx = (dx / m) * 92;
      c.vy = (dy / m) * 70;
    } else {
      c.vx += Math.sin(sim.time * 1.3 + c.homeX) * 30 * dt;
      c.vy += Math.cos(sim.time * 0.8 + c.homeY) * 20 * dt;
      c.vx += (c.homeX - c.x) * 0.5 * dt;
      c.vy += (c.homeY - c.y) * 0.5 * dt;
    }
    c.facing = faceFrom(0, c.vx, c.facing);
    moveBody(region, c, 10, 6, dt, sim.flags.mawDead);
    return;
  }
  c.timer -= dt;
  const lunge = c.kind === "hunter" ? 214 : 176;
  if (c.state === "patrol") {
    const memory = sim.ecology[c.region];
    const sound = memory.noise > 25 && memory.source &&
      hypot(memory.source.x - c.x, memory.source.y - c.y) < 600 ? memory.source : null;
    const warmth = c.kind === "eel" && memory.powered ? memory.station : null;
    const target = !foe ? (sound ?? warmth) : null;
    c.vx += ((target?.x ?? c.homeX) - c.x) * 0.4 * dt;
    c.vy += ((target?.y ?? c.homeY) - c.y) * 0.4 * dt;
    c.vx *= Math.exp(-1.5 * dt);
    if (foe) {
      c.state = "warn";
      c.timer = c.kind === "hunter" ? 0.4 : 0.55;
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
      c.vx = (c.aimX / m) * lunge;
      c.vy = (c.aimY / m) * lunge * 0.8;
      c.state = "lunge";
      c.timer = 0.36;
    }
  } else if (c.state === "lunge") {
    if (foe && !c.didHit && c.touchCd <= 0 && boxHit(c.x, c.y, c.kind === "hunter" ? 26 : 20, 12, foe.x, foe.y, 12, 16)) {
      c.didHit = true;
      c.touchCd = 0.5;
      strikeDiver(sim, foe, c.kind === "hunter" ? 18 : 14, true);
    }
    if (c.timer <= 0) {
      c.state = "recover";
      c.timer = 0.7;
    }
  } else {
    c.vx *= Math.exp(-2 * dt);
    if (c.timer <= 0) c.state = "patrol";
  }
  moveBody(region, c, c.kind === "hunter" ? 22 : 16, 10, dt, sim.flags.mawDead);
  c.facing = faceFrom(0, c.vx, c.facing);
}

function strikeDiver(sim: Sim, diver: Diver, dmg: number, _fromWorld: boolean) {
  if (!diver.alive || diver.iframe > 0) return;
  if (diver.kind === "remote") {
    diver.iframe = 0.75;
    sim.outbox.push({ k: "hurt", id: diver.id, dmg });
    return;
  }
  hurtDiver(sim, diver.id, dmg);
}

export function hurtDiver(sim: Sim, id: string, dmg: number) {
  const diver = findDiver(sim, id);
  if (!diver || !diver.alive || diver.iframe > 0) return;
  let dealt = dmg;
  const vehicle = findVehicle(sim, diver.vehicleId);
  if (vehicle && !vehicle.destroyed) {
    if (vehicle.shield > 0) dmg *= 0.35;
    vehicle.hull -= dmg;
    dealt = dmg * (hullStage(vehicle) >= 3 ? 0.7 : 0.28);
    sim.events.push("hull");
    sim.shake = Math.max(sim.shake, 4);
    if (vehicle.hull <= 0) destroyVehicle(sim, vehicle);
  }
  diver.hp -= dealt;
  diver.iframe = 0.72;
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

function destroyVehicle(sim: Sim, vehicle: Vehicle) {
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

function leaveSeat(sim: Sim, diver: Diver) {
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

function takeSeat(sim: Sim, diver: Diver, vehicle: Vehicle, seat: Seat) {
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

function board(sim: Sim, diver: Diver, vehicle: Vehicle) {
  const seat: Seat | null = !vehicle.seats.pilot
    ? "pilot"
    : vehicle.kind !== "scooter" && !vehicle.seats.gunner
      ? "gunner"
      : vehicle.kind === "barrow" && !vehicle.seats.engineer
        ? "engineer"
        : null;
  if (!seat) {
    if (diver.kind === "you") note(sim, vehicle.kind === "barrow" ? "All three seats are taken." : "Both seats are taken.");
    return;
  }
  takeSeat(sim, diver, vehicle, seat);
}

export function insertDiver(
  sim: Sim,
  partial: Pick<Diver, "id" | "owner" | "name" | "kind" | "tint"> & { x: number; y: number; region?: RegionId },
): Diver {
  const diver = makeDiver({
    id: partial.id,
    owner: partial.owner,
    name: partial.name,
    kind: partial.kind,
    tint: partial.tint,
    x: partial.x,
    y: partial.y,
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

export function cycleSeat(sim: Sim, diver: Diver) {
  const vehicle = findVehicle(sim, diver.vehicleId);
  if (!vehicle || !diver.seat || vehicle.destroyed) return;
  const order: Seat[] =
    vehicle.kind === "barrow" ? ["pilot", "gunner", "engineer"] : vehicle.kind === "kite" ? ["pilot", "gunner"] : ["pilot"];
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
  if (diver.kind === "you") {
    note(
      sim,
      next === "pilot" ? "You take the helm." : next === "gunner" ? "You take the tube." : "You take the pumps. Fire braces the skin.",
    );
  }
}

export function pressUse(sim: Sim, diver: Diver) {
  if (!diver.alive) return;
  if (diver.vehicleId) {
    leaveSeat(sim, diver);
    sim.events.push("exit");
    return;
  }
  const station = sim.markers.find((marker) => marker.region === diver.region && marker.kind === "repair" &&
    hypot(marker.x - diver.x, marker.y - diver.y) <= 52);
  if (station && !sim.ecology[diver.region].powered) {
    if (diver.cells > 0 && restorePower(sim.ecology[diver.region], station.x, station.y)) {
      diver.cells -= 1;
      if (diver.kind === "remote") sim.outbox.push({ k: "grant", id: diver.id, kind: "cell", amount: -1 });
      note(sim, ECOLOGY_EVENTS.power);
      sim.events.push("repair");
      return;
    }
    note(sim, "One energy cell would restore this district grid. Restoring it will attract life.");
  }
  let best: Vehicle | undefined;
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

export function pressRepair(sim: Sim, diver: Diver) {
  if (!diver.alive || diver.cells <= 0 || diver.vehicleId) return;
  let best: Vehicle | undefined;
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

function grant(sim: Sim, diver: Diver, kind: PickupKind, amount: number) {
  if (kind === "o2") diver.o2 = clamp(diver.o2 + amount, 0, diver.o2Max);
  if (kind === "med") diver.hp = clamp(diver.hp + amount, 0, diver.hpMax);
  if (kind === "ammo") diver.ammo = clamp(diver.ammo + amount, 0, 28);
  if (kind === "cell") diver.cells = clamp(diver.cells + amount, 0, 99);
  diver.hypoxia = 0;
  diver.warned = false;
}

export function applyGrant(sim: Sim, id: string, kind: PickupKind, amount: number) {
  const diver = findDiver(sim, id);
  if (!diver) return;
  grant(sim, diver, kind, amount);
  if (diver.kind === "you") {
    const label = kind === "o2" ? "Oxygen" : kind === "med" ? "Medicine" : kind === "ammo" ? "Darts" : "Energy cell";
    note(sim, amount < 0 ? `${label} used.` : `${label} aboard.`);
    if (amount > 0) sim.events.push("pickup");
  }
}

function collect(sim: Sim, diver: Diver, kind: PickupKind, amount: number) {
  if (diver.kind === "remote") {
    sim.outbox.push({ k: "grant", id: diver.id, kind, amount });
    return;
  }
  applyGrant(sim, diver.id, kind, amount);
}

function nearestPrey(sim: Sim, diver: Diver, reach: number) {
  let best: Creature | undefined;
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

function thinkAi(sim: Sim, diver: Diver, auth: boolean) {
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
    diver.aimY = diver.ay * 0.35;
    diver.fireLatch = false;
  }
}

function aimDir(diver: Diver) {
  let x = diver.aimX;
  let y = diver.aimY;
  let m = hypot(x, y);
  if (m < 0.2) {
    x = diver.facing;
    y = diver.ay * 0.35;
    m = hypot(x, y) || 1;
  }
  return { x: x / m, y: y / m };
}

function tryFire(sim: Sim, diver: Diver) {
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
    const shooterId = vehicle.seats.gunner ?? vehicle.seats.pilot;
    if (shooterId !== diver.id || vehicle.kind === "scooter") return;
    if (vehicle.fireCd > 0 || vehicle.energy < 6) return;
    const heavy = vehicle.kind === "barrow";
    const aim = aimDir(diver);
    const speed = heavy ? 250 : 290;
    sim.projectiles.push({
      id: sim.nextId++,
      region: vehicle.region,
      x: vehicle.x + aim.x * (heavy ? 62 : 48),
      y: vehicle.y + aim.y * 8,
      vx: aim.x * speed + vehicle.vx * 0.25,
      vy: aim.y * speed,
      life: heavy ? 1.5 : 1.3,
      dmg: heavy ? 34 : 26,
      team: "crew",
      ownerId: diver.id,
      kind: "torpedo",
      hw: heavy ? 12 : 10,
      hh: 4,
    });
    vehicle.fireCd = vehicle.seats.gunner ? (heavy ? 0.62 : 0.5) : 1.05;
    vehicle.energy -= heavy ? 9 : 7;
    sim.events.push("torpedo");
    emitNoise(sim.ecology[vehicle.region], vehicle.x, vehicle.y, 42);
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
    life: 0.62,
    dmg: 14 + bonus,
    team: "crew",
    ownerId: diver.id,
    kind: "harpoon",
    hw: 8,
    hh: 3,
  });
  diver.ammo -= 1;
  diver.fireCd = sim.flags.upgraded ? 0.32 : 0.42;
  sim.events.push("shot");
  emitNoise(sim.ecology[diver.region], diver.x, diver.y, 22);
}

function killCreature(sim: Sim, c: Creature) {
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

function stepProjectiles(sim: Sim, dt: number) {
  const next: Projectile[] = [];
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
        const hw =
          c.kind === "maw"
            ? 54
            : c.kind === "bloom"
              ? 30
              : c.kind === "hunter"
                ? 26
                : c.kind === "sentry"
                  ? 16
                  : c.kind === "eel"
                    ? 20
                    : 12;
        const hh = c.kind === "maw" ? 24 : 11;
        if (!boxHit(p.x, p.y, p.hw, p.hh, c.x, c.y, hw, hh)) continue;
        let dmg = p.dmg;
        if (c.kind === "maw" && c.state === "open") dmg *= 2;
        else if (c.kind === "maw") dmg *= 0.4;
        c.hp -= dmg;
        c.hurt = 0.12;
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

function stepVehicle(sim: Sim, vehicle: Vehicle, dt: number) {
  vehicle.fireCd = Math.max(0, vehicle.fireCd - dt);
  vehicle.shield = Math.max(0, vehicle.shield - dt);
  vehicle.shieldCd = Math.max(0, vehicle.shieldCd - dt);
  if (vehicle.destroyed) return;
  const pilot = vehicle.seats.pilot ? findDiver(sim, vehicle.seats.pilot) : undefined;
  const stage = hullStage(vehicle);
  const stageMul = stage >= 4 ? 0.45 : stage >= 3 ? 0.62 : stage >= 2 ? 0.8 : 1;
  const ax = pilot?.alive ? pilot.ax : 0;
  const ay = pilot?.alive ? pilot.ay : 0;
  const moving = Math.abs(ax) + Math.abs(ay) > 0.08;
  if (pilot?.alive) vehicle.energy = Math.max(0, vehicle.energy - (moving ? 6 : 0.45) * dt);
  const engineer = vehicle.seats.engineer ? findDiver(sim, vehicle.seats.engineer) : undefined;
  if (engineer?.alive && vehicle.energy > 8 && vehicle.hull < vehicle.hullMax) {
    vehicle.hull = clamp(vehicle.hull + 7 * dt, 0, vehicle.hullMax);
    vehicle.energy = Math.max(0, vehicle.energy - 3.5 * dt);
  }
  const energyMul = vehicle.energy > 4 ? 1 : 0.4;
  const spec = craftOf(vehicle.kind);
  const driven = drive(
    vehicle.vx,
    vehicle.vy,
    ax,
    ay,
    spec.accel * stageMul * energyMul,
    spec.drag,
    spec.max * stageMul * energyMul,
    dt,
  );
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

function drives(diver: Diver, selfId: string) {
  if (selfId === "*") return diver.kind !== "remote";
  return diver.owner === selfId;
}

function stepDiverBody(sim: Sim, diver: Diver, dt: number, selfId: string) {
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

function refillIfRiding(sim: Sim, diver: Diver, dt: number) {
  const vehicle = findVehicle(sim, diver.vehicleId);
  if (!vehicle || !diver.alive) return;
  if (vehicle.destroyed || vehicle.energy <= 0) {
    diver.o2 = Math.max(0, diver.o2 - 1.6 * dt);
    return;
  }
  const tile = tileAt(sim.regions[vehicle.region], vehicle.x, vehicle.y);
  if (tile === 7 && vehicle.kind !== "barrow") diver.o2 = Math.max(0, diver.o2 - 6 * dt);
  diver.o2 = Math.min(diver.o2Max, diver.o2 + craftOf(vehicle.kind).air * dt);
  if (diver.o2 > 8) diver.hypoxia = 0;
}

function transit(sim: Sim, diver: Diver) {
  if (!diver.alive) return;
  const region = sim.regions[diver.region];
  const open = region.gates.filter((g) => g.lock === "none" || sim.flags.mawDead);
  let gate: Gate | undefined;
  for (const candidate of open) {
    const crossed = candidate.dir === 1 ? diver.x > candidate.x : diver.x < candidate.x;
    if (!crossed) continue;
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

function explore(sim: Sim, diver: Diver) {
  const idx = clamp(Math.floor(diver.x / (TILE * 4)), 0, sim.explored[diver.region].length - 1);
  sim.explored[diver.region][idx] = 1;
  for (const vehicle of sim.vehicles) {
    if (vehicle.region !== diver.region || vehicle.seen) continue;
    if (hypot(vehicle.x - diver.x, vehicle.y - diver.y) > 250) continue;
    vehicle.seen = true;
    if (vehicle.kind === "scooter") sim.flags.scooterSeen = true;
    if (vehicle.kind === "kite") sim.flags.kiteSeen = true;
    if (vehicle.kind === "barrow") sim.flags.barrowSeen = true;
    if (diver.kind === "you") {
      note(
        sim,
        vehicle.kind === "barrow"
          ? "Barrow. Helm, tube, and pumps. She was built for the furnaces."
          : vehicle.kind === "kite"
            ? "Kite. Two seats — helm and tube. Battered, and yours if you board."
            : "A scooter. One rider. Kinder than lungs.",
      );
    }
  }
  for (const marker of sim.markers) {
    if (marker.kind !== "lore" || !marker.logId || marker.region !== diver.region) continue;
    if (hypot(marker.x - diver.x, marker.y - diver.y) > 40) continue;
    if (marker.logId === "plains-surface") sim.flags.collarRead = true;
    const before = sim.discovered.slice();
    discover(sim, marker.logId);
    if (sim.discovered.length !== before.length && diver.kind === "you") {
      note(sim, "A record. It is in the journal.");
      for (const line of casesClosedBy(before, marker.logId)) note(sim, line);
    }
  }
  for (const c of sim.creatures) {
    if (c.region === diver.region && hypot(c.x - diver.x, c.y - diver.y) < 230) discover(sim, `beast:${c.kind}`);
  }
}

function stepPickups(sim: Sim) {
  for (const pickup of sim.pickups) {
    if (pickup.taken) continue;
    for (const diver of sim.divers) {
      if (!diver.alive || diver.region !== pickup.region || diver.vehicleId) continue;
      const reach = hypot(pickup.x - diver.x, pickup.y - diver.y);
      if (reach > 40) continue;
      pickup.taken = true;
      const amount = pickup.kind === "o2" ? 52 : pickup.kind === "med" ? 38 : pickup.kind === "ammo" ? 8 : 1;
      collect(sim, diver, pickup.kind, amount);
      break;
    }
  }
}

export function stepSim(sim: Sim, dt: number, auth: boolean, selfId: string) {
  sim.time += dt;
  sim.shake = Math.max(0, sim.shake - dt * 18);
  sim.bossBanner = Math.max(0, sim.bossBanner - dt);
  for (const toast of sim.toasts) toast.life -= dt;
  sim.toasts = sim.toasts.filter((t) => t.life > 0);
  sim.events.length = 0;

  for (const diver of sim.divers) {
    if (diver.kind === "ai" && diver.owner === selfId) thinkAi(sim, diver, auth);
  }
  if (auth) {
    for (const diver of sim.divers) tryFire(sim, diver);
    for (const vehicle of sim.vehicles) {
      if (awake(sim, vehicle.region)) stepVehicle(sim, vehicle, dt);
    }
    for (const id of ASCENT) {
      if (!awake(sim, id)) continue;
      const memory = sim.ecology[id];
      for (const vehicle of sim.vehicles) {
        if (vehicle.region === id && !vehicle.destroyed && vehicle.seats.pilot &&
            hypot(vehicle.vx, vehicle.vy) > 35) emitNoise(memory, vehicle.x, vehicle.y, dt * 16);
      }
      const previousEvents = memory.events.length;
      advanceEcology(memory, dt);
      for (const event of memory.events.slice(previousEvents)) note(sim, ECOLOGY_EVENTS[event.kind]);
    }
    for (const creature of sim.creatures) {
      if (awake(sim, creature.region)) stepCreature(sim, creature, dt);
    }
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

export function exportWorld(sim: Sim): WorldSnap {
  return {
    t: sim.time,
    ecology: createEcology(sim.ecology),
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
      timer: c.timer,
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
      seats: { pilot: v.seats.pilot, gunner: v.seats.gunner, engineer: v.seats.engineer },
      region: v.region,
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
      team: p.team,
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
      tint: d.tint,
    })),
  };
}

export function importWorld(sim: Sim, snap: WorldSnap, selfId: string) {
  sim.ecology = createEcology(snap.ecology);
  sim.flags = { ...sim.flags, ...snap.flags };
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
      timer: c.timer,
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
      engineer: v.seats.engineer ?? null,
    };
  }
  sim.projectiles = snap.projectiles.map((p) => ({
    ...p,
    dmg: p.kind === "torpedo" ? 26 : 14,
    ownerId: "net",
    hw: 8,
    hh: 4,
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
        y: d.y,
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

export function applyOwn(
  sim: Sim,
  snap: {
    id: string;
    owner: string;
    name: string;
    region: RegionId;
    x: number;
    y: number;
    vx: number;
    vy: number;
    facing: Facing;
    hp: number;
    o2: number;
    alive: boolean;
    vehicleId: string | null;
    seat: Seat | null;
    ax: number;
    ay: number;
    aimX?: number;
    aimY?: number;
    fire: boolean;
    cells?: number;
    tint: Diver["tint"];
  },
  selfId: string,
) {
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
      y: snap.y,
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
  if (typeof snap.cells === "number" && Number.isFinite(snap.cells)) local.cells = clamp(Math.floor(snap.cells), 0, 99);
}

export function velocityOf(sim: Sim, selfId: string) {
  const you = sim.divers.find((d) => d.id === selfId);
  if (!you) return { vx: 0, vy: 0 };
  const vehicle = findVehicle(sim, you.vehicleId);
  if (vehicle && you.seat === "pilot") return { vx: vehicle.vx, vy: vehicle.vy };
  return { vx: you.vx, vy: you.vy };
}
