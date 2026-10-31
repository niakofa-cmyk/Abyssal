export const TILE = 32;
export const VIEW_W = 512;
export const VIEW_H = 288;

export type RegionId = "breach" | "plains" | "city" | "works" | "reef";
export type Seat = "pilot" | "gunner" | "engineer";
export type VehicleKind = "scooter" | "kite" | "barrow";
export type CreatureKind = "darter" | "eel" | "hunter" | "maw" | "sentry" | "bloom";
export type PickupKind = "o2" | "med" | "ammo" | "cell";

export type Facing = 1 | -1;

export type Diver = {
  id: string;
  owner: string;
  name: string;
  kind: "you" | "partner" | "ai" | "remote";
  region: RegionId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: Facing;
  hp: number;
  hpMax: number;
  o2: number;
  o2Max: number;
  ammo: number;
  cells: number;
  iframe: number;
  fireCd: number;
  fireLatch: boolean;
  hypoxia: number;
  warned: boolean;
  alive: boolean;
  respawn: number;
  beaconX: number;
  beaconY: number;
  beaconRegion: RegionId;
  vehicleId: string | null;
  seat: Seat | null;
  order: "follow" | "hold";
  holdX: number;
  holdY: number;
  holdRegion: RegionId;
  ax: number;
  ay: number;
  /** Shot direction. Not required to match facing. */
  aimX: number;
  aimY: number;
  netX: number;
  netY: number;
  tint: "you" | "partner" | "ai" | "remote";
};

export type Vehicle = {
  id: string;
  kind: VehicleKind;
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
  fireCd: number;
  shield: number;
  shieldCd: number;
  destroyed: boolean;
  seats: { pilot: string | null; gunner: string | null; engineer: string | null };
  netX: number;
  netY: number;
  seen: boolean;
};

export type Creature = {
  id: string;
  kind: CreatureKind;
  region: RegionId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: Facing;
  hp: number;
  hpMax: number;
  homeX: number;
  homeY: number;
  state: string;
  timer: number;
  alive: boolean;
  hurt: number;
  touchCd: number;
  aimX: number;
  aimY: number;
  didHit: boolean;
  aggro: boolean;
  netX: number;
  netY: number;
};

export type Projectile = {
  id: number;
  region: RegionId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  dmg: number;
  team: "crew" | "wild";
  ownerId: string;
  kind: "harpoon" | "torpedo" | "bite";
  hw: number;
  hh: number;
};

export type Pickup = {
  id: string;
  region: RegionId;
  kind: PickupKind;
  x: number;
  y: number;
  taken: boolean;
};

export type Marker = {
  id: string;
  region: RegionId;
  x: number;
  y: number;
  logId?: string;
  kind: "lore" | "repair" | "upgrade";
};

export type Gate = {
  x: number;
  dir: 1 | -1;
  to: RegionId;
  arrive: { x: number; y: number };
  lock: "none" | "maw";
};

export type Region = {
  id: RegionId;
  name: string;
  depth: number;
  w: number;
  h: number;
  tiles: Uint8Array;
  spawn: { x: number; y: number };
  gates: Gate[];
  /** Primary gate, kept for older readers. */
  gateX: number;
  gateDir: 1 | -1;
  gateTo: RegionId;
  arrive: { x: number; y: number };
};

export type Toast = { id: number; text: string; life: number };

export type Sim = {
  time: number;
  nextId: number;
  toastId: number;
  regions: Record<RegionId, Region>;
  divers: Diver[];
  vehicles: Vehicle[];
  creatures: Creature[];
  projectiles: Projectile[];
  pickups: Pickup[];
  markers: Marker[];
  taken: string[];
  discovered: string[];
  explored: Record<RegionId, number[]>;
  flags: {
    mawDead: boolean;
    upgraded: boolean;
    scooterSeen: boolean;
    kiteSeen: boolean;
    collarRead: boolean;
    barrowSeen: boolean;
  };
  toasts: Toast[];
  events: string[];
  outbox: OutMsg[];
  shake: number;
  bossBanner: number;
};

export type OutMsg =
  | { k: "hurt"; id: string; dmg: number }
  | { k: "grant"; id: string; kind: PickupKind; amount: number }
  | { k: "full" };

export type WorldSnap = {
  t: number;
  flags: Sim["flags"];
  taken: string[];
  creatures: Array<
    Pick<
      Creature,
      | "id"
      | "x"
      | "y"
      | "vx"
      | "vy"
      | "hp"
      | "facing"
      | "state"
      | "alive"
      | "aggro"
      | "aimX"
      | "aimY"
      | "timer"
    >
  >;
  vehicles: Array<
    Pick<
      Vehicle,
      "id" | "x" | "y" | "vx" | "vy" | "facing" | "hull" | "energy" | "destroyed" | "seats" | "region" | "shield"
    >
  >;
  projectiles: Array<
    Pick<Projectile, "id" | "region" | "x" | "y" | "vx" | "vy" | "life" | "kind" | "team">
  >;
  divers: Array<
    Pick<
      Diver,
      | "id"
      | "owner"
      | "name"
      | "kind"
      | "region"
      | "x"
      | "y"
      | "vx"
      | "vy"
      | "facing"
      | "hp"
      | "o2"
      | "alive"
      | "vehicleId"
      | "seat"
      | "tint"
    >
  >;
};

export type OwnSnap = {
  k: "own";
  divers: Array<
    Pick<
      Diver,
      | "id"
      | "owner"
      | "name"
      | "kind"
      | "region"
      | "x"
      | "y"
      | "vx"
      | "vy"
      | "facing"
      | "hp"
      | "o2"
      | "ammo"
      | "cells"
      | "alive"
      | "vehicleId"
      | "seat"
      | "ax"
      | "ay"
      | "aimX"
      | "aimY"
      | "tint"
      | "order"
    > & { fire: boolean }
  >;
};

export const ZONES = [
  { id: "breach", name: "The Breach", depth: "140 m", state: "live" },
  { id: "plains", name: "Abyssal Plains", depth: "310 m", state: "live" },
  { id: "city", name: "Submerged City", depth: "90 m", state: "live" },
  { id: "works", name: "Industrial Depths", depth: "260 m", state: "live" },
  { id: "reef", name: "Living Reef", depth: "70 m", state: "live" },
  { id: "trench", name: "Abyssal Trench", depth: "640 m", state: "sealed" },
  { id: "upper", name: "Upper Ocean", depth: "40 m", state: "sealed" },
  { id: "surface", name: "Surface Frontier", depth: "0 m", state: "sealed" },
] as const;
