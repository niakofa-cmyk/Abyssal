import { P2PRoom, type PeerInfo } from "@/lib/multiplayer";

export type LinkStatus = "offline" | "linking" | "live" | "failed";

export class DescentLink {
  peers: PeerInfo[] = [];
  status: LinkStatus = "offline";
  hostId: string;
  locked = false;
  readonly clocks = new Map<string, number>();
  private room: P2PRoom | null = null;
  private electTimer: ReturnType<typeof setTimeout> | null = null;
  private fullAt = new Map<string, number>();
  onPacket: (from: string, data: unknown) => void = () => {};
  onHost = () => {};
  getTime = () => 0;

  constructor(readonly selfId: string) {
    this.hostId = selfId;
  }

  get auth() {
    return this.hostId === this.selfId;
  }

  async start(room: string, name: string) {
    this.close();
    this.status = "linking";
    this.locked = false;
    this.hostId = this.selfId;
    const client = new P2PRoom({
      room,
      selfId: this.selfId,
      name,
      onConnected: () => {
        this.status = "live";
      },
      onPeersChanged: (peers) => {
        const gone = this.hostId !== this.selfId && !peers.some((p) => p.id === this.hostId);
        this.peers = peers;
        if (gone) this.locked = false;
        this.send({ k: "clock", t: this.getTime() });
        if (peers.length === 0) {
          this.hostId = this.selfId;
          this.locked = true;
          return;
        }
        if (this.auth) this.onHost();
        this.scheduleElect();
      },
      onMessage: (from, data) => {
        if (data && typeof data === "object" && (data as { k?: string }).k === "clock") {
          const t = (data as { t?: number }).t;
          if (typeof t === "number") this.clocks.set(from, t);
        }
        this.onPacket(from, data);
      },
    });
    this.room = client;
    try {
      await client.join();
      this.status = "live";
    } catch {
      this.status = "failed";
    }
  }

  private scheduleElect() {
    if (this.electTimer) clearTimeout(this.electTimer);
    this.electTimer = setTimeout(() => this.elect(), 450);
  }

  private elect() {
    const connected = this.peers.filter((p) => p.connectionState === "connected").map((p) => p.id);
    if (connected.length === 0) {
      this.hostId = this.selfId;
      this.locked = true;
      return;
    }
    if (connected.some((id) => !this.clocks.has(id))) {
      this.scheduleElect();
      return;
    }
    let best = this.selfId;
    let bestTime = this.getTime();
    for (const id of connected) {
      const t = this.clocks.get(id) ?? 0;
      if (t > bestTime + 0.35 || (Math.abs(t - bestTime) <= 0.35 && id < best)) {
        best = id;
        bestTime = t;
      }
    }
    this.hostId = best;
    this.locked = true;
    if (this.auth) this.onHost();
  }

  offerFull(to: string) {
    const now = Date.now();
    if (now - (this.fullAt.get(to) ?? 0) < 1500) return;
    this.fullAt.set(to, now);
    this.onHost();
    this.send({ k: "need-full", to }, to);
  }

  send(data: unknown, to?: string) {
    this.room?.send(data, to);
  }

  broadcast(data: unknown) {
    this.room?.broadcast(data);
  }

  close() {
    if (this.electTimer) clearTimeout(this.electTimer);
    this.room?.close();
    this.room = null;
    this.peers = [];
    this.status = "offline";
  }
}
