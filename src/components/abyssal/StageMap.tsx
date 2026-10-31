import { Lock } from "lucide-react";
import type { SectorReport } from "@/game/ocean";
import type { RegionId } from "@/game/types";

const SPOT: Record<string, { x: number; y: number; n?: number }> = {
  breach: { x: 18, y: 28, n: 1 },
  plains: { x: 46, y: 42, n: 2 },
  city: { x: 24, y: 68, n: 3 },
  works: { x: 52, y: 74, n: 4 },
  reef: { x: 78, y: 52, n: 5 },
  trench: { x: 74, y: 16 },
  upper: { x: 86, y: 30 },
  surface: { x: 90, y: 12 },
};

const SHORT: Record<string, string> = {
  breach: "Breach",
  plains: "Plains",
  city: "City",
  works: "Works",
  reef: "Reef",
  trench: "Trench",
  upper: "Upper",
  surface: "Surface",
};

const LINKS: [string, string][] = [
  ["breach", "plains"],
  ["plains", "city"],
  ["city", "works"],
  ["works", "reef"],
  ["plains", "trench"],
  ["reef", "upper"],
  ["upper", "surface"],
];

function stars(explored: number[] | undefined) {
  if (!explored?.length) return 0;
  const filled = explored.filter(Boolean).length / explored.length;
  if (filled > 0.66) return 3;
  if (filled > 0.33) return 2;
  if (filled > 0.02) return 1;
  return 0;
}

export function StageMap({
  roster,
  flags,
  explored,
  here,
}: {
  roster: SectorReport[] | null;
  flags?: { mawDead: boolean };
  explored?: Partial<Record<RegionId, number[]>>;
  here?: string;
}) {
  const rows = roster ?? [];
  const byId = new Map(rows.map((row) => [row.id, row]));
  const locked = (id: string) => {
    const row = byId.get(id);
    if (!row || row.state === "sealed") return true;
    if (!flags?.mawDead && (id === "city" || id === "works" || id === "reef")) return true;
    return false;
  };
  return (
    <div>
      <p className="text-[10px] tracking-[0.18em] text-biolume uppercase">Shared ocean</p>
      <p className="mt-1 text-sm text-mist">Each platform is its own sector. You only share a fight with the divers on yours.</p>
      <div className="relative mt-3 h-80">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {LINKS.map(([a, b]) => {
            const from = SPOT[a];
            const to = SPOT[b];
            if (!from || !to) return null;
            const shut = (a === "plains" && b === "city" && !flags?.mawDead) || locked(b);
            return (
              <line
                key={`${a}-${b}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={shut ? "#e7a04a" : "#3ee0c5"}
                strokeWidth="0.6"
                strokeDasharray={shut ? "1.4 1.2" : undefined}
                opacity="0.7"
              />
            );
          })}
        </svg>
        {Object.entries(SPOT).map(([id, spot]) => {
          const row = byId.get(id);
          const shut = locked(id);
          const earned = stars(explored?.[id as RegionId]);
          const names = row?.divers.map((d) => d.name).join(" · ") ?? "";
          const boss = row?.boss;
          const showBoss = boss && boss.alive && (row?.divers.length ?? 0) > 0;
          return (
            <div
              key={id}
              className="absolute w-24"
              style={{ left: `${spot.x}%`, top: `${spot.y}%`, transform: "translate(-50%, -50%)" }}
            >
              <div className={`relative ${here === id ? "outline outline-1 outline-biolume" : ""}`}>
                {spot.n ? (
                  <span className="absolute -top-3 -left-2 grid size-6 place-items-center rounded-full bg-amber text-xs font-medium text-deep">
                    {spot.n}
                  </span>
                ) : null}
                {shut ? (
                  <span className="absolute -top-3 -right-1 grid size-6 place-items-center rounded-full bg-rust text-foam">
                    <Lock className="size-3" />
                  </span>
                ) : null}
                <div
                  className={`h-9 border border-line ${shut ? "bg-hull" : row?.state === "live" ? "bg-biolume/25" : "bg-ink"}`}
                  style={{ clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)" }}
                />
                <p className="text-center text-[10px] tracking-wide text-foam uppercase">{SHORT[id] ?? id}</p>
                <p className="text-center text-[10px] text-amber" aria-label={`${earned} of 3 stars`}>
                  {"★".repeat(earned)}
                  <span className="text-mist">{"★".repeat(3 - earned)}</span>
                </p>
                {names ? <p className="truncate text-center text-[10px] text-biolume">{names}</p> : null}
                {showBoss ? (
                  <div className="mt-0.5 h-1 bg-deep">
                    <div className="h-full bg-amber" style={{ width: `${Math.max(0, (boss.hp / boss.hpMax) * 100)}%` }} />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
