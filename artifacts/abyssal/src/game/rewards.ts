import { TILE, type CreatureKind, type Pickup, type PickupKind, type RegionId, type Sim } from "./types.ts";

export type CreatureDrop = { kind: PickupKind; amount: number };

export type RespawnRule = { cooldown: number; quietBelow: number };
export const MAX_REWARD_DROPS = 64;

/** Ordinary inhabitants recover only while a sector is active and its habitat is quiet. */
export const CREATURE_RESPAWN_RULES: Partial<Record<CreatureKind, RespawnRule>> = {
  darter: { cooldown: 55, quietBelow: 38 },
  eel: { cooldown: 155, quietBelow: 24 },
  hunter: { cooldown: 125, quietBelow: 34 },
  bloom: { cooldown: 100, quietBelow: 30 },
};

const DROP_TABLES: Partial<Record<CreatureKind, { through: number; drop?: CreatureDrop }[]>> = {
  darter: [
    { through: 48 },
    { through: 82, drop: { kind: "ammo", amount: 3 } },
    { through: 96, drop: { kind: "o2", amount: 18 } },
    { through: 100, drop: { kind: "med", amount: 12 } },
  ],
  eel: [
    { through: 42 },
    { through: 58, drop: { kind: "cell", amount: 1 } },
    { through: 82, drop: { kind: "med", amount: 18 } },
    { through: 100, drop: { kind: "ammo", amount: 3 } },
  ],
  hunter: [
    { through: 25 },
    { through: 63, drop: { kind: "ammo", amount: 6 } },
    { through: 86, drop: { kind: "med", amount: 22 } },
    { through: 100, drop: { kind: "cell", amount: 1 } },
  ],
  bloom: [
    { through: 30 },
    { through: 62, drop: { kind: "med", amount: 24 } },
    { through: 88, drop: { kind: "o2", amount: 24 } },
    { through: 100, drop: { kind: "ammo", amount: 4 } },
  ],
  sentry: [
    { through: 35 },
    { through: 62, drop: { kind: "cell", amount: 1 } },
    { through: 100, drop: { kind: "ammo", amount: 6 } },
  ],
};

function stableRoll(creatureId: string, defeatedAt: number) {
  const input = `${creatureId}:${Math.floor(defeatedAt * 60)}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % 100 + 1;
}

/** Server/host decides once from stable encounter state; all peers see that same world drop. */
export function rewardForDefeat(kind: CreatureKind, creatureId: string, defeatedAt: number): CreatureDrop | null {
  const table = DROP_TABLES[kind];
  if (!table || !Number.isFinite(defeatedAt) || defeatedAt < 0) return null;
  const roll = stableRoll(creatureId, defeatedAt);
  return table.find((entry) => roll <= entry.through)?.drop ?? null;
}

/** Revives only bounded, world-shaped reward pickups. Older saves simply supply an empty list. */
export function reviveRewardDrops(value: unknown, regions: Sim["regions"]): Pickup[] {
  if (!Array.isArray(value)) return [];
  const result: Pickup[] = [];
  const seen = new Set<string>();
  for (const candidate of value.slice(-MAX_REWARD_DROPS)) {
    if (!candidate || typeof candidate !== "object") continue;
    const pickup = candidate as Partial<Pickup>;
    const region = pickup.region as RegionId;
    if (!Object.hasOwn(regions, region) || pickup.reward !== true || typeof pickup.id !== "string" ||
        pickup.id.length > 140 || !/^reward:[A-Za-z0-9_.%~-]{1,100}:\d{1,12}$/.test(pickup.id) || seen.has(pickup.id)) continue;
    const area = regions[region];
    if (!Number.isFinite(pickup.x) || !Number.isFinite(pickup.y) ||
        pickup.x! < 0 || pickup.y! < 0 || pickup.x! > area.w * TILE || pickup.y! > area.h * TILE) continue;
    if (!["o2", "med", "ammo", "cell"].includes(pickup.kind ?? "") ||
        !Number.isInteger(pickup.amount) || pickup.amount! < 1 || pickup.amount! > 64 ||
        typeof pickup.taken !== "boolean") continue;
    seen.add(pickup.id);
    result.push({
      id: pickup.id,
      region,
      kind: pickup.kind!,
      x: pickup.x!,
      y: pickup.y!,
      amount: pickup.amount,
      reward: true,
      taken: pickup.taken,
    });
  }
  return result;
}
