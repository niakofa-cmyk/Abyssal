export const PACK_SLOTS = 20;
export const LOCKER_SLOTS = 8;

export type PackKind = "o2" | "med" | "ammo" | "cell" | "sample" | "scrap";
export type PackSlot = { kind: PackKind; amount: number; from?: string };

const REGIONS = new Set(["breach", "plains", "city", "works", "reef"]);

const LIMIT: Record<PackKind, number> = {
  o2: 4,
  med: 4,
  ammo: 8,
  cell: 3,
  sample: 1,
  scrap: 4,
};

export const SUPPLY_YIELD = { o2: 26, med: 22, ammo: 4, cell: 1 } as const;

const KINDS = new Set<string>(Object.keys(LIMIT));

export function isPackKind(kind: string): kind is PackKind {
  return KINDS.has(kind);
}

export function emptyPack(slots = PACK_SLOTS): Array<PackSlot | null> {
  return Array.from({ length: slots }, () => null);
}

export function revivePack(value: unknown, slots = PACK_SLOTS): Array<PackSlot | null> {
  const pack = emptyPack(slots);
  if (!Array.isArray(value)) return pack;
  for (let i = 0; i < Math.min(slots, value.length); i += 1) {
    const slot = value[i];
    if (!slot || typeof slot !== "object") continue;
    const kind = (slot as { kind?: unknown }).kind;
    const amount = (slot as { amount?: unknown }).amount;
    if (typeof kind !== "string" || !isPackKind(kind)) continue;
    if (!Number.isInteger(amount) || (amount as number) < 1 || (amount as number) > LIMIT[kind]) continue;
    const from = (slot as { from?: unknown }).from;
    pack[i] = {
      kind,
      amount: amount as number,
      ...(kind === "sample" && typeof from === "string" && REGIONS.has(from) ? { from } : {}),
    };
  }
  return pack;
}

/** Returns what would not fit. Mutates the pack. */
export function stow(pack: Array<PackSlot | null>, kind: PackKind, amount: number) {
  let left = Math.max(0, Math.floor(amount));
  for (const slot of pack) {
    if (!slot || slot.kind !== kind || slot.amount >= LIMIT[kind]) continue;
    const take = Math.min(LIMIT[kind] - slot.amount, left);
    slot.amount += take;
    left -= take;
    if (left <= 0) return 0;
  }
  for (let i = 0; i < pack.length && left > 0; i += 1) {
    if (pack[i]) continue;
    const take = Math.min(LIMIT[kind], left);
    pack[i] = { kind, amount: take };
    left -= take;
  }
  return left;
}

export function drawOne(pack: Array<PackSlot | null>, index: number): PackKind | null {
  const slot = pack[index];
  if (!slot) return null;
  slot.amount -= 1;
  const kind = slot.kind;
  if (slot.amount <= 0) pack[index] = null;
  return kind;
}

export function supplyIndex(pack: Array<PackSlot | null>) {
  return pack.findIndex((slot) => slot && slot.kind !== "sample" && slot.kind !== "scrap");
}

export function occupied(pack: Array<PackSlot | null> | undefined) {
  return pack?.filter(Boolean).length ?? 0;
}

export function packLabel(kind: PackKind) {
  if (kind === "o2") return "oxygen";
  if (kind === "med") return "medicine";
  if (kind === "ammo") return "darts";
  if (kind === "cell") return "cell";
  if (kind === "sample") return "slide";
  return "salvage";
}
