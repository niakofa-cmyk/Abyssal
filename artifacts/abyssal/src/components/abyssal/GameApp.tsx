import { useEffect, useRef, useState } from "react";
import { Anchor, ArrowLeft, BookOpen, Map, Radio, Volume2, VolumeX } from "lucide-react";
import { StageMap } from "@/components/abyssal/StageMap";
import { BESTIARY } from "@/game/content";
import { archiveOf, KIND_LABEL, mawStages } from "@/game/archive";
import { DescentLink } from "@/game/link";
import { SeaAudio } from "@/game/audio";
import { DIVER_TOKEN, OceanClient, glideOcean } from "@/game/ocean-client";
import type { SectorReport } from "@/game/ocean";
import {
  applySave,
  clearSave,
  hasSave,
  loadProfile,
  loadSave,
  saveProfile,
  writeSave,
  type Profile,
} from "@/game/persist";
import { drawSea, loadArt, type Art, type Bubble } from "@/game/render";
import {
  applyGrant,
  applyOwn,
  cycleSeat,
  createSim,
  exportWorld,
  findDiver,
  findVehicle,
  hurtDiver,
  importWorld,
  note,
  objective,
  pressRepair,
  pressUse,
  stepSim,
  velocityOf,
  hullStage,
} from "@/game/sim";
import { VIEW_H, VIEW_W, ZONES, TILE, type Diver, type RegionId, type Sim } from "@/game/types";
import { Opening } from "@/components/abyssal/Opening";
import { SurfaceVision } from "@/components/abyssal/SurfaceVision";
import { understanding, UNDERSTANDING } from "@/game/understanding";
import { drawPassage } from "@/game/opening";

type Overlay = "none" | "map" | "journal" | "pause" | "dead";

type Session = {
  sim: Sim;
  selfId: string;
  keys: Set<string>;
  probe: Set<string>;
  prev: Set<string>;
  link: DescentLink;
  audio: SeaAudio;
  art: Art;
  overlay: Overlay;
  touch: { ax: number; ay: number; fire: boolean; use: boolean };
  aimStick: { x: number; y: number };
  pointer: { wx: number; wy: number; on: boolean };
  bubbles: Bubble[];
  camX: number;
  camY: number;
  saveAcc: number;
  netAcc: number;
  hudAcc: number;
  mode: "menu" | "play";
  reduced: boolean;
  ocean: OceanClient | null;
  seenRegion: RegionId | "";
  /** Seconds of the unnamed shape crossing the breach after a fresh warning. */
  passage: number;
  visionSeen: Set<string> | null;
  /** Scripted steer for the ocean probe. Keys always win when the diver is actually holding them. */
  hold: { ax: number; ay: number; fire: boolean; aimX: number; aimY: number } | null;
};

const BLANK_PROFILE: Profile = {
  callsign: "",
  room: "abyss",
  partner: false,
  soren: false,
  muted: false,
  linkMode: "ocean",
};

type Hud = {
  name: string;
  hp: number;
  o2: number;
  ammo: number;
  cells: number;
  region: string;
  depth: string;
  objective: string;
  understanding: string;
  seat: string;
  hull: number;
  energy: number;
  stage: number;
  toasts: string[];
  link: string;
  peers: number;
  boss: number;
  bossMax: number;
  bossState: string;
  dead: boolean;
  hypoxia: boolean;
  soren: string;
};

function makeId() {
  const bytes = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `d${bytes}`;
}

function cleanRoom(value: string) {
  const room = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  return room || "abyss";
}

function held(session: Session, code: string) {
  return session.keys.has(code) || session.probe.has(code);
}

function edge(session: Session, code: string) {
  const down = held(session, code);
  const was = session.prev.has(code);
  if (down) session.prev.add(code);
  else session.prev.delete(code);
  return down && !was;
}

function axes(session: Session, left: string, right: string, up: string, down: string) {
  let ax = 0;
  let ay = 0;
  if (held(session, left)) ax -= 1;
  if (held(session, right)) ax += 1;
  if (held(session, up)) ay -= 1;
  if (held(session, down)) ay += 1;
  const mag = Math.hypot(ax, ay);
  if (mag > 1) {
    ax /= mag;
    ay /= mag;
  }
  return { ax, ay };
}

function installProbe(session: Session) {
  window.__controlsTest = {
    getYaw: () => {
      const v = velocityOf(session.sim, session.selfId);
      return Math.atan2(-v.vy, v.vx);
    },
    getSpeed: () => {
      const v = velocityOf(session.sim, session.selfId);
      return Math.hypot(v.vx, v.vy);
    },
    setKeys: (codes: string[]) => {
      session.probe.clear();
      for (const code of codes) session.probe.add(code);
    },
    setSteer: (v: number) => {
      const you = findDiver(session.sim, session.selfId);
      if (you) you.ax = -v;
    },
  };
  window.__abyssal = {
    nearby: () => {
      const youNow = findDiver(session.sim, session.selfId);
      if (!youNow) return [];
      return session.sim.divers
        .filter((diver) => diver.alive && diver.id !== session.selfId && diver.region === youNow.region)
        .map((diver) => diver.name);
    },
    warp: (x: number, y: number, region?: RegionId) => {
      const diver = findDiver(session.sim, session.selfId);
      if (!diver) return;
      const vehicle = findVehicle(session.sim, diver.vehicleId);
      if (region && session.sim.regions[region]) {
        diver.region = region;
        if (vehicle && vehicle.seats.pilot === diver.id) vehicle.region = region;
      }
      if (vehicle && vehicle.seats.pilot === diver.id) {
        vehicle.x = x;
        vehicle.y = y;
        vehicle.vx = 0;
        vehicle.vy = 0;
      }
      diver.x = x;
      diver.y = y;
      diver.vx = 0;
      diver.vy = 0;
    },
    you: () => {
      const diver = findDiver(session.sim, session.selfId);
      if (!diver) return null;
      return {
        x: Math.round(diver.x),
        y: Math.round(diver.y),
        seat: diver.seat,
        region: diver.region,
        hp: Math.round(diver.hp),
        o2: Math.round(diver.o2),
        vehicle: diver.vehicleId,
        aimX: Math.round(diver.aimX),
        aimY: Math.round(diver.aimY),
        sx: Math.round(diver.netX),
        sy: Math.round(diver.netY),
      };
    },
    world: () => {
      const diver = findDiver(session.sim, session.selfId);
      const explored = (Object.values(session.sim.explored) as number[][]).reduce(
        (sum, row) => sum + row.reduce((n, cell) => n + (cell ? 1 : 0), 0),
        0,
      );
      return {
        explored,
        seen: [...session.sim.discovered],
        others: session.sim.divers
          .filter((other) => other.alive && other.id !== session.selfId)
          .map((other) => ({
            name: other.name,
            x: Math.round(other.x),
            y: Math.round(other.y),
            hp: Math.round(other.hp),
            o2: Math.round(other.o2),
            region: other.region,
            seat: other.seat,
            vehicle: other.vehicleId,
          })),
        creatures: session.sim.creatures
          .filter((creature) => creature.alive && (!diver || creature.region === diver.region))
          .map((creature) => ({
            id: creature.id,
            kind: creature.kind,
            hp: Math.round(creature.hp),
            x: Math.round(creature.x),
            y: Math.round(creature.y),
          })),
        roster: (session.ocean?.roster ?? [])
          .filter((row) => row.state === "live")
          .map((row) => ({ id: row.id, divers: row.divers.map((entry) => entry.name) })),
      };
    },
    drive: (ax: number, ay: number, fire: boolean, aimX?: number, aimY?: number) => {
      if (!session.ocean) return;
      const aimYaw = aimX ?? (ax === 0 ? 1 : ax);
      const aimPitch = aimY ?? ay;
      session.hold = { ax, ay, fire, aimX: aimYaw, aimY: aimPitch };
      session.ocean.intent.ax = ax;
      session.ocean.intent.ay = ay;
      session.ocean.intent.aimX = aimYaw;
      session.ocean.intent.aimY = aimPitch;
      session.ocean.intent.fire = fire;
      void session.ocean.flush();
    },
    tap: (kind: "use" | "repair" | "cycle") => {
      if (!session.ocean) return;
      if (kind === "use") session.ocean.intent.use = true;
      if (kind === "repair") session.ocean.intent.repair = true;
      if (kind === "cycle") session.ocean.intent.cycle = true;
      void session.ocean.flush();
    },
  };
}

function applyInput(session: Session) {
  const you = findDiver(session.sim, session.selfId);
  if (!you) return;
  if (edge(session, "Escape")) session.overlay = session.overlay === "none" ? "pause" : "none";
  if (edge(session, "KeyM")) session.overlay = session.overlay === "map" ? "none" : "map";
  if (edge(session, "KeyJ")) session.overlay = session.overlay === "journal" ? "none" : "journal";
  if (session.overlay === "pause" || session.overlay === "map" || session.overlay === "journal") {
    if (session.ocean) {
      session.ocean.intent.ax = 0;
      session.ocean.intent.ay = 0;
      session.ocean.intent.fire = false;
    }
    return;
  }

  const partner = session.sim.divers.find((d) => d.kind === "partner" && d.owner === session.selfId);
  const move = axes(session, "KeyA", "KeyD", "KeyW", "KeyS");
  if (session.touch.ax || session.touch.ay) {
    you.ax = session.touch.ax;
    you.ay = session.touch.ay;
  } else if (!partner) {
    const arrows = axes(session, "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown");
    you.ax = move.ax || arrows.ax;
    you.ay = move.ay || arrows.ay;
  } else {
    you.ax = move.ax;
    you.ay = move.ay;
    const arrows = axes(session, "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown");
    partner.ax = arrows.ax;
    partner.ay = arrows.ay;
    partner.fireLatch = held(session, "KeyL");
    partner.aimX = partner.facing;
    partner.aimY = partner.ay * 0.35;
  }
  you.fireLatch = held(session, "Space") || held(session, "KeyF") || session.touch.fire;
  const origin = aimOrigin(session, you);
  const stickMag = Math.hypot(session.aimStick.x, session.aimStick.y);
  if (stickMag > 0.2) {
    you.aimX = session.aimStick.x;
    you.aimY = session.aimStick.y;
  } else if (session.pointer.on) {
    you.aimX = session.pointer.wx - origin.x;
    you.aimY = session.pointer.wy - origin.y;
    if (Math.hypot(you.aimX, you.aimY) < 8) {
      you.aimX = you.facing;
      you.aimY = you.ay * 0.35;
    }
  } else {
    you.aimX = you.facing;
    you.aimY = you.ay * 0.35;
  }

  const useYou = edge(session, "KeyE") || session.touch.use;
  session.touch.use = false;
  if (useYou) {
    if (session.ocean) session.ocean.intent.use = true;
    else if (session.link.auth) pressUse(session.sim, you);
    else session.link.send({ k: "act", id: you.id, kind: "use" });
  }
  if (edge(session, "KeyR")) {
    if (session.ocean) session.ocean.intent.repair = true;
    else if (session.link.auth) pressRepair(session.sim, you);
    else session.link.send({ k: "act", id: you.id, kind: "repair" });
  }
  if (partner && edge(session, "KeyO")) {
    if (session.link.auth) pressUse(session.sim, partner);
  }
  if (edge(session, "KeyV")) {
    const ai = session.sim.divers.find((d) => d.kind === "ai" && d.owner === session.selfId);
    if (ai) {
      ai.order = ai.order === "follow" ? "hold" : "follow";
      ai.holdX = ai.x;
      ai.holdY = ai.y;
      ai.holdRegion = ai.region;
      note(session.sim, ai.order === "hold" ? "Soren holds this sector." : "Soren follows.");
    }
  }
  if (edge(session, "Tab")) swapSeats(session, you);
  const hands =
    move.ax !== 0 ||
    move.ay !== 0 ||
    session.touch.ax !== 0 ||
    session.touch.ay !== 0 ||
    held(session, "Space") ||
    held(session, "KeyF") ||
    session.touch.fire;
  if (session.hold && !hands) {
    you.ax = session.hold.ax;
    you.ay = session.hold.ay;
    you.fireLatch = session.hold.fire;
    you.aimX = session.hold.aimX;
    you.aimY = session.hold.aimY;
  }
  if (session.ocean) {
    session.ocean.intent.ax = you.ax;
    session.ocean.intent.ay = you.ay;
    session.ocean.intent.aimX = you.aimX;
    session.ocean.intent.aimY = you.aimY;
    session.ocean.intent.fire = you.fireLatch;
  }
}

function aimOrigin(session: Session, diver: Diver) {
  const vehicle = findVehicle(session.sim, diver.vehicleId);
  if (vehicle && !vehicle.destroyed) return { x: vehicle.x, y: vehicle.y };
  return { x: diver.x, y: diver.y };
}

function swapSeats(session: Session, you: Diver) {
  if (session.ocean) {
    session.ocean.intent.cycle = true;
    return;
  }
  if (!session.link.auth || !you.seat) return;
  cycleSeat(session.sim, you);
}

function readHud(session: Session): Hud {
  const you = findDiver(session.sim, session.selfId);
  const region = you ? session.sim.regions[you.region] : session.sim.regions.breach;
  const vehicle = you ? findVehicle(session.sim, you.vehicleId) : undefined;
  const maw =
    you && you.region === "plains" ? session.sim.creatures.find((c) => c.kind === "maw" && c.region === "plains") : undefined;
  const ai = session.sim.divers.find((d) => d.kind === "ai");
  const depth = you ? Math.round(region.depth + (you.y / (region.h * 32)) * 36) : region.depth;
  const grasp = understanding(session.sim, you);
  return {
    name: you?.name ?? "",
    hp: you?.hp ?? 0,
    o2: you?.o2 ?? 0,
    ammo: you?.ammo ?? 0,
    cells: you?.cells ?? 0,
    region: region.name,
    depth: `${depth} m`,
    objective: objective(session.sim, you),
    understanding: grasp.title,
    seat: you?.seat
      ? `${vehicle?.kind === "barrow" ? "Barrow" : vehicle?.kind === "kite" ? "Kite" : "Scooter"} · ${you.seat}`
      : "Swimming",
    hull: vehicle ? vehicle.hull / vehicle.hullMax : 0,
    energy: vehicle ? vehicle.energy / vehicle.energyMax : 0,
    stage: vehicle ? hullStage(vehicle) : 0,
    toasts: session.sim.toasts.map((t) => t.text),
    link: session.ocean
      ? session.ocean.status === "failed"
        ? "Signal lost · the beacon holds your dive"
        : session.ocean.status === "linking"
          ? "Beacon answering"
          : session.sim.divers.some((diver) => diver.alive && diver.id !== session.selfId)
            ? "Shared ocean · another diver is here"
            : "Shared ocean · alone in this sector"
      : session.link.status === "live"
        ? session.link.auth
          ? "Frequency · you hold the depth"
          : "Frequency · sharing their depth"
        : session.link.status === "linking"
          ? "Linking frequency"
          : session.link.status === "failed"
            ? "Frequency offline"
            : "Frequency",
    peers: session.ocean
      ? session.sim.divers.filter((diver) => diver.alive && diver.id !== session.selfId).length
      : session.link.peers.filter((peer) => peer.connectionState === "connected").length,
    boss: maw?.hp ?? 0,
    bossMax: maw?.hpMax ?? 1,
    bossState: maw?.alive ? maw.state : "down",
    dead: !!you && !you.alive,
    hypoxia: !!you && you.o2 <= 0 && you.alive,
    soren: ai ? `${ai.name} · ${ai.order} · ${ai.region === you?.region ? "with you" : ai.region}` : "",
  };
}

function Meter({ label, value, tone }: { label: string; value: number; tone: "bio" | "rust" | "amber" }) {
  const color = tone === "bio" ? "bg-biolume" : tone === "rust" ? "bg-rust" : "bg-amber";
  return (
    <div className="min-w-28">
      <div className="mb-1 flex justify-between text-[10px] tracking-[0.16em] text-mist uppercase">
        <span>{label}</span>
        <span>{Math.max(0, Math.round(value))}%</span>
      </div>
      <div className="h-1.5 bg-deep">
        <div className={`h-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<Session | null>(null);
  const seaRef = useRef<SeaAudio | null>(null);
  const [profile, setProfile] = useState<Profile>(BLANK_PROFILE);
  const [mode, setMode] = useState<"menu" | "opening" | "play">("menu");
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [hud, setHud] = useState<Hud | null>(null);
  const [resumeOk, setResumeOk] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [roster, setRoster] = useState<SectorReport[] | null>(null);
  const [fault, setFault] = useState("");
  const [heldBeacon, setHeldBeacon] = useState(false);
  const diving = useRef(false);
  const warned = useRef(false);
  const visionOn = useRef(false);
  const [vision, setVision] = useState(false);

  function resumeGame() {
    const session = sessionRef.current;
    if (!session) return;
    session.overlay = "none";
    session.keys.clear();
    session.prev.clear();
    session.touch = { ax: 0, ay: 0, fire: false, use: false };
    setOverlay("none");
    canvasRef.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    setProfile(loadProfile());
    setResumeOk(hasSave());
    setHeldBeacon(typeof localStorage !== "undefined" && !!localStorage.getItem(DIVER_TOKEN));
    const onResize = () => setNarrow(window.innerWidth < 860);
    onResize();
    window.addEventListener("resize", onResize);
    const onHide = () => {
      if (document.visibilityState === "visible") sessionRef.current?.audio.unlock();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  useEffect(() => {
    if (mode !== "menu") return;
    let stop = false;
    const pull = async () => {
      try {
        const response = await fetch("/api/ocean", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "roster" }),
        });
        const data = (await response.json()) as { ok?: boolean; roster?: SectorReport[] };
        if (!stop && data.ok && data.roster) setRoster(data.roster);
      } catch {
        /* the console still opens if the sea is quiet */
      }
    };
    void pull();
    const id = window.setInterval(() => void pull(), 2000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [mode]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const session = sessionRef.current;
      if (!session || session.mode !== "play") return;
      if (event.code === "Escape" && event.repeat) return;
      if (event.code === "Escape" && session.overlay !== "none" && session.overlay !== "dead") {
        event.preventDefault();
        resumeGame();
        return;
      }
      // Let panel buttons retain normal Enter, Space, and Tab behavior.
      if (event.target instanceof HTMLElement) {
        if (event.target.closest("input, textarea, select")) return;
        if (event.target.closest("button, a, summary") && ["Enter", "Space", "Tab"].includes(event.code)) return;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Tab"].includes(event.code)) {
        event.preventDefault();
      }
      session.keys.add(event.code);
    };
    const up = (event: KeyboardEvent) => sessionRef.current?.keys.delete(event.code);
    const blur = () => sessionRef.current?.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  useEffect(() => {
    if (mode !== "play") return;
    let raf = 0;
    let last = performance.now();
    let simAcc = 0;
    const frame = (now: number) => {
      const session = sessionRef.current;
      const canvas = canvasRef.current;
      if (!session || !canvas) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const frameDt = Math.min(0.1, (now - last) / 1000);
      last = now;
      session.hudAcc += frameDt;
      session.netAcc += frameDt;
      session.saveAcc += frameDt;
      applyInput(session);
      const paused = session.overlay === "map" || session.overlay === "journal" || session.overlay === "pause";
      if (session.ocean) {
        if (!paused) glideOcean(session.sim, frameDt);
        const heard = session.ocean.drainEvents();
        if (heard.some((event) => event === "hit" || event === "impact" || event === "hull" || event === "torpedo")) {
          session.sim.shake = Math.max(session.sim.shake, 6);
        }
        session.sim.shake = Math.max(0, session.sim.shake - frameDt * 18);
        const combat = session.sim.creatures.some((c) => c.alive && c.region === findDiver(session.sim, session.selfId)?.region && c.state !== "patrol" && c.kind !== "darter");
        session.audio.tick(session.sim.time, combat);
        const youNow = findDiver(session.sim, session.selfId);
        session.audio.react(heard, youNow?.o2 ?? 100, session.sim.time);
        if (youNow?.alive && Math.random() < 0.35) {
          session.bubbles.push({
            x: youNow.x - youNow.facing * 8,
            y: youNow.y,
            r: 2 + Math.random() * 2,
            life: 1,
            vy: -18,
          });
        }
      } else if (!paused) {
        simAcc += frameDt;
        const heard: string[] = [];
        let steps = 0;
        while (simAcc >= 1 / 60 && steps < 8) {
          stepSim(session.sim, 1 / 60, session.link.auth, session.selfId);
          heard.push(...session.sim.events);
          for (const msg of session.sim.outbox) {
            if (msg.k === "hurt") session.link.send(msg);
            if (msg.k === "grant") session.link.send(msg);
          }
          session.sim.outbox = [];
          simAcc -= 1 / 60;
          steps += 1;
        }
        if (simAcc > 0.2) simAcc = 0;
        const combat = session.sim.creatures.some((c) => c.alive && c.state !== "patrol" && c.kind !== "darter");
        session.audio.tick(session.sim.time, combat);
        const youNow = findDiver(session.sim, session.selfId);
        session.audio.react(heard, youNow?.o2 ?? 100, session.sim.time);
        if (youNow?.alive && Math.random() < 0.35) {
          session.bubbles.push({
            x: youNow.x - youNow.facing * 8,
            y: youNow.y,
            r: 2 + Math.random() * 2,
            life: 1,
            vy: -18,
          });
        }
      }
      if (!session.ocean && session.netAcc > 0.09) {
        session.netAcc = 0;
        const owned = session.sim.divers.filter((d) => d.owner === session.selfId);
        session.link.broadcast({
          k: "own",
          divers: owned.map((d) => ({
            id: d.id,
            owner: d.owner,
            name: d.name,
            region: d.region,
            x: d.x,
            y: d.y,
            vx: d.vx,
            vy: d.vy,
            facing: d.facing,
            hp: d.hp,
            o2: d.o2,
            alive: d.alive,
            vehicleId: d.vehicleId,
            seat: d.seat,
            ax: d.ax,
            ay: d.ay,
            aimX: d.aimX,
            aimY: d.aimY,
            fire: d.fireLatch,
            tint: d.tint,
          })),
        });
        if (session.link.auth) session.link.broadcast({ k: "snap", world: exportWorld(session.sim) });
      }
      if (!session.ocean && session.saveAcc > 4) {
        session.saveAcc = 0;
        writeSave(session.sim, session.selfId);
      }
      for (const bubble of session.bubbles) {
        bubble.y += bubble.vy * frameDt;
        bubble.life -= frameDt;
      }
      session.bubbles = session.bubbles.filter((b) => b.life > 0).slice(-80);

      const you = findDiver(session.sim, session.selfId);
      if (you) {
        if (session.ocean && session.seenRegion && session.seenRegion !== you.region) {
          session.camX = you.x - VIEW_W * 0.45;
          session.camY = you.y - VIEW_H * 0.5;
        }
        session.seenRegion = you.region;
        const look = you.facing === 1 ? 0.38 : 0.62;
        const tx = you.x - VIEW_W * look;
        const ty = you.y - VIEW_H * 0.5;
        const region = session.sim.regions[you.region];
        const maxX = Math.max(0, region.w * 32 - VIEW_W);
        const maxY = Math.max(0, region.h * 32 - VIEW_H);
        session.camX += (Math.max(0, Math.min(maxX, tx)) - session.camX) * Math.min(1, frameDt * 5);
        session.camY += (Math.max(0, Math.min(maxY, ty)) - session.camY) * Math.min(1, frameDt * 5);
        if (you.alive && session.overlay === "dead") session.overlay = "none";
        if (!you.alive && session.overlay === "none") session.overlay = "dead";
      }
      const ctx = canvas.getContext("2d");
      if (ctx && you) {
        const shake = session.reduced ? 0 : session.sim.shake;
        ctx.save();
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        drawSea(
          ctx,
          session.sim,
          Math.round(session.camX),
          Math.round(session.camY),
          session.art,
          you.region,
          session.bubbles,
          session.selfId,
        );
        ctx.restore();
        if (you.region === "breach" && session.passage > 0) {
          drawPassage(ctx, 7 - session.passage);
          session.passage = Math.max(0, session.passage - frameDt);
        }
      }
      if (session.visionSeen === null) session.visionSeen = new Set(session.sim.discovered);
      else if (!visionOn.current) {
        for (const id of ["plains-surface", "reef-collar"] as const) {
          if (session.sim.discovered.includes(id) && !session.visionSeen.has(id)) {
            session.visionSeen.add(id);
            visionOn.current = true;
            setVision(true);
            break;
          }
        }
      }
      if (session.hudAcc > 0.12) {
        session.hudAcc = 0;
        setHud(readHud(session));
        setOverlay(session.overlay);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  async function beginOcean() {
    if (diving.current) return;
    diving.current = true;
    setFault("");
    const audio = seaRef.current ?? new SeaAudio();
    seaRef.current = audio;
    audio.unlock();
    audio.setMuted(profile.muted);
    const name = profile.callsign.trim() || "Unmarked";
    const sim = createSim({ selfId: "pending", name, partner: false, soren: false, crew: false });
    const ocean = new OceanClient();
    ocean.onRoster = (rows) => setRoster(rows);
    try {
      const token = await ocean.join(sim, name);
      const session: Session = {
        sim,
        selfId: token,
        keys: new Set(),
        probe: new Set(),
        prev: new Set(),
        link: new DescentLink(token),
        audio,
        art: loadArt(),
        overlay: "none",
        touch: { ax: 0, ay: 0, fire: false, use: false },
        aimStick: { x: 0, y: 0 },
        pointer: { wx: 0, wy: 0, on: false },
        bubbles: [],
        camX: 0,
        camY: 0,
        saveAcc: 0,
        netAcc: 0,
        hudAcc: 0,
        mode: "play",
        reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        ocean,
        seenRegion: "",
        passage: warned.current ? 7 : 0,
        visionSeen: null,
        hold: null,
      };
      const you = findDiver(sim, token);
      if (you) {
        session.camX = you.x - VIEW_W * 0.45;
        session.camY = you.y - VIEW_H * 0.5;
        session.seenRegion = you.region;
      }
      sessionRef.current = session;
      installProbe(session);
      saveProfile({ ...profile, linkMode: "ocean", partner: false, soren: false });
      setHeldBeacon(true);
      setMode("play");
      warned.current = false;
      setOverlay("none");
      setHud(readHud(session));
    } catch (err) {
      ocean.close();
      setFault(err instanceof Error ? err.message : "The sea did not answer.");
    } finally {
      diving.current = false;
    }
  }

  function begin(resume: boolean) {
    const audio = sessionRef.current?.audio ?? new SeaAudio();
    audio.unlock();
    audio.setMuted(profile.muted);
    const selfId = makeId();
    const sim = createSim({
      selfId,
      name: profile.callsign.trim() || "Unmarked",
      partner: profile.partner,
      soren: profile.soren,
    });
    if (resume) {
      const file = loadSave();
      if (file) applySave(sim, selfId, file);
    } else {
      clearSave();
    }
    const link = new DescentLink(selfId);
    link.getTime = () => sim.time;
    link.onHost = () => {
      link.broadcast({ k: "snap", world: exportWorld(sim) });
    };
    link.onPacket = (_from, data) => {
      if (!data || typeof data !== "object") return;
      const msg = data as { k?: string; world?: ReturnType<typeof exportWorld>; divers?: unknown[]; id?: string; dmg?: number; kind?: "use" | "repair" | "o2" | "med" | "ammo" | "cell"; amount?: number };
      if (msg.k === "clock" && link.auth) link.send({ k: "full", world: exportWorld(sim) }, _from);
      if ((msg.k === "full" || msg.k === "snap") && msg.world && !link.auth) importWorld(sim, msg.world, selfId);
      if (msg.k === "own" && Array.isArray(msg.divers)) {
        for (const diver of msg.divers) applyOwn(sim, diver as Parameters<typeof applyOwn>[1], selfId);
      }
      if (msg.k === "hurt" && msg.id && typeof msg.dmg === "number") {
        const diver = findDiver(sim, msg.id);
        if (diver?.owner === selfId) hurtDiver(sim, msg.id, msg.dmg);
      }
      if (msg.k === "grant" && msg.id && msg.kind && msg.kind !== "use" && msg.kind !== "repair" && msg.amount) {
        applyGrant(sim, msg.id, msg.kind, msg.amount);
      }
      if (msg.k === "act" && link.auth && msg.id) {
        const diver = findDiver(sim, msg.id);
        if (!diver) return;
        if (msg.kind === "use") pressUse(sim, diver);
        if (msg.kind === "repair") pressRepair(sim, diver);
      }
    };
    const session: Session = {
      sim,
      selfId,
      keys: new Set(),
      probe: new Set(),
      prev: new Set(),
      link,
      audio,
      art: loadArt(),
      overlay: "none",
      touch: { ax: 0, ay: 0, fire: false, use: false },
      aimStick: { x: 0, y: 0 },
      pointer: { wx: 0, wy: 0, on: false },
      bubbles: [],
      camX: sim.regions.breach.spawn.x - 180,
      camY: 40,
      saveAcc: 0,
      netAcc: 0,
      hudAcc: 0,
      mode: "play",
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      ocean: null,
      seenRegion: "",
      passage: 0,
      visionSeen: null,
      hold: null,
    };
    sessionRef.current = session;
    installProbe(session);
    saveProfile({ ...profile, linkMode: "frequency" });
    void link.start(cleanRoom(profile.room), profile.callsign || "Unmarked");
    setMode("play");
    setOverlay("none");
    setHud(readHud(session));
  }

  function leave() {
    const session = sessionRef.current;
    if (session) {
      if (session.ocean) session.ocean.close();
      else writeSave(session.sim, session.selfId);
      session.link.close();
      session.mode = "menu";
    }
    setMode("menu");
    setResumeOk(true);
  }

  if (mode === "menu") {
    const form = profile;
    return (
      <main className="relative min-h-full overflow-hidden bg-deep text-foam">
        <img src="/bg/breach.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-linear-to-r from-deep via-deep/80 to-deep/30" />
        <div className="relative mx-auto flex min-h-full max-w-5xl flex-col justify-between gap-8 px-5 py-8 md:px-10 md:py-12">
          <header className="max-w-xl">
            <p className="text-xs tracking-[0.28em] text-biolume uppercase">Descent 01 · shared depth</p>
            <h1 className="font-display mt-3 text-5xl leading-none text-foam md:text-7xl">Abyssal</h1>
            <p className="font-display mt-2 text-2xl text-amber">The Last Ascent</p>
            <p className="mt-5 max-w-md text-base leading-relaxed text-mist">
              You come to under the torn grid with the air already leaving. The wreck still holds records, and they do not
              agree. The ocean keeps going when you look away. Another diver is in your sector only when your paths
              meet. The plains can be burning while the breach stays quiet.
            </p>
          </header>
          <form
            className="grid max-w-xl gap-4 border border-line bg-abyss/90 p-4 md:p-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (heldBeacon) void beginOcean();
              else setMode("opening");
            }}
          >
            <label className="grid gap-1 text-sm">
              <span className="text-mist">Callsign</span>
              <input
                value={form.callsign}
                maxLength={18}
                placeholder="Unmarked"
                className="h-11 border border-line bg-deep px-3 text-foam outline-none focus:border-biolume"
                onChange={(event) => setProfile({ ...form, callsign: event.target.value })}
              />
            </label>
            {fault ? <p className="text-sm text-amber">{fault}</p> : null}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="h-12 bg-biolume px-5 font-medium text-deep"
                onClick={() => {
                  if (heldBeacon) void beginOcean();
                  else setMode("opening");
                }}
              >
                {heldBeacon ? "Return to your dive" : "Enter the ocean"}
              </button>
              {heldBeacon ? (
                <button
                  type="button"
                  className="h-12 border border-line px-5 text-foam"
                  onClick={() => {
                    localStorage.removeItem(DIVER_TOKEN);
                    setHeldBeacon(false);
                  }}
                >
                  Forget this dive
                </button>
              ) : null}
            </div>
            {roster ? (
              <ul className="grid gap-1 text-sm text-mist">
                {roster
                  .filter((row) => row.state !== "sealed")
                  .map((row) => (
                    <li key={row.id} className="flex justify-between gap-3 border-b border-line/70 py-1">
                      <span className="text-foam">{row.name}</span>
                      <span>
                        {row.state === "live" ? row.divers.map((diver) => diver.name).join(" · ") : "asleep"}
                        {row.boss?.alive && row.divers.length ? ` · Maw ${Math.round(row.boss.hp)}` : ""}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-mist">The shared ocean is listening. Empty sectors stay asleep.</p>
            )}
            <p className="text-sm leading-relaxed text-mist">
              WASD swims. A is left, D is right, W rises, S sinks. The mouse aims. Space fires. E boards. Tab
              cycles seats — the helm steers, the tube fires, and the sea decides who sits where. A dropped
              signal opens the seat. Coming back finds you where you were.
            </p>
            <details className="text-sm text-mist">
              <summary className="cursor-pointer text-foam">Experimental frequency</summary>
              <p className="mt-2">
                A browser-to-browser room. Useful for trying a hull together. It is not the ocean, and it forgets
                the world when the host leaves.
              </p>
              <label className="mt-3 grid gap-1">
                <span>Frequency</span>
                <input
                  value={form.room}
                  maxLength={24}
                  className="h-11 border border-line bg-deep px-3 text-foam outline-none focus:border-biolume"
                  onChange={(event) => setProfile({ ...form, room: event.target.value })}
                />
              </label>
              <label className="mt-3 flex min-h-11 items-center gap-3 text-foam">
                <input
                  type="checkbox"
                  checked={form.partner}
                  onChange={(event) => setProfile({ ...form, partner: event.target.checked })}
                />
                Imani on arrow keys
              </label>
              <label className="flex min-h-11 items-center gap-3 text-foam">
                <input
                  type="checkbox"
                  checked={form.soren}
                  onChange={(event) => setProfile({ ...form, soren: event.target.checked })}
                />
                Soren follows
              </label>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" className="h-11 border border-line px-4 text-foam" onClick={() => begin(false)}>
                  Open frequency
                </button>
                {resumeOk ? (
                  <button type="button" className="h-11 border border-line px-4 text-foam" onClick={() => begin(true)}>
                    Resume frequency
                  </button>
                ) : null}
              </div>
            </details>
          </form>
        </div>
      </main>
    );
  }

  if (mode === "opening") {
    return <Opening audio={seaRef.current ?? (seaRef.current = new SeaAudio())} onDone={() => { warned.current = true; void beginOcean(); }} />;
  }

  return (
    <main className="relative h-full min-h-full overflow-hidden bg-deep text-foam">
      <div className="absolute inset-0 grid place-items-center [container-type:size]">
        <canvas
          ref={canvasRef}
          tabIndex={-1}
          aria-label="Ocean gameplay"
          width={VIEW_W}
          height={VIEW_H}
          className="bg-deep"
          style={{
            imageRendering: "pixelated",
            touchAction: "none",
            aspectRatio: `${VIEW_W} / ${VIEW_H}`,
            width: "min(100cqw, calc(100cqh * 512 / 288))",
            height: "auto",
          }}
          onPointerMove={(event) => pointCanvas(event.clientX, event.clientY)}
          onPointerDown={(event) => pointCanvas(event.clientX, event.clientY)}
          onPointerLeave={() => {
            const session = sessionRef.current;
            if (session) session.pointer.on = false;
          }}
        />
      </div>
      {hud ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="pointer-events-auto border border-line bg-deep/80 p-3 backdrop-blur-sm">
              <p className="text-[10px] tracking-[0.18em] text-biolume uppercase">{hud.region}</p>
              <div className="mt-2 flex flex-wrap gap-4">
                <Meter label="Hull of you" value={hud.hp} tone="rust" />
                <Meter label={hud.hypoxia ? "Hypoxia" : "Air"} value={hud.o2} tone={hud.hypoxia ? "amber" : "bio"} />
              </div>
              <p className="mt-2 text-xs text-mist">
                {hud.depth} · {hud.seat} · darts {hud.ammo} · cells {hud.cells}
              </p>
              {hud.hull > 0 ? (
                <div className="mt-2 flex gap-4">
                  <Meter label={`Vehicle ${hud.stage >= 4 ? "critical" : "hull"}`} value={hud.hull * 100} tone="amber" />
                  <Meter label="Energy" value={hud.energy * 100} tone="bio" />
                </div>
              ) : null}
            </div>
            <div className="pointer-events-auto flex items-center gap-2 border border-line bg-deep/80 px-3 py-2 text-xs text-mist">
              <Radio className="size-4 text-biolume" />
              <span>
                {hud.link}
                {hud.peers ? ` · ${hud.peers}` : ""}
              </span>
              <button
                type="button"
                className="ml-2 grid size-11 place-items-center text-foam"
                aria-label={profile?.muted ? "Unmute" : "Mute"}
                onClick={() => {
                  if (!profile || !sessionRef.current) return;
                  const muted = !profile.muted;
                  setProfile({ ...profile, muted });
                  sessionRef.current.audio.setMuted(muted);
                  saveProfile({ ...profile, muted });
                }}
              >
                {profile?.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
            </div>
          </div>
          <div className="mx-auto mb-1 max-w-lg text-center">
            {hud.bossState !== "patrol" && hud.bossState !== "down" && hud.boss > 0 ? (
              <div className="mb-2 border border-amber/50 bg-deep/80 px-3 py-2">
                <p className="text-[10px] tracking-[0.2em] text-amber uppercase">Lantern Maw · {hud.bossState}</p>
                <div className="mt-1 h-1.5 bg-deep">
                  <div className="h-full bg-amber" style={{ width: `${(hud.boss / hud.bossMax) * 100}%` }} />
                </div>
              </div>
            ) : null}
            {hud.toasts[0] ? <p className="bg-deep/75 px-3 py-2 text-sm text-foam">{hud.toasts[0]}</p> : null}
            <p className="mt-2 text-[10px] tracking-[0.18em] text-amber uppercase">{hud.understanding}</p>
            <p className="mt-1 text-xs text-mist">{hud.objective}</p>
            {hud.soren ? <p className="text-[10px] tracking-[0.14em] text-amber uppercase">{hud.soren}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="absolute right-3 bottom-3 flex gap-2 md:right-4">
        <button type="button" className="grid size-11 place-items-center border border-line bg-deep/85" aria-label="Map" onClick={() => {
          const session = sessionRef.current;
          if (!session) return;
          session.overlay = session.overlay === "map" ? "none" : "map";
          setOverlay(session.overlay);
        }}>
          <Map className="size-4" />
        </button>
        <button type="button" className="grid size-11 place-items-center border border-line bg-deep/85" aria-label="Journal" onClick={() => {
          const session = sessionRef.current;
          if (!session) return;
          session.overlay = session.overlay === "journal" ? "none" : "journal";
          setOverlay(session.overlay);
        }}>
          <BookOpen className="size-4" />
        </button>
      </div>

      {narrow ? (
        <div className="absolute inset-x-0 bottom-16 flex items-end justify-between gap-2 px-3">
          <Stick
            label="Move"
            onChange={(ax, ay) => {
              const session = sessionRef.current;
              if (session) {
                session.touch.ax = ax;
                session.touch.ay = ay;
              }
            }}
          />
          <div className="grid gap-2">
            <TouchButton label="Fire" onDown={() => flag("fire", true)} onUp={() => flag("fire", false)} />
            <TouchButton label="Board" onDown={() => flag("use", true)} onUp={() => undefined} />
          </div>
          <Stick
            label="Aim"
            onChange={(ax, ay) => {
              const session = sessionRef.current;
              if (session) session.aimStick = { x: ax, y: ay };
            }}
          />
        </div>
      ) : null}

      {overlay !== "none" && overlay !== "dead" ? (
        <section
          className="absolute inset-0 grid place-items-center bg-deep/72 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={overlay === "map" ? "Expedition map" : overlay === "journal" ? "Archive" : "Dive controls"}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const controls = event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
            );
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }}
        >
          <div className="flex max-h-[86%] w-full max-w-3xl flex-col overflow-hidden border border-line bg-abyss">
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
              <p className="text-xs tracking-[0.16em] text-mist uppercase">
                {overlay === "map" ? "Expedition map" : overlay === "journal" ? "Archive" : "Dive controls"}
              </p>
              <button
                type="button"
                autoFocus
                className="flex min-h-11 items-center gap-2 bg-biolume px-4 text-sm font-medium text-deep"
                onClick={resumeGame}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Resume game
              </button>
            </header>
            <div className="min-h-0 overflow-y-auto p-5">
            {overlay === "pause" ? (
              <>
                <h2 className="font-display text-3xl">Holding breath</h2>
                <ul className="mt-4 space-y-1 text-sm text-mist">
                  <li>WASD swim or helm. A left, D right. W rises, S sinks.</li>
                  <li>The mouse aims. On a phone the right stick aims. The tick is the shot.</li>
                  <li>Space harpoon or torpedo. E board or exit. R repair with a cell.</li>
                  <li>Arrows and L are Imani, if she launched with you. V holds Soren in this sector.</li>
                  <li>Tab cycles seats. The helm steers. The tube fires. The pumps brace. The sea keeps the booking.</li>
                  <li>If your signal drops, the seat opens. Coming back puts you where you left the water.</li>
                  <li>The journal keeps what this expedition has come to understand. Records can disagree until the pieces meet. It does not unlock a door.</li>
                </ul>
                <div className="mt-5 flex gap-3">
                  <button type="button" className="h-11 border border-line px-4" onClick={leave}>
                    Surface to menu
                  </button>
                </div>
              </>
            ) : null}
            {overlay === "map" ? (
              <div className="space-y-6">
                {sessionRef.current?.ocean ? (
                  <StageMap
                    roster={roster}
                    flags={sessionRef.current.sim.flags}
                    explored={sessionRef.current.sim.explored}
                    here={findDiver(sessionRef.current.sim, sessionRef.current.selfId)?.region}
                  />
                ) : null}
                <Chart sim={sessionRef.current?.sim} selfId={sessionRef.current?.selfId ?? ""} />
              </div>
            ) : null}
            {overlay === "journal" ? (
              <Journal sim={sessionRef.current?.sim} selfId={sessionRef.current?.selfId ?? ""} />
            ) : null}
            </div>
          </div>
        </section>
      ) : null}
      {overlay === "dead" ? (
        <section className="absolute inset-0 grid place-items-center bg-deep/70">
          <div className="border border-line bg-abyss px-6 py-5 text-center">
            <Anchor className="mx-auto size-6 text-amber" />
            <h2 className="font-display mt-2 text-3xl">Blackout</h2>
            <p className="mt-2 text-sm text-mist">The beacon is pulling you back. Discoveries stay.</p>
          </div>
        </section>
      ) : null}
      {vision ? <SurfaceVision onDone={() => setVision(false)} /> : null}
    </main>
  );

  function pointCanvas(clientX: number, clientY: number) {
    const session = sessionRef.current;
    const canvas = canvasRef.current;
    if (!session || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const sx = ((clientX - rect.left) / rect.width) * VIEW_W;
    const sy = ((clientY - rect.top) / rect.height) * VIEW_H;
    session.pointer.wx = sx + session.camX;
    session.pointer.wy = sy + session.camY;
    session.pointer.on = true;
  }

  function flag(key: "fire" | "use", value: boolean) {
    const session = sessionRef.current;
    if (!session) return;
    session.touch[key] = value;
  }
}

function TouchButton({ label, onDown, onUp }: { label: string; onDown: () => void; onUp: () => void }) {
  return (
    <button
      type="button"
      className="h-12 min-w-16 border border-line bg-deep/85 px-3 text-xs tracking-wide text-foam uppercase"
      onPointerDown={(event) => {
        event.preventDefault();
        onDown();
      }}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      {label}
    </button>
  );
}

function Stick({ label, onChange }: { label: string; onChange: (ax: number, ay: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  function setFrom(clientX: number, clientY: number) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    let ax = ((clientX - rect.left) / rect.width) * 2 - 1;
    let ay = ((clientY - rect.top) / rect.height) * 2 - 1;
    const mag = Math.hypot(ax, ay);
    if (mag < 0.18) {
      setKnob({ x: ax * 0.5, y: ay * 0.5 });
      onChange(0, 0);
      return;
    }
    const scale = Math.min(1, mag);
    ax = (ax / mag) * scale;
    ay = (ay / mag) * scale;
    setKnob({ x: ax, y: ay });
    onChange(ax, ay);
  }
  function release() {
    setKnob({ x: 0, y: 0 });
    onChange(0, 0);
  }
  return (
    <div
      ref={ref}
      className="relative size-24 border border-line bg-deep/70"
      style={{ touchAction: "none" }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setFrom(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) setFrom(event.clientX, event.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <span className="pointer-events-none absolute top-1 left-1/2 -translate-x-1/2 text-[10px] tracking-wide text-mist uppercase">
        {label}
      </span>
      <span
        className="pointer-events-none absolute size-5 bg-biolume"
        style={{
          left: `calc(50% + ${knob.x * 32}px)`,
          top: `calc(50% + ${knob.y * 32}px)`,
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}

function Chart({ sim, selfId }: { sim: Sim | undefined; selfId: string }) {
  if (!sim) return null;
  const you = findDiver(sim, selfId);
  const chain: { id: RegionId; x: number; y: number }[] = [
    { id: "breach", x: 70, y: 108 },
    { id: "plains", x: 200, y: 108 },
    { id: "city", x: 330, y: 78 },
    { id: "works", x: 460, y: 138 },
    { id: "reef", x: 590, y: 78 },
  ];
  const at = (id: RegionId) => chain.find((node) => node.id === id)!;
  const link = (a: RegionId, b: RegionId, open: boolean) => {
    const from = at(a);
    const to = at(b);
    return { x1: from.x, y1: from.y, x2: to.x, y2: to.y, open };
  };
  const routes = [
    link("breach", "plains", true),
    link("plains", "city", sim.flags.mawDead),
    link("city", "works", true),
    link("works", "reef", true),
  ];
  return (
    <div>
      <h2 className="font-display text-3xl">Chart</h2>
      <p className="mt-1 text-sm text-mist">
        The chain is the water you can still reach. You are the bright mark. Amber is a lock. Hulls you have
        seen sit on their sectors. The trench, the upper ocean, and the surface stay shut.
      </p>
      <svg viewBox="0 0 760 250" className="mt-3 w-full" role="img" aria-label="Descent chart">
        {routes.map((route) => (
          <line
            key={`${route.x1}-${route.x2}`}
            x1={route.x1}
            y1={route.y1}
            x2={route.x2}
            y2={route.y2}
            stroke={route.open ? "#3ee0c5" : "#e7a04a"}
            strokeDasharray={route.open ? undefined : "5 4"}
            strokeWidth={2}
          />
        ))}
        <line x1={200} y1={108} x2={200} y2={196} stroke="#8aa4a0" strokeDasharray="4 4" strokeWidth={1.5} />
        <line x1={590} y1={78} x2={690} y2={42} stroke="#8aa4a0" strokeDasharray="4 4" strokeWidth={1.5} />
        <line x1={690} y1={42} x2={690} y2={196} stroke="#8aa4a0" strokeDasharray="4 4" strokeWidth={1.5} />
        {!sim.flags.mawDead ? (
          <text x={250} y={86} fill="#e7a04a" fontSize={11}>
            Maw lock
          </text>
        ) : null}
        <text x={624} y={58} fill="#8aa4a0" fontSize={11}>
          upper lock shut
        </text>
        {chain.map((node) => {
          const region = sim.regions[node.id];
          const here = you?.region === node.id;
          return (
            <g key={node.id}>
              <rect
                x={node.x - 52}
                y={node.y - 22}
                width={104}
                height={44}
                fill={here ? "#07302c" : "#07141a"}
                stroke={here ? "#3ee0c5" : "#24564f"}
              />
              <text x={node.x} y={node.y - 4} fill="#e6f1ee" fontSize={11} textAnchor="middle">
                {region.name}
              </text>
              <text x={node.x} y={node.y + 12} fill="#8aa4a0" fontSize={10} textAnchor="middle">
                {region.depth} m
              </text>
            </g>
          );
        })}
        {[
          { name: "Trench", x: 200, y: 210 },
          { name: "Upper ocean", x: 690, y: 28 },
          { name: "Surface", x: 690, y: 214 },
        ].map((zone) => (
          <g key={zone.name}>
            <rect x={zone.x - 46} y={zone.y - 14} width={92} height={26} fill="#120e0c" stroke="#6a4a32" />
            <text x={zone.x} y={zone.y + 4} fill="#c4895a" fontSize={11} textAnchor="middle">
              {zone.name} · sealed
            </text>
          </g>
        ))}
        {sim.vehicles
          .filter((vehicle) => vehicle.seen)
          .map((vehicle) => {
            const node = at(vehicle.region);
            const span = sim.regions[vehicle.region].w * TILE;
            const t = Math.max(0, Math.min(1, vehicle.x / span));
            return (
              <rect
                key={vehicle.id}
                x={node.x - 40 + t * 72}
                y={node.y + 24}
                width={8}
                height={4}
                fill="#e7a04a"
              />
            );
          })}
        {(() => {
          const maw = sim.creatures.find((creature) => creature.kind === "maw");
          const known = sim.discovered.includes("beast:maw") || sim.explored.plains.some(Boolean) || sim.flags.mawDead;
          if (!maw || !known) return null;
          const node = at("plains");
          const t = Math.max(0, Math.min(1, maw.x / (sim.regions.plains.w * TILE)));
          return (
            <g>
              <circle cx={node.x - 40 + t * 80} cy={node.y + 28} r={4} fill={maw.alive ? "#c4553a" : "#3ee0c5"} />
              <text x={node.x - 40 + t * 80 + 7} y={node.y + 32} fill="#c4553a" fontSize={10}>
                {maw.alive ? "Maw" : "Maw down"}
              </text>
            </g>
          );
        })()}
        {you
          ? (() => {
              const node = at(you.region);
              const t = Math.max(0, Math.min(1, you.x / (sim.regions[you.region].w * TILE)));
              return <circle cx={node.x - 36 + t * 72} cy={node.y + 8} r={4} fill="#3ee0c5" />;
            })()
          : null}
      </svg>
      <div className="mt-2 space-y-2">
        {chain.map((node) => (
          <div key={node.id}>
            <div className="flex h-1.5 w-full bg-hull">
              {sim.explored[node.id].map((seen, index) => (
                <span key={index} className={`h-full flex-1 ${seen ? "bg-biolume" : "bg-transparent"}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-mist">
        {you ? `${you.name} is in ${sim.regions[you.region].name}.` : "You are in the dark."}
        {sim.divers
          .filter((diver) => diver.alive && diver.id !== selfId)
          .map((diver) => ` ${diver.name} is in ${sim.regions[diver.region].name}.`)
          .join("")}{" "}
        {understanding(sim, you).title}. {understanding(sim, you).next}
      </p>
      <ul className="mt-3 space-y-1 text-sm">
        {ZONES.map((zone) => (
          <li key={zone.id} className="flex justify-between gap-3 border-b border-line py-1">
            <span>{zone.name}</span>
            <span className={zone.state === "live" ? "text-biolume" : "text-mist"}>
              {zone.depth} · {zone.state === "live" ? "live" : "sealed"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-mist">
        The surface is not a mode. Light in the reef, a broken signal, and a sealed collar are all it will give you until the ascent is earned.
      </p>
    </div>
  );
}

function Journal({ sim, selfId }: { sim: Sim | undefined; selfId: string }) {
  if (!sim) return null;
  const you = findDiver(sim, selfId);
  const grasp = understanding(sim, you);
  const archive = archiveOf(sim.discovered, sim.shared);
  const beasts = sim.discovered.filter((id) => id.startsWith("beast:"));
  return (
    <div>
      <h2 className="font-display text-3xl">Archive</h2>
      <p className="mt-2 text-[10px] tracking-[0.18em] text-amber uppercase">
        Understanding · {grasp.index + 1} of {UNDERSTANDING.length}
      </p>
      <h3 className="mt-1 font-display text-2xl text-foam">{grasp.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-mist">{grasp.known}</p>
      <p className="mt-2 text-sm text-foam">{grasp.next}</p>
      <ol className="mt-4 space-y-1 text-sm">
        {UNDERSTANDING.map((step, index) => (
          <li key={step.id} className={index <= grasp.index ? "text-foam" : "text-mist"}>
            {index <= grasp.index ? step.title : "Still dark"}
          </li>
        ))}
      </ol>

      <h3 className="mt-6 text-xs tracking-[0.16em] text-biolume uppercase">Timeline</h3>
      <ol className="mt-2 space-y-1 text-sm">
        {archive.timeline.map((beat) => (
          <li key={beat.id} className={beat.known ? "text-foam" : "text-mist"}>
            {beat.known ? beat.label : "Still dark"}
          </li>
        ))}
      </ol>

      <h3 className="mt-6 text-xs tracking-[0.16em] text-biolume uppercase">The lantern</h3>
      <ol className="mt-2 space-y-1 text-sm">
        {mawStages([...sim.discovered, ...sim.shared]).map((stage) => (
          <li key={stage.id} className={stage.known ? "text-foam" : "text-mist"}>
            {stage.known ? stage.label : "Still dark"}
          </li>
        ))}
      </ol>

      <h3 className="mt-6 text-xs tracking-[0.16em] text-biolume uppercase">Investigations</h3>
      <div className="mt-2 space-y-4">
        {archive.cases.map((item) => (
          <article key={item.id}>
            <h3 className="text-amber">{item.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-mist">
              {item.closed ? item.reconstruction : item.question}
            </p>
            <p className="mt-1 text-xs tracking-[0.08em] text-foam uppercase">
              {item.closed
                ? "Reconstructed"
                : `${item.have} of ${item.total} · still missing ${item.missing.join(", ")}`}
            </p>
          </article>
        ))}
      </div>

      <h3 className="mt-6 text-xs tracking-[0.16em] text-biolume uppercase">Stations</h3>
      {archive.stations.length === 0 ? (
        <p className="mt-2 text-sm text-mist">Nothing written down yet. Swim into the glowing desks.</p>
      ) : (
        <div className="mt-2 space-y-4">
          {archive.stations.map((station) => (
            <article key={station.id}>
              <p className="text-[10px] tracking-[0.16em] text-biolume uppercase">
                {KIND_LABEL[station.kind]} · {station.place}
              </p>
              <h3 className="text-amber">{station.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-mist">
                {station.read ? station.body : "Another diver recovered this. You have not read it."}
              </p>
            </article>
          ))}
        </div>
      )}

      {beasts.length ? (
        <div className="mt-5">
          <h3 className="text-xs tracking-[0.16em] text-biolume uppercase">Seen</h3>
          <ul className="mt-2 space-y-2 text-sm text-mist">
            {beasts.map((id) => {
              const key = id.slice(6);
              const entry = BESTIARY[key];
              return (
                <li key={id}>
                  <span className="text-foam">{entry?.name ?? key}.</span> {entry?.note}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys?: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
    __abyssal?: {
      nearby: () => string[];
      you: () => {
        x: number;
        y: number;
        seat: string | null;
        vehicle: string | null;
        region: string;
        hp: number;
        o2: number;
        aimX: number;
        aimY: number;
      } | null;
      warp: (x: number, y: number, region?: RegionId) => void;
      world: () => {
        explored: number;
        seen: string[];
        others: { name: string; x: number; y: number; hp: number; o2: number; region: string; seat: string | null; vehicle: string | null }[];
        creatures: { id: string; kind: string; hp: number; x: number; y: number }[];
        roster: { id: string; divers: string[] }[];
      };
      drive: (ax: number, ay: number, fire: boolean, aimX?: number, aimY?: number) => void;
      tap: (kind: "use" | "repair" | "cycle") => void;
    };
  }
}
