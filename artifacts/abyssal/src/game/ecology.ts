import type { RegionId } from "./types.ts";

export const ECOLOGY_EVENTS = {
  power: "A diver restored the district grid. Warm conduits are drawing ribbon eels toward the station.",
  disturbance: "Repeated weapons or engine noise scattered the small life and drew predators toward the disturbance.",
  bloom: "Bioluminescent growth has spread along the restored power conduits.",
  signal: "The powered station answered with an old sonar pulse. The district is no longer silent.",
} as const;

export type EcologyEventKind = keyof typeof ECOLOGY_EVENTS;
export type RegionEcology = {
  powered: boolean;
  bloom: number;
  noise: number;
  disturbance: number;
  activeSeconds: number;
  poweredSeconds: number;
  source: { x: number; y: number } | null;
  station: { x: number; y: number } | null;
  events: { kind: EcologyEventKind; at: number }[];
};
export type Ecology = Record<RegionId, RegionEcology>;

const REGIONS: RegionId[] = ["breach", "plains", "city", "works", "reef"];
const bounded = (n: unknown, max: number) =>
  typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0;
const point = (value: unknown): RegionEcology["source"] => {
  if (!value || typeof value !== "object") return null;
  const p = value as { x?: unknown; y?: unknown };
  return typeof p.x === "number" && Number.isFinite(p.x) && typeof p.y === "number" && Number.isFinite(p.y)
    ? { x: p.x, y: p.y }
    : null;
};

/** Missing fields deliberately revive as an untouched region, including older saves. */
export function reviveEcology(value?: Partial<RegionEcology> | null): RegionEcology {
  const events: RegionEcology["events"] = [];
  for (const event of Array.isArray(value?.events) ? value.events : []) {
    if (!event || !Object.hasOwn(ECOLOGY_EVENTS, event.kind) || events.some((e) => e.kind === event.kind)) continue;
    events.push({ kind: event.kind, at: bounded(event.at, Number.MAX_SAFE_INTEGER) });
  }
  const station = point(value?.station);
  return {
    powered: value?.powered === true && station !== null,
    bloom: bounded(value?.bloom, 1),
    noise: bounded(value?.noise, 100),
    disturbance: bounded(value?.disturbance, 1_000_000),
    activeSeconds: bounded(value?.activeSeconds, Number.MAX_SAFE_INTEGER),
    poweredSeconds: bounded(value?.poweredSeconds, Number.MAX_SAFE_INTEGER),
    source: point(value?.source),
    station,
    events: events.slice(-8),
  };
}

export function createEcology(value?: Partial<Ecology>): Ecology {
  return Object.fromEntries(REGIONS.map((id) => [id, reviveEcology(value?.[id])])) as Ecology;
}

function remember(memory: RegionEcology, kind: EcologyEventKind) {
  if (memory.events.some((event) => event.kind === kind)) return;
  memory.events.push({ kind, at: memory.activeSeconds });
  memory.events = memory.events.slice(-8);
}

export function emitNoise(memory: RegionEcology, x: number, y: number, strength: number) {
  const amount = bounded(strength, 100);
  if (!amount || !Number.isFinite(x) || !Number.isFinite(y)) return;
  memory.noise = Math.min(100, memory.noise + amount);
  memory.disturbance = Math.min(1_000_000, memory.disturbance + amount);
  memory.source = { x, y };
  if (memory.noise >= 60) remember(memory, "disturbance");
}

export function restorePower(memory: RegionEcology, x: number, y: number): boolean {
  if (memory.powered || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  memory.powered = true;
  memory.station = { x, y };
  memory.poweredSeconds = 0;
  remember(memory, "power");
  emitNoise(memory, x, y, 35);
  return true;
}

/** Called only by the authoritative simulation of an occupied region. No random events or wall-clock catch-up. */
export function advanceEcology(memory: RegionEcology, dt: number) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  memory.activeSeconds += dt;
  memory.noise = Math.max(0, memory.noise - dt * 6);
  if (!memory.powered) return;
  memory.poweredSeconds += dt;
  memory.bloom = Math.min(1, memory.poweredSeconds / 90);
  if (memory.bloom >= 0.25) remember(memory, "bloom");
  if (memory.poweredSeconds >= 45) remember(memory, "signal");
}

export function ecologySummary(memory: RegionEcology) {
  if (memory.noise >= 40) return "Disturbed · small life scattering; predators investigate noise";
  if (memory.bloom >= 0.25) return "Recovering · bioluminescent growth along warm conduits";
  if (memory.powered) return "Grid restored · ribbon eels investigate the warm station";
  return "Quiet · the district grid is dark";
}
