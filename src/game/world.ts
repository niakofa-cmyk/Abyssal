import type { Creature, Gate, Marker, Pickup, Region, RegionId, Vehicle } from "./types.ts";
import { TILE } from "./types.ts";

function cave(w: number, h: number) {
  const tiles = new Uint8Array(w * h);
  tiles.fill(1);
  return tiles;
}

function paint(
  tiles: Uint8Array,
  w: number,
  h: number,
  x: number,
  y: number,
  rw: number,
  rh: number,
  tile: number,
) {
  for (let j = y; j < y + rh; j++) {
    for (let i = x; i < x + rw; i++) {
      if (i >= 0 && j >= 0 && i < w && j < h) tiles[j * w + i] = tile;
    }
  }
}

function pillar(tiles: Uint8Array, w: number, h: number, x: number) {
  paint(tiles, w, h, x, 4, 2, 4, 1);
  paint(tiles, w, h, x, 11, 2, 3, 1);
}

function withGates(region: Omit<Region, "gateX" | "gateDir" | "gateTo" | "arrive"> & { gates: Gate[] }): Region {
  const primary = region.gates[0];
  return {
    ...region,
    gateX: primary.x,
    gateDir: primary.dir,
    gateTo: primary.to,
    arrive: primary.arrive,
  };
}

export function tileAt(region: Region, px: number, py: number): number {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  if (tx < 0 || ty < 0 || tx >= region.w || ty >= region.h) return 1;
  return region.tiles[ty * region.w + tx] ?? 1;
}

export function isSolid(region: Region, px: number, py: number, mawDead: boolean): boolean {
  const t = tileAt(region, px, py);
  if (t === 1 || t === 9) return true;
  if (t === 8 && !mawDead) return true;
  return false;
}

function buildBreach(): Region {
  const w = 150;
  const h = 18;
  const tiles = cave(w, h);
  paint(tiles, w, h, 2, 4, 144, 10, 0);
  paint(tiles, w, h, 70, 2, 18, 3, 0);
  paint(tiles, w, h, 88, 13, 22, 3, 0);
  for (const x of [28, 48, 86, 110, 128]) pillar(tiles, w, h, x);
  paint(tiles, w, h, 58, 6, 3, 7, 2);
  for (let x = 8; x < 140; x += 7) {
    if (tiles[13 * w + x] === 0) tiles[13 * w + x] = 3;
    if (tiles[5 * w + (x + 3)] === 0 && x % 2 === 0) tiles[5 * w + (x + 3)] = 3;
  }
  // West loft and a chimney down into the corridor. The first air lives up here.
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
    spawn: { x: 6 * TILE, y: 9 * TILE },
    gates: [{ x: 132 * TILE, dir: 1, to: "plains", arrive: { x: 8 * TILE, y: 10 * TILE }, lock: "none" }],
  });
}

function buildPlains(): Region {
  const w = 186;
  const h = 20;
  const tiles = cave(w, h);
  paint(tiles, w, h, 2, 3, 150, 14, 0);
  paint(tiles, w, h, 36, 15, 40, 3, 0);
  paint(tiles, w, h, 152, 5, 3, 11, 8);
  paint(tiles, w, h, 155, 4, 28, 12, 0);
  for (const x of [24, 64, 96]) paint(tiles, w, h, x, 4, 2, 5, 1);
  for (let x = 18; x < 140; x += 5) {
    if (tiles[8 * w + x] === 0) tiles[8 * w + x] = x % 10 === 0 ? 5 : 4;
  }
  for (let x = 160; x < 180; x += 4) {
    if (tiles[6 * w + x] === 0) tiles[6 * w + x] = 3;
  }
  return withGates({
    id: "plains",
    name: "Abyssal Plains",
    depth: 310,
    w,
    h,
    tiles,
    spawn: { x: 8 * TILE, y: 10 * TILE },
    gates: [
      { x: 3.2 * TILE, dir: -1, to: "breach", arrive: { x: 124 * TILE, y: 9 * TILE }, lock: "none" },
      { x: 176 * TILE, dir: 1, to: "city", arrive: { x: 8 * TILE, y: 8 * TILE }, lock: "maw" },
    ],
  });
}

function buildCity(): Region {
  const w = 132;
  const h = 18;
  const tiles = cave(w, h);
  paint(tiles, w, h, 2, 3, 126, 12, 0);
  for (const x of [24, 48, 76, 102]) {
    paint(tiles, w, h, x, 3, 5, 12, 1);
    paint(tiles, w, h, x, 7, 5, 3, 0);
  }
  for (const x of [36, 62, 90]) paint(tiles, w, h, x, 4, 2, 10, 6);
  paint(tiles, w, h, 14, 13, 10, 1, 2);
  return withGates({
    id: "city",
    name: "Submerged City",
    depth: 90,
    w,
    h,
    tiles,
    spawn: { x: 8 * TILE, y: 8 * TILE },
    gates: [
      { x: 2.6 * TILE, dir: -1, to: "plains", arrive: { x: 168 * TILE, y: 9 * TILE }, lock: "none" },
      { x: 124 * TILE, dir: 1, to: "works", arrive: { x: 8 * TILE, y: 8 * TILE }, lock: "none" },
    ],
  });
}

function buildWorks(): Region {
  const w = 118;
  const h = 16;
  const tiles = cave(w, h);
  paint(tiles, w, h, 2, 4, 112, 8, 0);
  for (const x of [30, 60, 88]) paint(tiles, w, h, x, 4, 4, 3, 1);
  for (let x = 16; x < 100; x += 14) paint(tiles, w, h, x, 10, 6, 1, 2);
  for (let x = 42; x < 52; x++) if (tiles[7 * w + x] === 0) tiles[7 * w + x] = 4;
  return withGates({
    id: "works",
    name: "Industrial Depths",
    depth: 260,
    w,
    h,
    tiles,
    spawn: { x: 8 * TILE, y: 8 * TILE },
    gates: [
      { x: 2.8 * TILE, dir: -1, to: "city", arrive: { x: 114 * TILE, y: 8 * TILE }, lock: "none" },
      { x: 110 * TILE, dir: 1, to: "reef", arrive: { x: 8 * TILE, y: 8 * TILE }, lock: "none" },
    ],
  });
}

function buildReef(): Region {
  const w = 124;
  const h = 16;
  const tiles = cave(w, h);
  paint(tiles, w, h, 2, 3, 108, 10, 0);
  for (let x = 12; x < 100; x += 4) {
    if (tiles[12 * w + x] === 0) tiles[12 * w + x] = 3;
    if (x % 8 === 0 && tiles[5 * w + x] === 0) tiles[5 * w + x] = 3;
  }
  for (const x of [32, 54, 80]) paint(tiles, w, h, x, 7, 5, 2, 7);
  paint(tiles, w, h, 112, 3, 4, 10, 9);
  return withGates({
    id: "reef",
    name: "Living Reef",
    depth: 70,
    w,
    h,
    tiles,
    spawn: { x: 8 * TILE, y: 8 * TILE },
    gates: [{ x: 2.6 * TILE, dir: -1, to: "works", arrive: { x: 100 * TILE, y: 8 * TILE }, lock: "none" }],
  });
}

function diverCreature(
  id: string,
  kind: Creature["kind"],
  region: RegionId,
  x: number,
  y: number,
  hp: number,
): Creature {
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
    netY: y,
  };
}

function hull(partial: Pick<Vehicle, "id" | "kind" | "region" | "x" | "y" | "hull" | "hullMax" | "energy" | "energyMax">): Vehicle {
  return {
    ...partial,
    vx: 0,
    vy: 0,
    facing: 1,
    fireCd: 0,
    shield: 0,
    shieldCd: 0,
    destroyed: false,
    seats: { pilot: null, gunner: null, engineer: null },
    netX: partial.x,
    netY: partial.y,
    seen: false,
  };
}

export function buildLayout() {
  const breach = buildBreach();
  const plains = buildPlains();
  const city = buildCity();
  const works = buildWorks();
  const reef = buildReef();
  const regions: Record<RegionId, Region> = { breach, plains, city, works, reef };

  const creatures: Creature[] = [
    diverCreature("b-d1", "darter", "breach", 14 * TILE, 8 * TILE, 8),
    diverCreature("b-d2", "darter", "breach", 22 * TILE, 11 * TILE, 8),
    diverCreature("b-d3", "darter", "breach", 40 * TILE, 7 * TILE, 8),
    diverCreature("b-d4", "darter", "breach", 100 * TILE, 10 * TILE, 8),
    diverCreature("b-e1", "eel", "breach", 34 * TILE, 9 * TILE, 36),
    diverCreature("b-e2", "eel", "breach", 72 * TILE, 12 * TILE, 36),
    diverCreature("b-e3", "eel", "breach", 116 * TILE, 8 * TILE, 42),
    diverCreature("b-h1", "hunter", "breach", 98 * TILE, 14 * TILE, 78),
    diverCreature("p-d1", "darter", "plains", 20 * TILE, 8 * TILE, 8),
    diverCreature("p-d2", "darter", "plains", 50 * TILE, 12 * TILE, 8),
    diverCreature("p-d3", "darter", "plains", 80 * TILE, 7 * TILE, 8),
    diverCreature("p-e1", "eel", "plains", 28 * TILE, 14 * TILE, 40),
    diverCreature("p-e2", "eel", "plains", 90 * TILE, 11 * TILE, 44),
    diverCreature("p-h1", "hunter", "plains", 58 * TILE, 9 * TILE, 90),
    diverCreature("p-h2", "hunter", "plains", 108 * TILE, 13 * TILE, 90),
    diverCreature("p-maw", "maw", "plains", 122 * TILE, 9 * TILE, 480),
    diverCreature("c-d1", "darter", "city", 12 * TILE, 10 * TILE, 8),
    diverCreature("c-d2", "darter", "city", 40 * TILE, 6 * TILE, 8),
    diverCreature("c-e1", "eel", "city", 40 * TILE, 11 * TILE, 40),
    diverCreature("c-h1", "hunter", "city", 86 * TILE, 10 * TILE, 84),
    diverCreature("w-e1", "eel", "works", 22 * TILE, 8 * TILE, 42),
    diverCreature("w-s1", "sentry", "works", 44 * TILE, 8 * TILE, 46),
    diverCreature("w-s2", "sentry", "works", 72 * TILE, 7 * TILE, 46),
    diverCreature("w-s3", "sentry", "works", 98 * TILE, 8 * TILE, 52),
    diverCreature("r-d1", "darter", "reef", 18 * TILE, 6 * TILE, 8),
    diverCreature("r-d2", "darter", "reef", 46 * TILE, 10 * TILE, 8),
    diverCreature("r-b1", "bloom", "reef", 26 * TILE, 9 * TILE, 70),
    diverCreature("r-b2", "bloom", "reef", 58 * TILE, 8 * TILE, 70),
    diverCreature("r-b3", "bloom", "reef", 90 * TILE, 10 * TILE, 80),
    diverCreature("r-e1", "eel", "reef", 72 * TILE, 6 * TILE, 40),
  ];

  const vehicles: Vehicle[] = [
    hull({
      id: "scooter-1",
      kind: "scooter",
      region: "breach",
      x: 78 * TILE,
      y: 3.4 * TILE,
      hull: 70,
      hullMax: 70,
      energy: 80,
      energyMax: 100,
    }),
    hull({
      id: "kite-1",
      kind: "kite",
      region: "plains",
      x: 34 * TILE,
      y: 12 * TILE,
      hull: 160,
      hullMax: 160,
      energy: 100,
      energyMax: 100,
    }),
    hull({
      id: "barrow-1",
      kind: "barrow",
      region: "city",
      x: 14 * TILE,
      y: 9 * TILE,
      hull: 260,
      hullMax: 260,
      energy: 140,
      energyMax: 140,
    }),
  ];

  const pickup = (id: string, region: RegionId, kind: Pickup["kind"], x: number, y: number): Pickup => ({
    id,
    region,
    kind,
    x,
    y,
    taken: false,
  });

  const pickups: Pickup[] = [
    pickup("o2-a", "breach", "o2", 20 * TILE, 3 * TILE),
    pickup("o2-a2", "breach", "o2", 24 * TILE, 3 * TILE),
    pickup("o2-b", "breach", "o2", 72 * TILE, 4 * TILE),
    pickup("med-a", "breach", "med", 34 * TILE, 11 * TILE),
    pickup("o2-c", "breach", "o2", 100 * TILE, 12 * TILE),
    pickup("ammo-a", "breach", "ammo", 62 * TILE, 8 * TILE),
    pickup("cell-a", "breach", "cell", 44 * TILE, 8 * TILE),
    pickup("o2-d", "breach", "o2", 84 * TILE, 12 * TILE),
    pickup("med-b", "breach", "med", 108 * TILE, 9 * TILE),
    pickup("o2-e", "breach", "o2", 120 * TILE, 11 * TILE),
    pickup("ammo-b", "breach", "ammo", 74 * TILE, 4 * TILE),
    pickup("o2-f", "plains", "o2", 16 * TILE, 9 * TILE),
    pickup("o2-g", "plains", "o2", 30 * TILE, 13 * TILE),
    pickup("cell-b", "plains", "cell", 40 * TILE, 10 * TILE),
    pickup("med-c", "plains", "med", 52 * TILE, 8 * TILE),
    pickup("ammo-c", "plains", "ammo", 70 * TILE, 12 * TILE),
    pickup("o2-h", "plains", "o2", 88 * TILE, 7 * TILE),
    pickup("o2-i", "plains", "o2", 104 * TILE, 14 * TILE),
    pickup("med-d", "plains", "med", 112 * TILE, 8 * TILE),
    pickup("cell-c", "plains", "cell", 166 * TILE, 9 * TILE),
    pickup("o2-j", "plains", "o2", 170 * TILE, 11 * TILE),
    pickup("o2-k", "city", "o2", 10 * TILE, 6 * TILE),
    pickup("med-e", "city", "med", 18 * TILE, 11 * TILE),
    pickup("cell-d", "city", "cell", 20 * TILE, 8 * TILE),
    pickup("o2-l", "city", "o2", 42 * TILE, 6 * TILE),
    pickup("ammo-d", "city", "ammo", 66 * TILE, 10 * TILE),
    pickup("o2-m", "city", "o2", 96 * TILE, 11 * TILE),
    pickup("cell-e", "works", "cell", 18 * TILE, 7 * TILE),
    pickup("o2-n", "works", "o2", 24 * TILE, 9 * TILE),
    pickup("med-f", "works", "med", 50 * TILE, 8 * TILE),
    pickup("ammo-e", "works", "ammo", 76 * TILE, 9 * TILE),
    pickup("o2-o", "works", "o2", 94 * TILE, 7 * TILE),
    pickup("cell-f", "works", "cell", 104 * TILE, 9 * TILE),
    pickup("o2-p", "reef", "o2", 16 * TILE, 8 * TILE),
    pickup("med-g", "reef", "med", 40 * TILE, 6 * TILE),
    pickup("o2-q", "reef", "o2", 70 * TILE, 11 * TILE),
    pickup("cell-g", "reef", "cell", 96 * TILE, 7 * TILE),
  ];

  const markers: Marker[] = [
    { id: "m1", region: "breach", x: 20 * TILE, y: 8 * TILE, kind: "lore", logId: "breach-blackbox" },
    { id: "m2", region: "breach", x: 66 * TILE, y: 12 * TILE, kind: "lore", logId: "breach-bio" },
    { id: "m3", region: "breach", x: 104 * TILE, y: 7 * TILE, kind: "lore", logId: "breach-order" },
    { id: "m4", region: "breach", x: 44 * TILE, y: 6.5 * TILE, kind: "upgrade" },
    { id: "m5", region: "breach", x: 80 * TILE, y: 5 * TILE, kind: "repair" },
    { id: "m6", region: "plains", x: 22 * TILE, y: 6 * TILE, kind: "lore", logId: "plains-city" },
    { id: "m7", region: "plains", x: 100 * TILE, y: 6 * TILE, kind: "lore", logId: "plains-maw" },
    { id: "m8", region: "plains", x: 168 * TILE, y: 8 * TILE, kind: "lore", logId: "plains-surface" },
    { id: "m9", region: "plains", x: 36 * TILE, y: 10 * TILE, kind: "repair" },
    { id: "m10", region: "city", x: 18 * TILE, y: 6 * TILE, kind: "lore", logId: "city-barrow" },
    { id: "m11", region: "city", x: 70 * TILE, y: 11 * TILE, kind: "lore", logId: "city-tram" },
    { id: "m12", region: "city", x: 16 * TILE, y: 12 * TILE, kind: "repair" },
    { id: "m13", region: "works", x: 36 * TILE, y: 9 * TILE, kind: "lore", logId: "works-vent" },
    { id: "m14", region: "works", x: 80 * TILE, y: 6 * TILE, kind: "repair" },
    { id: "m15", region: "reef", x: 34 * TILE, y: 5 * TILE, kind: "lore", logId: "reef-spore" },
    { id: "m16", region: "reef", x: 104 * TILE, y: 8 * TILE, kind: "lore", logId: "reef-collar" },
  ];

  return { regions, creatures, vehicles, pickups, markers };
}
