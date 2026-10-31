export type LogEntry = { title: string; body: string };

export const LOGS: Record<string, LogEntry> = {
  "breach-blackbox": {
    title: "Aurelian Grid — black box fragment",
    body: "The grid was not a city power plant. It was a pressure heart, pumping heat out of the shelf so the districts above could stay dry inside their glass. The last stable reading is a spike, then a word the logger did not finish: vent.",
  },
  "breach-order": {
    title: "Unsent evacuation",
    body: "All nonessential crews to the collar locks. Do not wait for the tram. If the heart vents, the shelf will fold and the city will drink the dark. This message was still in the outbox.",
  },
  "breach-bio": {
    title: "Specimen note, unsigned",
    body: "The ribbon eels left the reef lights three days before the blast. They gathered on the warm pipes. Whatever we woke down there, it already knew the shape of our hulls.",
  },
  "plains-city": {
    title: "Shelf census, page torn",
    body: "Four districts. One school. A market that sold oranges grown under lamps. The census clerk's handwriting gets larger near the bottom, as if the pen was moving while the room was not.",
  },
  "plains-maw": {
    title: "Field card — lantern fauna",
    body: "They show the lure before they commit. The mouth is the soft part, and only when it is already open. Do not chase the light. Make the light chase you, then punish the pause.",
  },
  "plains-surface": {
    title: "Collar probe, still ticking",
    body: "A weather syllable keeps arriving from above the collar: wind, then rain, then wind again. The Maw's door is only a shelf door. The city is still standing past it. The true collar is higher, and this probe cannot open it.",
  },
  "city-tram": {
    title: "Tram log, district two",
    body: "The last car left the school stop empty. Someone had already opened the windows. The glass did not break. The street did. People who stayed inside the towers lasted longer than the people who swam.",
  },
  "city-barrow": {
    title: "Salvage chit — Barrow",
    body: "Three seats. Helm, tube, pumps. The skin will brace if the engineer spends a cell of charge. She was built to cross the furnaces, not to race the plains. Do not take her into the spore fields with the pumps empty.",
  },
  "works-vent": {
    title: "Furnace order, overwritten",
    body: "The heart was not only pumping heat out. A second line ran down, under the trench, and the order to shut it was written over twice. The sentries are still obeying the first version.",
  },
  "reef-spore": {
    title: "Reef watch",
    body: "The lamp anemones root where the warm pipes used to bleed. They flare, then they bruise anything inside the circle. Unfiltered air goes thin in the gold dust. A sealed hull does not.",
  },
  "reef-collar": {
    title: "Upper lock, refused",
    body: "The reef can see a paler dark. The lock that would finish the climb does not answer this frequency, this hull, or this year. Trench, upper ocean, and the surface stay shut.",
  },
};

export const BESTIARY: Record<string, { name: string; note: string }> = {
  darter: {
    name: "Glass darter",
    note: "Harmless. They only panic, and their panic is useful — it means something larger just arrived.",
  },
  eel: {
    name: "Pipe eel",
    note: "Territorial. The body coils, the lure steadies, then it commits. Shoot the pause, not the blur.",
  },
  hunter: {
    name: "Ridge hunter",
    note: "It prefers metal to meat. A hull is a louder meal than a swimmer.",
  },
  maw: {
    name: "The Lantern Maw",
    note: "Shared quarry. The flare is the warning. The open mouth is the only honest place to hurt it.",
  },
  sentry: {
    name: "Furnace sentry",
    note: "It aims before it fires. The bolt is slow. The warning line is the honest part.",
  },
  bloom: {
    name: "Lamp anemone",
    note: "It roots. The fronds flare, then the water in reach turns mean. Leave the circle.",
  },
};
