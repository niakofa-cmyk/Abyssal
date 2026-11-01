import { LOGS } from "./content.ts";

/** What a station is for. The water already holds these desks. */
export type StationKind =
  | "history"
  | "emergency"
  | "research"
  | "engineering"
  | "personal"
  | "classified";

export const KIND_LABEL: Record<StationKind, string> = {
  history: "History",
  emergency: "Emergency",
  research: "Research",
  engineering: "Engineering",
  personal: "Personal",
  classified: "Classified",
};

export const STATIONS: Record<string, { kind: StationKind; place: string; missing: string }> = {
  "breach-blackbox": {
    kind: "research",
    place: "Breach",
    missing: "the black box in the breach",
  },
  "breach-order": {
    kind: "emergency",
    place: "Breach",
    missing: "the unsent evacuation",
  },
  "breach-sonar": {
    kind: "research",
    place: "Breach",
    missing: "the unnamed sonar return",
  },
  "breach-shadow": {
    kind: "research",
    place: "Breach",
    missing: "the two watches",
  },
  "breach-bio": {
    kind: "research",
    place: "Breach",
    missing: "the unsigned specimen note",
  },
  "breach-loft": {
    kind: "personal",
    place: "Breach loft",
    missing: "the name written in the loft",
  },
  "plains-city": {
    kind: "history",
    place: "Plains",
    missing: "the torn shelf census",
  },
  "plains-maw": {
    kind: "research",
    place: "Plains",
    missing: "the lantern field card",
  },
  "plains-surface": {
    kind: "engineering",
    place: "Plains",
    missing: "the collar probe",
  },
  "city-tram": {
    kind: "history",
    place: "City",
    missing: "the tram log in the city",
  },
  "city-barrow": {
    kind: "engineering",
    place: "City",
    missing: "the Barrow salvage chit",
  },
  "works-vent": {
    kind: "classified",
    place: "Works",
    missing: "the overwritten furnace order",
  },
  "reef-spore": {
    kind: "research",
    place: "Reef",
    missing: "the reef watch",
  },
  "reef-collar": {
    kind: "engineering",
    place: "Reef",
    missing: "the refused upper lock",
  },
};

/** A beat lights when any of its records are known to the expedition. The first beat is the waking. */
export const TIMELINE = [
  {
    id: "woke",
    label: "You woke under a dead grid. Nobody has told you why.",
    needs: [] as string[],
  },
  {
    id: "sign",
    label: "Something larger than a hull crossed the east lock before the spike. The watch crossed out the word lantern.",
    needs: ["breach-sonar"],
  },
  {
    id: "lived",
    label: "People lived on the shelf. A name, a school, oranges under lamps.",
    needs: ["breach-loft", "plains-city", "city-tram"],
  },
  {
    id: "evac",
    label: "The evacuation did not finish. One order was still in the outbox.",
    needs: ["breach-order", "city-tram"],
  },
  {
    id: "heart",
    label: "The grid was a pressure heart. The last word it started was vent.",
    needs: ["breach-blackbox"],
  },
  {
    id: "life",
    label: "The life moved toward the heat before the blast.",
    needs: ["breach-bio", "plains-maw", "reef-spore"],
  },
  {
    id: "rewrite",
    label: "A second line runs under the trench. The order to shut it was written over.",
    needs: ["works-vent"],
  },
  {
    id: "collar",
    label: "The Maw's door is only a shelf door. The true collar is still shut.",
    needs: ["plains-surface", "reef-collar"],
  },
] as const;

/** What the expedition knows about the lantern. The last stage stays dark on purpose. */
export const MAW_STAGES = [
  {
    id: "signs",
    label: "It was already crossing the east lock before the heart failed. The watches do not agree what it was.",
    needs: ["breach-sonar", "breach-shadow"],
  },
  {
    id: "known",
    label: "The watch had a field card. They knew the lure, and they knew not to chase it.",
    needs: ["plains-maw"],
  },
  {
    id: "heat",
    label: "The eels left the lights first. The lantern followed the heat the pipes were bleeding.",
    needs: ["breach-bio", "reef-spore"],
  },
  {
    id: "mouth",
    label: "You have seen it. The open mouth is the only honest place to hurt it. It can be watched, drawn, or shared.",
    needs: ["beast:maw"],
  },
  {
    id: "why",
    label: "Why it holds the shelf is not in any record you have.",
    needs: ["maw-why"],
  },
] as const;

export function mawStages(known: readonly string[]) {
  const have = new Set(known);
  return MAW_STAGES.map((stage) => ({
    id: stage.id,
    label: stage.label,
    known: stage.needs.some((id) => have.has(id)),
  }));
}

export const CASES = [
  {
    id: "heart",
    title: "The pressure heart",
    question: "Was the blackout only a failed plant?",
    pieces: ["breach-blackbox", "breach-order", "works-vent"],
    reconstruction:
      "The logger heard a spike, then the start of the word vent. The evacuation was still in the outbox: if the heart vents, the shelf folds. In the works, a second line runs under the trench, and the order to shut it was written over twice. The blast was the last event, not the first failure.",
    seal: "The records agree. The heart was already failing.",
  },
  {
    id: "shelf",
    title: "The city that drank",
    question: "Was the shelf only a ruin?",
    pieces: ["plains-city", "city-tram", "breach-order"],
    reconstruction:
      "Four districts, one school, a market that sold oranges grown under lamps. The last tram left the school empty. People who stayed inside lasted longer than the people who swam. The order to run was never sent.",
    seal: "The records agree. The shelf was a city, and it was not emptied.",
  },
  {
    id: "warmth",
    title: "What followed the heat",
    question: "Is the lantern only a monster in the dark?",
    pieces: ["breach-bio", "plains-maw", "reef-spore"],
    reconstruction:
      "The ribbon eels left the reef lights three days before the blast and gathered on the warm pipes. The anemones rooted where those pipes bled. The lantern shows its lure before it commits. It followed the heat. It is not a random mouth.",
    seal: "The records agree. The lantern followed the heat.",
  },
] as const;

export function casesClosedBy(before: readonly string[], id: string) {
  if (before.includes(id)) return [];
  const now = new Set(before);
  now.add(id);
  return CASES.filter(
    (item) => item.pieces.every((piece) => now.has(piece)) && item.pieces.some((piece) => !before.includes(piece)),
  ).map((item) => item.seal);
}

export function archiveOf(personal: readonly string[], shared: readonly string[] = []) {
  const expedition = new Set(shared.length ? shared : personal);
  for (const id of personal) expedition.add(id);
  const read = new Set(personal);
  const timeline = TIMELINE.map((beat) => ({
    id: beat.id,
    label: beat.label,
    known: beat.needs.length === 0 || beat.needs.some((id) => expedition.has(id)),
  }));
  const cases = CASES.map((item) => {
    const have = item.pieces.filter((id) => expedition.has(id));
    return {
      id: item.id,
      title: item.title,
      question: item.question,
      reconstruction: item.reconstruction,
      have: have.length,
      total: item.pieces.length,
      missing: item.pieces.filter((id) => !expedition.has(id)).map((id) => STATIONS[id]?.missing ?? id),
      closed: have.length === item.pieces.length,
    };
  });
  const stations = Object.entries(STATIONS)
    .filter(([id]) => expedition.has(id))
    .map(([id, station]) => ({
      id,
      kind: station.kind,
      place: station.place,
      title: LOGS[id]?.title ?? id,
      body: read.has(id) ? (LOGS[id]?.body ?? "") : "",
      read: read.has(id),
    }));
  return {
    timeline,
    cases,
    stations,
    closed: cases.filter((item) => item.closed).length,
  };
}
