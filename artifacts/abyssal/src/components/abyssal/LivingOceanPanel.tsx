import { ECOLOGY_EVENTS, ecologySummary, type RegionEcology } from "@/game/ecology";

export function LivingOceanPanel({ memory, place }: { memory: RegionEcology; place: string }) {
  return (
    <section className="mt-5 border border-biolume/25 bg-deep/60 p-4" aria-label="Living ocean">
      <p className="text-[10px] tracking-[0.2em] text-biolume uppercase">Living ocean · {place}</p>
      <h3 className="font-display mt-2 text-2xl">The ocean remembers</h3>
      <p className="mt-2 text-sm text-foam">{ecologySummary(memory)}</p>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <div><dt className="text-mist">District grid</dt><dd className="mt-1">{memory.powered ? "Restored" : "Offline"}</dd></div>
        <div><dt className="text-mist">Noise</dt><dd className="mt-1">{Math.round(memory.noise)} / 100</dd></div>
        <div><dt className="text-mist">Conduit growth</dt><dd className="mt-1">{Math.round(memory.bloom * 100)}%</dd></div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-mist">
        On foot, bring one energy cell to a repair station and press E to restore the district grid.
        Warm machinery attracts ribbon eels. Engines and weapons scatter small life and attract predators.
        Slow down and let the disturbance fade before approaching a creature.
      </p>
      <h4 className="mt-4 text-xs tracking-[0.14em] text-amber uppercase">Regional memory</h4>
      {memory.events.length ? (
        <ol className="mt-2 space-y-3">
          {memory.events.map((event) => (
            <li key={event.kind} className="text-sm leading-relaxed text-mist">
              <span className="mr-2 text-xs text-biolume">
                Sector {Math.floor(event.at / 60)}:{String(Math.floor(event.at % 60)).padStart(2, "0")}
              </span>
              {ECOLOGY_EVENTS[event.kind]}
            </li>
          ))}
        </ol>
      ) : <p className="mt-2 text-sm text-mist">No lasting changes recorded here yet. Your crew can change that.</p>}
      <p className="mt-4 text-xs text-mist">
        Regional changes are shared with other divers. Empty sectors sleep; their recorded changes remain.
        Historical records in your archive still distinguish your own discoveries from the crew's.
      </p>
    </section>
  );
}
