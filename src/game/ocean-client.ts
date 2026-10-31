import { applyOceanView, glideOcean, type OceanIntent, type OceanSnap, type SectorReport } from "./ocean.ts";
import type { Sim } from "./types.ts";

export const DIVER_TOKEN = "abyssal-diver-v1";

type Reply = {
  ok?: boolean;
  error?: string;
  token?: string;
  snap?: OceanSnap;
  roster?: SectorReport[];
};

async function post(body: unknown): Promise<Reply> {
  const response = await fetch("/api/ocean", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as Reply;
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "The sea did not answer.");
  }
  return data;
}

export class OceanClient {
  token = "";
  status: "linking" | "live" | "failed" = "linking";
  roster: SectorReport[] = [];
  intent: OceanIntent = { ax: 0, ay: 0, aimX: 1, aimY: 0, fire: false, use: false, repair: false, cycle: false };
  onRoster: ((roster: SectorReport[]) => void) | null = null;
  private sim: Sim | null = null;
  private timer = 0;
  private sending = false;
  private queued = false;
  private heard: string[] = [];
  private callsign = "Unmarked";
  private misses = 0;

  async join(sim: Sim, callsign: string) {
    this.sim = sim;
    this.callsign = callsign || "Unmarked";
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem(DIVER_TOKEN) : null;
    const data = await post({ action: "join", token: saved, callsign });
    if (!data.token || !data.snap) throw new Error("The sea did not answer.");
    this.token = data.token;
    localStorage.setItem(DIVER_TOKEN, data.token);
    this.ingest(sim, data.snap);
    this.status = "live";
    this.timer = window.setInterval(() => void this.flush(), 100);
    return data.token;
  }

  drainEvents() {
    const events = this.heard.splice(0, this.heard.length);
    return events;
  }

  async flush() {
    if (!this.sim || !this.token) return;
    if (this.sending) {
      this.queued = true;
      return;
    }
    this.sending = true;
    this.queued = false;
    const input = { ...this.intent };
    this.intent.use = false;
    this.intent.repair = false;
    this.intent.cycle = false;
    try {
      const data = await post({ action: "sync", token: this.token, input });
      if (!this.sim || !data.snap) return;
      this.ingest(this.sim, data.snap);
      this.status = "live";
      this.misses = 0;
    } catch {
      this.misses += 1;
      this.status = "failed";
      if (this.misses === 3 || this.misses % 5 === 0) await this.recover();
    } finally {
      this.sending = false;
      if (this.queued && this.sim) {
        this.queued = false;
        void this.flush();
      }
    }
  }

  close() {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = 0;
    this.sim = null;
  }

  private async recover() {
    if (!this.sim || !this.token) return;
    try {
      const data = await post({ action: "join", token: this.token, callsign: this.callsign });
      if (!this.sim || !data.token || !data.snap) return;
      this.token = data.token;
      localStorage.setItem(DIVER_TOKEN, data.token);
      this.ingest(this.sim, data.snap);
      this.status = "live";
      this.misses = 0;
    } catch {
      this.status = "failed";
    }
  }

  private ingest(sim: Sim, snap: OceanSnap) {
    applyOceanView(sim, this.token, snap);
    this.roster = snap.roster;
    this.heard.push(...snap.events);
    if (this.heard.length > 24) this.heard.splice(0, this.heard.length - 24);
    this.onRoster?.(snap.roster);
  }
}

export { glideOcean };
