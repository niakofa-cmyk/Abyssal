import {
  cycleSeat,
  createSim,
  findDiver,
  insertDiver,
  pressRepair,
  pressUse,
  stepSim,
} from "./sim.ts";
import { TILE, ZONES, type Facing, type Projectile, type RegionId, type Seat, type Sim, type Vehicle } from "./types.ts";
import { casesClosedBy } from "./archive.ts";
import { ECOLOGY_EVENTS, reviveEcology, type RegionEcology } from "./ecology.ts";
import { reviveRewardDrops } from "./rewards.ts";

export const REGIONS: RegionId[] = ["breach", "plains", "city", "works", "reef"];

export type OceanIntent = {
  ax: number;
  ay: number;
  aimX: number;
  aimY: number;
  fire: boolean;
  use?: boolean;
  repair?: boolean;
  cycle?: boolean;
};

export type SectorReport = {
  id: string;
  name: string;
  depth: string;
  state: "live" | "sleep" | "sealed";
  divers: { name: string }[];
  boss?: { name: string; hp: number; hpMax: number; alive: boolean; phase: string };
  hulls: { name: string; riders: number; destroyed: boolean }[];
};

export type DiverView = {
  id: string;
  name: string;
  region: RegionId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: Facing;
  hp: number;
  o2: number;
  ammo: number;
  cells: number;
  alive: boolean;
  vehicleId: string | null;
  seat: Seat | null;
  aimX: number;
  aimY: number;
};

export type OceanSnap = {
  ecology?: RegionEcology;
  time: number;
  flags: Sim["flags"];
  you: DiverView;
  divers: DiverView[];
  creatures: Array<{
    id: string;
    region: RegionId;
    x: number;
    y: number;
    vx: number;
    vy: number;
    facing: Facing;
    hp: number;
    hpMax: number;
    alive: boolean;
    state: string;
    aimX: number;
    aimY: number;
    aggro: boolean;
    timer: number;
    lastHurtBy: string | null;
  }>;
  vehicles: Array<{
    id: string;
    region: RegionId;
    x: number;
    y: number;
    vx: number;
    vy: number;
    facing: Facing;
    hull: number;
    hullMax: number;
    energy: number;
    energyMax: number;
    destroyed: boolean;
    shield: number;
    seats: Vehicle["seats"];
    kind: Vehicle["kind"];
  }>;
  hullWhere: { id: string; region: RegionId; destroyed: boolean }[];
  projectiles: Array<Pick<Projectile, "id" | "region" | "x" | "y" | "vx" | "vy" | "life" | "kind" | "team">>;
  taken: string[];
  /** Current-region creature rewards, shared once across every diver. */
  drops?: Sim["pickups"];
  toasts: string[];
  events: string[];
  seen: string[];
  found: string[];
  explored: Record<RegionId, number[]>;
  roster: SectorReport[];
};

type Crumb = { text: string; life: number };

type OceanPlayer = {
  token: string;
  callsign: string;
  seen: string[];
  explored: Record<RegionId, number[]>;
  toasts: Crumb[];
  pending: string[];
  heard: number;
  adrift: boolean;
  stash: DiverSave | null;
};

type CreatureSave = OceanSnap["creatures"][number] & { timer: number; hurt: number; didHit: boolean };
type VehicleSave = {
  id: string;
  region: RegionId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: Facing;
  hull: number;
  energy: number;
  destroyed: boolean;
  shield: number;
  shieldCd: number;
  fireCd: number;
  seats: Vehicle["seats"];
};
type DiverSave = DiverView & {
  beaconX: number;
  beaconY: number;
  beaconRegion: RegionId;
  respawn: number;
  ax: number;
  ay: number;
  fire: boolean;
};

export type OceanBody = {
  v: 1 | 2;
  flags: Sim["flags"];
  sectors: Record<
    RegionId,
    { time: number; ecology?: RegionEcology; creatures: CreatureSave[]; vehicles: VehicleSave[]; taken: string[]; drops?: Sim["pickups"]; projectiles: OceanSnap["projectiles"] }
  >;
  divers: DiverSave[];
  found?: string[];
  players: { token: string; callsign: string; seen: string[]; explored: Record<RegionId, number[]>; stash: DiverSave | null }[];
};

const MAX_DIVERS = 16;
const QUIET_MS = 9_000;
const SHELVE_MS = 90_000;

function mint() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function cleanName(value: string) {
  const name = value.replace(/[<>]/g, "").trim().slice(0, 18);
  return name || "Unmarked";
}

function blankExplored(sectors: Record<RegionId, Sim>): Record<RegionId, number[]> {
  return {
    breach: sectors.breach.explored.breach.map(() => 0),
    plains: sectors.plains.explored.plains.map(() => 0),
    city: sectors.city.explored.city.map(() => 0),
    works: sectors.works.explored.works.map(() => 0),
    reef: sectors.reef.explored.reef.map(() => 0),
  };
}

function createRegionSim(id: RegionId): Sim {
  const sim = createSim({ selfId: id, name: id, partner: false, soren: false, crew: false });
  sim.creatures = sim.creatures.filter((c) => c.region === id);
  sim.vehicles = sim.vehicles.filter((v) => v.region === id);
  sim.pickups = sim.pickups.filter((p) => p.region === id);
  sim.markers = sim.markers.filter((m) => m.region === id);
  sim.divers = [];
  return sim;
}

function viewDiver(d: Sim["divers"][number]): DiverView {
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
    aimY: d.aimY,
  };
}

export class Ocean {
  flags: Sim["flags"];
  sectors: Record<RegionId, Sim>;
  players = new Map<string, OceanPlayer>();
  /** Shared records. A case can close even when no single diver has read every piece. */
  found: string[] = [];

  constructor() {
    const sectors = {} as Record<RegionId, Sim>;
    for (const id of REGIONS) sectors[id] = createRegionSim(id);
    this.sectors = sectors;
    this.flags = { ...sectors.breach.flags };
  }

  locate(token: string) {
    for (const id of REGIONS) {
      const diver = findDiver(this.sectors[id], token);
      if (diver) return { sim: this.sectors[id], diver, region: id };
    }
    return undefined;
  }

  join(token: string | null, callsign: string) {
    const name = cleanName(callsign);
    if (token && this.players.has(token)) {
      const player = this.players.get(token)!;
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
      const victim = [...this.players.values()]
        .filter((player) => player.stash && !this.locate(player.token))
        .sort((a, b) => a.heard - b.heard)[0];
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
      x: spawn.x + (this.players.size % 4) * 36,
      y: spawn.y + (this.players.size % 3) * 18,
      region: "breach",
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
      stash: null,
    });
    this.toast(id, "You woke in the dark. The air is leaving. Something crossed the east lock before the blast.");
    return id;
  }

  /** Moves a diver between sector sims. Not exposed to clients. */
  place(token: string, region: RegionId, x: number, y: number) {
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

  setIntent(token: string, intent: OceanIntent) {
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
      if (diver.seat && diver.seat !== seat) {
        this.toast(
          diver.id,
          diver.seat === "pilot" ? "You have the helm." : diver.seat === "gunner" ? "You have the tube." : "You have the pumps.",
        );
      }
    }
  }

  step(dt: number) {
    for (const player of this.players.values()) {
      for (const crumb of player.toasts) crumb.life -= dt;
      player.toasts = player.toasts.filter((c) => c.life > 0).slice(0, 4);
    }
    const occupied = REGIONS.filter((id) => this.liveHere(id));
    for (const id of occupied) {
      const sim = this.sectors[id];
      sim.flags = { ...this.flags };
      const previousEcologyEvents = sim.ecology[id].events.length;
      stepSim(sim, dt, true, "*");
      for (const event of sim.ecology[id].events.slice(previousEcologyEvents)) {
        for (const diver of sim.divers) this.toast(diver.id, ECOLOGY_EVENTS[event.kind]);
      }
      this.pullFlags(sim);
      for (const event of sim.events) {
        for (const diver of sim.divers) {
          const player = this.players.get(diver.id);
          if (!player) continue;
          player.pending.push(event);
          if (player.pending.length > 24) player.pending.splice(0, player.pending.length - 24);
          if (event === "reward") this.toast(diver.id, "A shared supply is adrift where the creature fell.");
          else if (event.startsWith("returned:")) {
            this.toast(diver.id, `The ${event.slice("returned:".length)} has returned to its territory.`);
          } else if (event === `air-low:${diver.id}`) {
            this.toast(diver.id, "Oxygen low. Find a refill or return to a working vehicle.");
          } else if (event === `air-empty:${diver.id}`) {
            this.toast(diver.id, "Air exhausted. Return to a working vehicle or find an oxygen cache now.");
          }
        }
      }
      for (const diver of sim.divers) {
        const player = this.players.get(diver.id);
        if (player) this.harvest(player, diver);
      }
    }
    this.transfer();
  }

  snapshot(token: string): OceanSnap {
    const found = this.locate(token);
    if (!found) throw new Error("That dive is gone. Enter the ocean again.");
    const { sim, diver } = found;
    sim.flags = { ...this.flags };
    const player = this.players.get(token)!;
    const events = player.pending.splice(0, player.pending.length);
    return {
      time: sim.time,
      ecology: reviveEcology(sim.ecology[diver.region]),
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
        aggro: c.aggro,
        timer: c.timer,
        lastHurtBy: c.lastHurtBy,
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
        kind: v.kind,
      })),
      hullWhere: REGIONS.flatMap((id) =>
        this.sectors[id].vehicles.map((v) => ({ id: v.id, region: v.region, destroyed: v.destroyed })),
      ),
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
      taken: sim.pickups.filter((p) => p.taken).map((p) => p.id),
      drops: sim.pickups.filter((p) => p.reward && p.region === diver.region).map((p) => ({ ...p })),
      toasts: player.toasts.map((c) => c.text),
      events,
      seen: player.seen,
      found: this.found,
      explored: player.explored,
      roster: this.roster(),
    };
  }

  roster(): SectorReport[] {
    return ZONES.map((zone) => {
      if (zone.state === "sealed" || !REGIONS.includes(zone.id as RegionId)) {
        return { id: zone.id, name: zone.name, depth: zone.depth, state: "sealed" as const, divers: [], hulls: [] };
      }
      const id = zone.id as RegionId;
      const sim = this.sectors[id];
      const maw = id === "plains" ? sim.creatures.find((c) => c.kind === "maw") : undefined;
      return {
        id,
        name: zone.name,
        depth: zone.depth,
        state: sim.divers.some((d) => d.alive) ? "live" : "sleep",
        divers: sim.divers.filter((d) => d.alive).map((d) => ({ name: this.players.get(d.id)?.adrift ? `${d.name} · adrift` : d.name })),
        boss: maw
          ? { name: "Lantern Maw", hp: maw.hp, hpMax: maw.hpMax, alive: maw.alive, phase: maw.alive ? maw.state : "down" }
          : undefined,
        hulls: sim.vehicles.map((v) => ({
          name: v.kind,
          riders: [v.seats.pilot, v.seats.gunner, v.seats.engineer].filter(Boolean).length,
          destroyed: v.destroyed,
        })),
      };
    });
  }

  toBody(): OceanBody {
    const sectors = {} as OceanBody["sectors"];
    for (const id of REGIONS) {
      const sim = this.sectors[id];
      sectors[id] = {
        time: sim.time,
        ecology: reviveEcology(sim.ecology[id]),
        drops: sim.pickups.filter((pickup) => pickup.reward).map((pickup) => ({ ...pickup })),
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
          didHit: c.didHit,
          lastHurtBy: c.lastHurtBy,
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
          seats: { ...v.seats },
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
          team: p.team,
        })),
      };
    }
    const divers: DiverSave[] = [];
    for (const id of REGIONS) {
      for (const diver of this.sectors[id].divers) {
        divers.push({
          ...viewDiver(diver),
          beaconX: diver.beaconX,
          beaconY: diver.beaconY,
          beaconRegion: diver.beaconRegion,
          respawn: diver.respawn,
          ax: diver.ax,
          ay: diver.ay,
          fire: diver.fireLatch,
        });
      }
    }
    return {
      v: 2,
      flags: { ...this.flags },
      sectors,
      divers,
      found: this.found,
      players: [...this.players.values()].map((p) => ({
        token: p.token,
        callsign: p.callsign,
        seen: p.seen,
        explored: p.explored,
        stash: p.stash,
      })),
    };
  }

  static revive(body: OceanBody): Ocean {
    const ocean = new Ocean();
    if ((body?.v !== 1 && body?.v !== 2) || !body.sectors || !body.flags) return ocean;
    ocean.flags = { ...ocean.flags, ...body.flags };
    const found = new Set<string>(Array.isArray(body.found) ? body.found : []);
    for (const player of body.players ?? []) {
      for (const id of player.seen ?? []) found.add(id);
    }
    ocean.found = [...found];
    for (const id of REGIONS) {
      const saved = body.sectors[id];
      const sim = ocean.sectors[id];
      if (!saved) continue;
      sim.time = saved.time || 0;
      sim.ecology[id] = reviveEcology(saved.ecology);
      sim.pickups = sim.pickups.filter((pickup) => !pickup.reward);
      sim.pickups.push(...reviveRewardDrops(saved.drops, sim.regions));
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
        local.lastHurtBy = c.lastHurtBy ?? null;
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
          engineer: v.seats?.engineer ?? null,
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
        hh: 4,
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
        stash: meta.stash ?? null,
      });
    }
    return ocean;
  }

  sweep(now: number) {
    let changed = false;
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
        changed = true;
      }
      if (quiet > SHELVE_MS && this.locate(player.token)) {
        this.shelve(player.token);
        changed = true;
      }
    }
    return changed;
  }

  private liveHere(id: RegionId) {
    return this.sectors[id].divers.some((diver) => {
      if (this.players.get(diver.id)?.adrift) return false;
      return diver.alive || diver.respawn > 0;
    });
  }

  private ensurePresent(token: string) {
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

  private shelve(token: string) {
    const found = this.locate(token);
    const player = this.players.get(token);
    if (!found || !player) return;
    if (found.diver.vehicleId) this.actUse(found.sim, found.diver);
    player.stash = this.saveDiver(found.diver);
    player.adrift = true;
    found.sim.divers = found.sim.divers.filter((diver) => diver.id !== token);
  }

  private saveDiver(diver: Sim["divers"][number]): DiverSave {
    return {
      ...viewDiver(diver),
      beaconX: diver.beaconX,
      beaconY: diver.beaconY,
      beaconRegion: diver.beaconRegion,
      respawn: diver.respawn,
      ax: 0,
      ay: 0,
      fire: false,
    };
  }

  private implant(saved: DiverSave) {
    const region = REGIONS.includes(saved.region) ? saved.region : "breach";
    for (const id of REGIONS) {
      this.sectors[id].divers = this.sectors[id].divers.filter((diver) => diver.id !== saved.id);
    }
    const diver = insertDiver(this.sectors[region], {
      id: saved.id,
      owner: saved.id,
      name: saved.name,
      kind: "partner",
      tint: "remote",
      x: saved.x,
      y: saved.y,
      region,
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
    if (!this.players.has(saved.id)) {
      this.players.set(saved.id, {
        token: saved.id,
        callsign: saved.name,
        seen: [],
        explored: blankExplored(this.sectors),
        toasts: [],
        pending: [],
        heard: Date.now(),
        adrift: false,
        stash: null,
      });
    }
    return diver;
  }

  private rebeacon(player: OceanPlayer) {
    const spawn = this.sectors.breach.regions.breach.spawn;
    insertDiver(this.sectors.breach, {
      id: player.token,
      owner: player.token,
      name: player.callsign,
      kind: "partner",
      tint: "remote",
      x: spawn.x,
      y: spawn.y,
      region: "breach",
    });
    this.toast(player.token, "The beacon pulled you back to the breach.");
  }

  private actUse(sim: Sim, diver: Sim["divers"][number]) {
    const had = diver.vehicleId;
    const seat = diver.seat;
    const wasPowered = sim.ecology[diver.region].powered;
    const toastId = sim.toastId;
    pressUse(sim, diver);
    if (!wasPowered && sim.ecology[diver.region].powered) {
      for (const observer of sim.divers) this.toast(observer.id, ECOLOGY_EVENTS.power);
    } else {
      for (const crumb of sim.toasts.filter((t) => t.id > toastId)) this.toast(diver.id, crumb.text);
    }
    if (had && !diver.vehicleId) this.toast(diver.id, "You slip off the hull.");
    else if (diver.vehicleId && diver.seat !== seat) {
      this.toast(
        diver.id,
        diver.seat === "pilot" ? "You have the helm." : diver.seat === "gunner" ? "You have the tube." : "You have the pumps.",
      );
    }
  }

  private toast(token: string, text: string) {
    const player = this.players.get(token);
    if (!player) return;
    player.toasts.unshift({ text, life: 3.4 });
    player.toasts = player.toasts.slice(0, 4);
  }

  private pullFlags(sim: Sim) {
    if (sim.flags.mawDead) this.flags.mawDead = true;
    if (sim.flags.upgraded) this.flags.upgraded = true;
    if (sim.flags.scooterSeen) this.flags.scooterSeen = true;
    if (sim.flags.kiteSeen) this.flags.kiteSeen = true;
    if (sim.flags.collarRead) this.flags.collarRead = true;
    if (sim.flags.barrowSeen) this.flags.barrowSeen = true;
  }

  private harvest(player: OceanPlayer, diver: Sim["divers"][number]) {
    const row = player.explored[diver.region];
    if (row?.length) {
      const idx = Math.max(0, Math.min(row.length - 1, Math.floor(diver.x / (TILE * 4))));
      row[idx] = 1;
    }
    const sim = this.sectors[diver.region];
    for (const marker of sim.markers) {
      if (marker.kind !== "lore" || !marker.logId || marker.region !== diver.region) continue;
      if (Math.hypot(marker.x - diver.x, marker.y - diver.y) > 40) continue;
      if (!player.seen.includes(marker.logId)) {
        player.seen.push(marker.logId);
        this.toast(
          player.token,
          marker.logId === "breach-sonar"
            ? "A sonar return. The watch crossed out the name. The loft air is still first."
            : marker.logId === "breach-shadow"
              ? "Two watches. One says a hull. The other says it turned. The loft air is still first."
              : "A record. It is in the journal.",
        );
      }
      if (!this.found.includes(marker.logId)) {
        const before = this.found.slice();
        this.found.push(marker.logId);
        for (const line of casesClosedBy(before, marker.logId)) {
          for (const other of this.players.values()) this.toast(other.token, line);
        }
      }
    }
    for (const creature of sim.creatures) {
      if (!creature.alive || creature.region !== diver.region) continue;
      if (Math.hypot(creature.x - diver.x, creature.y - diver.y) > 230) continue;
      const id = `beast:${creature.kind}`;
      if (!player.seen.includes(id)) player.seen.push(id);
    }
  }

  private transfer() {
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
}

export function glideOcean(sim: Sim, dt: number) {
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

export function applyOceanView(sim: Sim, selfId: string, snap: OceanSnap) {
  sim.time = snap.time;
  sim.ecology[snap.you.region] = reviveEcology(snap.ecology);
  sim.flags = { ...snap.flags };
  sim.discovered = [...snap.seen];
  sim.shared = [...(snap.found ?? [])];
  if (Array.isArray(snap.drops)) {
    sim.pickups = sim.pickups.filter((pickup) => !pickup.reward || pickup.region !== snap.you.region);
    sim.pickups.push(...reviveRewardDrops(snap.drops, sim.regions));
  }
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
    creature.timer = Number.isFinite(saved.timer) ? saved.timer : creature.timer;
    creature.lastHurtBy = saved.lastHurtBy ?? null;
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
    hh: 4,
  }));
  const ids = new Set(snap.divers.map((d) => d.id));
  sim.divers = sim.divers.filter((d) => ids.has(d.id));
  for (const saved of snap.divers) {
    let local = sim.divers.find((d) => d.id === saved.id);
    if (!local) {
      local = insertDiver(sim, {
        id: saved.id,
        owner: saved.id,
        name: saved.name,
        kind: saved.id === selfId ? "you" : "remote",
        tint: saved.id === selfId ? "you" : "remote",
        x: saved.x,
        y: saved.y,
        region: saved.region,
      });
    }
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
  sim.toasts = snap.toasts.map((text, index) => ({ id: index + 1, text, life: 2.4 }));
}
