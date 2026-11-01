import type { Diver, RegionId, Sim } from "./types.ts";

/** What the expedition has earned. Highest step wins. Nothing here locks a door. */
export const UNDERSTANDING = [
  {
    id: "catastrophe",
    title: "The blackout",
    known:
      "You woke under a dead grid. The air is already leaving, and the water has not explained itself.",
    next: "Search the wreck. Take what still holds air.",
  },
  {
    id: "salvage",
    title: "What the wreck kept",
    known: "The plant still has air, tools, and cells. Staying alive is a search, not a lesson.",
    next: "A glowing desk kept a recording. The blackout may not have been only an accident.",
  },
  {
    id: "discovery",
    title: "Not only an accident",
    known:
      "A breach recording says the grid was a pressure heart, and something below already knew the hulls.",
    next: "A motor is wedged in the upper gallery. Its range and your air are the same decision.",
  },
  {
    id: "vehicle",
    title: "Farther than the loft",
    known: "The scooter makes the wreck smaller. It also spends itself. Farther is not safer.",
    next: "The east lock drops into the plains. Something large already lives in that dark.",
  },
  {
    id: "encounter",
    title: "The lantern",
    known:
      "A creature holds the plains. The lure is a warning. You can watch it, draw it, or share the open mouth.",
    next: "If the lantern goes dark, the shelf door opens. That is the expedition.",
  },
  {
    id: "return",
    title: "The shelf door",
    known:
      "The Maw is down. The route into the drowned city is open. Air, a recording, or another diver is the outcome.",
    next: "The city, the works, and the reef are past this door. The surface is still shut.",
  },
] as const;

export type UnderstandingId = (typeof UNDERSTANDING)[number]["id"];

const BREACH_LOGS = ["breach-blackbox", "breach-order", "breach-bio"];
const PAST_BREACH: RegionId[] = ["plains", "city", "works", "reef"];

function breachAirTaken(sim: Sim) {
  return sim.pickups.some((pickup) => pickup.region === "breach" && pickup.kind === "o2" && pickup.taken);
}

/** The shared encounter is earned by arriving, not only by standing there now. */
function reachedPlains(sim: Sim, diver: Diver | undefined) {
  if (diver && diver.region !== "breach") return true;
  if (sim.flags.kiteSeen) return true;
  if (sim.discovered.some((id) => id === "beast:maw" || id.startsWith("plains-"))) return true;
  return PAST_BREACH.some((id) => sim.explored[id]?.some(Boolean));
}

export function understanding(sim: Sim, diver: Diver | undefined) {
  let index = 0;
  if (breachAirTaken(sim)) index = 1;
  if (BREACH_LOGS.some((id) => sim.discovered.includes(id))) index = 2;
  if (sim.flags.scooterSeen) index = 3;
  if (!sim.flags.mawDead && reachedPlains(sim, diver)) index = Math.max(index, 4);
  if (sim.flags.mawDead) index = 5;
  const step = UNDERSTANDING[index];
  return { id: step.id, index, title: step.title, known: step.known, next: step.next };
}
