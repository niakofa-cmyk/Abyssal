import type { Pickup, RegionId, Sim } from "./types";
import { createEcology, type Ecology } from "./ecology.ts";
import { CREATURE_RESPAWN_RULES, reviveRewardDrops } from "./rewards.ts";

const PROFILE = "abyssal-profile-v2";
const LEGACY_PROFILE = "abyssal-profile-v1";
const SAVE = "abyssal-save-v1";

export type Profile = {
  callsign: string;
  room: string;
  partner: boolean;
  soren: boolean;
  muted: boolean;
  linkMode: "ocean" | "frequency";
};

export type SaveFile = {
  version: 2;
  ecology?: Ecology;
  time: number;
  you: { region: RegionId; x: number; y: number; hp: number; o2: number; ammo: number; cells: number };
  discovered: string[];
  explored: Record<RegionId, number[]>;
  flags: Sim["flags"];
  taken: string[];
  vehicles: { id: string; hull: number; energy: number; destroyed: boolean; region: RegionId; x: number; y: number }[];
  creatures: { id: string; hp: number; alive: boolean; x: number; y: number; timer?: number; lastHurtBy?: string | null }[];
  drops?: Pickup[];
};

export function loadProfile(): Profile {
  const blank: Profile = {
    callsign: "",
    room: `abyss-${Math.random().toString(36).slice(2, 6)}`,
    partner: false,
    soren: false,
    muted: false,
    linkMode: "ocean",
  };
  if (typeof localStorage === "undefined") return blank;
  try {
    const current = localStorage.getItem(PROFILE);
    const raw = current ?? localStorage.getItem(LEGACY_PROFILE);
    if (!raw) return blank;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    const fromLegacy = !current;
    const next: Profile = {
      ...blank,
      ...parsed,
      room: parsed.room || blank.room,
      partner: fromLegacy ? false : Boolean(parsed.partner),
      soren: fromLegacy ? false : Boolean(parsed.soren),
      linkMode: parsed.linkMode === "frequency" ? "frequency" : "ocean",
    };
    if (fromLegacy) localStorage.setItem(PROFILE, JSON.stringify(next));
    return next;
  } catch {
    return blank;
  }
}

export function saveProfile(profile: Profile) {
  localStorage.setItem(PROFILE, JSON.stringify(profile));
}

export function hasSave() {
  return typeof localStorage !== "undefined" && !!localStorage.getItem(SAVE);
}

export function loadSave(): SaveFile | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Omit<Partial<SaveFile>, "version"> & { version?: number };
    if ((parsed.version !== 1 && parsed.version !== 2) || !parsed.you || !Number.isFinite(parsed.time) ||
        !Array.isArray(parsed.creatures) || !Array.isArray(parsed.vehicles) ||
        !Array.isArray(parsed.discovered) || !Array.isArray(parsed.taken) || !parsed.flags || !parsed.explored) return null;
    return { ...parsed, version: 2, drops: Array.isArray(parsed.drops) ? parsed.drops : [] } as SaveFile;
  } catch {
    return null;
  }
}

export function writeSave(sim: Sim, selfId: string) {
  const you = sim.divers.find((d) => d.id === selfId);
  if (!you) return;
  const file: SaveFile = {
    version: 2,
    time: sim.time,
    you: {
      region: you.region,
      x: you.x,
      y: you.y,
      hp: you.hp,
      o2: you.o2,
      ammo: you.ammo,
      cells: you.cells,
    },
    ecology: createEcology(sim.ecology),
    discovered: sim.discovered,
    explored: sim.explored,
    flags: sim.flags,
    taken: sim.pickups.filter((p) => p.taken).map((p) => p.id),
    vehicles: sim.vehicles.map((v) => ({
      id: v.id,
      hull: v.hull,
      energy: v.energy,
      destroyed: v.destroyed,
      region: v.region,
      x: v.x,
      y: v.y,
    })),
    creatures: sim.creatures.map((c) => ({
      id: c.id,
      hp: c.hp,
      alive: c.alive,
      x: c.x,
      y: c.y,
      timer: c.timer,
      lastHurtBy: c.lastHurtBy,
    })),
    drops: sim.pickups.filter((pickup) => pickup.reward).map((pickup) => ({ ...pickup })),
  };
  localStorage.setItem(SAVE, JSON.stringify(file));
}

export function clearSave() {
  localStorage.removeItem(SAVE);
}

export function applySave(sim: Sim, selfId: string, file: SaveFile) {
  sim.time = file.time;
  sim.ecology = createEcology(file.ecology);
  sim.pickups = sim.pickups.filter((pickup) => !pickup.reward);
  sim.pickups.push(...reviveRewardDrops(file.drops, sim.regions));
  sim.discovered = [...file.discovered];
  sim.flags = { ...sim.flags, ...file.flags };
  for (const id of Object.keys(sim.explored) as RegionId[]) {
    const incoming = file.explored?.[id];
    if (!incoming) continue;
    const next = sim.explored[id].slice();
    for (let i = 0; i < Math.min(next.length, incoming.length); i += 1) next[i] = incoming[i] ? 1 : 0;
    sim.explored[id] = next;
  }
  for (const id of file.taken) {
    const p = sim.pickups.find((item) => item.id === id);
    if (p) p.taken = true;
  }
  for (const snap of file.vehicles) {
    const v = sim.vehicles.find((item) => item.id === snap.id);
    if (!v) continue;
    v.hull = snap.hull;
    v.energy = snap.energy;
    v.destroyed = snap.destroyed;
    v.region = snap.region;
    v.x = snap.x;
    v.y = snap.y;
    v.netX = snap.x;
    v.netY = snap.y;
  }
  for (const snap of file.creatures) {
    const c = sim.creatures.find((item) => item.id === snap.id);
    if (!c) continue;
    c.hp = snap.hp;
    c.alive = snap.alive;
    c.x = snap.x;
    c.y = snap.y;
    c.netX = snap.x;
    c.netY = snap.y;
    c.timer = Number.isFinite(snap.timer) ? snap.timer! : c.alive ? c.timer : CREATURE_RESPAWN_RULES[c.kind]?.cooldown ?? 0;
    c.lastHurtBy = snap.lastHurtBy ?? null;
  }
  const you = sim.divers.find((d) => d.id === selfId);
  if (!you) return;
  you.region = file.you.region;
  you.x = file.you.x;
  you.y = file.you.y;
  you.netX = file.you.x;
  you.netY = file.you.y;
  you.hp = file.you.hp;
  you.o2 = file.you.o2;
  you.ammo = file.you.ammo;
  you.cells = file.you.cells;
  you.beaconRegion = file.you.region;
  you.beaconX = file.you.x;
  you.beaconY = file.you.y;
  you.alive = you.hp > 0;
}
