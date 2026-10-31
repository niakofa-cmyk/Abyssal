import { o as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Map$1, c as Anchor, i as Radio, n as Volume2, o as Lock, s as BookOpen, t as VolumeX } from "../_libs/lucide-react.mjs";
import { _ as pressUse, a as applyOwn, b as ZONES, c as exportWorld, d as hullStage, f as hurtDiver, g as pressRepair, h as objective, i as applyGrant, l as findDiver, m as note, n as applyOceanView, o as createSim, p as importWorld, r as glideOcean, s as cycleSeat, u as findVehicle, v as stepSim, y as velocityOf } from "./router-I8gceiFP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D5dHLFS-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SPOT = {
	breach: {
		x: 18,
		y: 28,
		n: 1
	},
	plains: {
		x: 46,
		y: 42,
		n: 2
	},
	city: {
		x: 24,
		y: 68,
		n: 3
	},
	works: {
		x: 52,
		y: 74,
		n: 4
	},
	reef: {
		x: 78,
		y: 52,
		n: 5
	},
	trench: {
		x: 74,
		y: 16
	},
	upper: {
		x: 86,
		y: 30
	},
	surface: {
		x: 90,
		y: 12
	}
};
var SHORT = {
	breach: "Breach",
	plains: "Plains",
	city: "City",
	works: "Works",
	reef: "Reef",
	trench: "Trench",
	upper: "Upper",
	surface: "Surface"
};
var LINKS = [
	["breach", "plains"],
	["plains", "city"],
	["city", "works"],
	["works", "reef"],
	["plains", "trench"],
	["reef", "upper"],
	["upper", "surface"]
];
function stars(explored) {
	if (!explored?.length) return 0;
	const filled = explored.filter(Boolean).length / explored.length;
	if (filled > .66) return 3;
	if (filled > .33) return 2;
	if (filled > .02) return 1;
	return 0;
}
function StageMap({ roster, flags, explored, here }) {
	const byId = new Map((roster ?? []).map((row) => [row.id, row]));
	const locked = (id) => {
		const row = byId.get(id);
		if (!row || row.state === "sealed") return true;
		if (!flags?.mawDead && (id === "city" || id === "works" || id === "reef")) return true;
		return false;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[10px] tracking-[0.18em] text-biolume uppercase",
			children: "Shared ocean"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-mist",
			children: "Each platform is its own sector. You only share a fight with the divers on yours."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative mt-3 h-80",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
				className: "absolute inset-0 h-full w-full",
				viewBox: "0 0 100 100",
				preserveAspectRatio: "none",
				"aria-hidden": true,
				children: LINKS.map(([a, b]) => {
					const from = SPOT[a];
					const to = SPOT[b];
					if (!from || !to) return null;
					const shut = a === "plains" && b === "city" && !flags?.mawDead || locked(b);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
						x1: from.x,
						y1: from.y,
						x2: to.x,
						y2: to.y,
						stroke: shut ? "#e7a04a" : "#3ee0c5",
						strokeWidth: "0.6",
						strokeDasharray: shut ? "1.4 1.2" : void 0,
						opacity: "0.7"
					}, `${a}-${b}`);
				})
			}), Object.entries(SPOT).map(([id, spot]) => {
				const row = byId.get(id);
				const shut = locked(id);
				const earned = stars(explored?.[id]);
				const names = row?.divers.map((d) => d.name).join(" · ") ?? "";
				const boss = row?.boss;
				const showBoss = boss && boss.alive && (row?.divers.length ?? 0) > 0;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute w-24",
					style: {
						left: `${spot.x}%`,
						top: `${spot.y}%`,
						transform: "translate(-50%, -50%)"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `relative ${here === id ? "outline outline-1 outline-biolume" : ""}`,
						children: [
							spot.n ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute -top-3 -left-2 grid size-6 place-items-center rounded-full bg-amber text-xs font-medium text-deep",
								children: spot.n
							}) : null,
							shut ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute -top-3 -right-1 grid size-6 place-items-center rounded-full bg-rust text-foam",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-3" })
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `h-9 border border-line ${shut ? "bg-hull" : row?.state === "live" ? "bg-biolume/25" : "bg-ink"}`,
								style: { clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)" }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-center text-[10px] tracking-wide text-foam uppercase",
								children: SHORT[id] ?? id
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-center text-[10px] text-amber",
								"aria-label": `${earned} of 3 stars`,
								children: ["★".repeat(earned), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-mist",
									children: "★".repeat(3 - earned)
								})]
							}),
							names ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-center text-[10px] text-biolume",
								children: names
							}) : null,
							showBoss ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-0.5 h-1 bg-deep",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full bg-amber",
									style: { width: `${Math.max(0, boss.hp / boss.hpMax * 100)}%` }
								})
							}) : null
						]
					})
				}, id);
			})]
		})
	] });
}
var LOGS = {
	"breach-blackbox": {
		title: "Aurelian Grid — black box fragment",
		body: "The grid was not a city power plant. It was a pressure heart, pumping heat out of the shelf so the districts above could stay dry inside their glass. The last stable reading is a spike, then a word the logger did not finish: vent."
	},
	"breach-order": {
		title: "Unsent evacuation",
		body: "All nonessential crews to the collar locks. Do not wait for the tram. If the heart vents, the shelf will fold and the city will drink the dark. This message was still in the outbox."
	},
	"breach-bio": {
		title: "Specimen note, unsigned",
		body: "The ribbon eels left the reef lights three days before the blast. They gathered on the warm pipes. Whatever we woke down there, it already knew the shape of our hulls."
	},
	"plains-city": {
		title: "Shelf census, page torn",
		body: "Four districts. One school. A market that sold oranges grown under lamps. The census clerk's handwriting gets larger near the bottom, as if the pen was moving while the room was not."
	},
	"plains-maw": {
		title: "Field card — lantern fauna",
		body: "They show the lure before they commit. The mouth is the soft part, and only when it is already open. Do not chase the light. Make the light chase you, then punish the pause."
	},
	"plains-surface": {
		title: "Collar probe, still ticking",
		body: "A weather syllable keeps arriving from above the collar: wind, then rain, then wind again. The Maw's door is only a shelf door. The city is still standing past it. The true collar is higher, and this probe cannot open it."
	},
	"city-tram": {
		title: "Tram log, district two",
		body: "The last car left the school stop empty. Someone had already opened the windows. The glass did not break. The street did. People who stayed inside the towers lasted longer than the people who swam."
	},
	"city-barrow": {
		title: "Salvage chit — Barrow",
		body: "Three seats. Helm, tube, pumps. The skin will brace if the engineer spends a cell of charge. She was built to cross the furnaces, not to race the plains. Do not take her into the spore fields with the pumps empty."
	},
	"works-vent": {
		title: "Furnace order, overwritten",
		body: "The heart was not only pumping heat out. A second line ran down, under the trench, and the order to shut it was written over twice. The sentries are still obeying the first version."
	},
	"reef-spore": {
		title: "Reef watch",
		body: "The lamp anemones root where the warm pipes used to bleed. They flare, then they bruise anything inside the circle. Unfiltered air goes thin in the gold dust. A sealed hull does not."
	},
	"reef-collar": {
		title: "Upper lock, refused",
		body: "The reef can see a paler dark. The lock that would finish the climb does not answer this frequency, this hull, or this year. Trench, upper ocean, and the surface stay shut."
	}
};
var BESTIARY = {
	darter: {
		name: "Glass darter",
		note: "Harmless. They only panic, and their panic is useful — it means something larger just arrived."
	},
	eel: {
		name: "Pipe eel",
		note: "Territorial. The body coils, the lure steadies, then it commits. Shoot the pause, not the blur."
	},
	hunter: {
		name: "Ridge hunter",
		note: "It prefers metal to meat. A hull is a louder meal than a swimmer."
	},
	maw: {
		name: "The Lantern Maw",
		note: "Shared quarry. The flare is the warning. The open mouth is the only honest place to hurt it."
	},
	sentry: {
		name: "Furnace sentry",
		note: "It aims before it fires. The bolt is slow. The warning line is the honest part."
	},
	bloom: {
		name: "Lamp anemone",
		note: "It roots. The fronds flare, then the water in reach turns mean. Leave the circle."
	}
};
var FAST_POLL_MS = 400;
var IDLE_POLL_MS = 2e3;
var PING_INTERVAL_MS = 2e3;
var STALL_MS = 1e4;
var MAX_RECOVERY_ATTEMPTS = 3;
var SIGNAL_RETRY_DELAYS_MS = [250, 750];
function defaultIceServers() {
	return [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
}
var P2PRoom = class {
	opts;
	peers = /* @__PURE__ */ new Map();
	/** Per-remote-peer signal delivery chains (order-preserving). */
	signalQueues = /* @__PURE__ */ new Map();
	cursor = 0;
	pollTimer = null;
	pingTimer = null;
	closed = false;
	everPolled = false;
	lastPeersFingerprint = "";
	constructor(opts) {
		this.opts = opts;
	}
	/**
	* The first poll IS the join: it registers this peer and returns the
	* roster. A failed first poll (cold DB, offline tab) must not strand the
	* room: the loop and timers start regardless and the next poll retries.
	*/
	async join() {
		try {
			await this.pollOnce();
		} catch {}
		if (this.closed) return;
		this.schedulePoll(this.anyPairConnecting() ? FAST_POLL_MS : IDLE_POLL_MS);
		this.pingTimer = setInterval(() => {
			this.pingAll();
			this.watchdog();
		}, PING_INTERVAL_MS);
	}
	close() {
		this.closed = true;
		if (this.pollTimer) clearTimeout(this.pollTimer);
		if (this.pingTimer) clearInterval(this.pingTimer);
		for (const slot of this.peers.values()) slot.pc.close();
		this.peers.clear();
		fetch("/api/rtc", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				op: "leave",
				room: this.opts.room,
				peer: this.opts.selfId
			}),
			keepalive: true
		}).catch(() => {});
	}
	/** Send on the unreliable game-state channel (drops stale packets). */
	broadcast(data) {
		const wire = JSON.stringify({
			t: "d",
			d: data
		});
		for (const slot of this.peers.values()) if (slot.state?.readyState === "open") slot.state.send(wire);
	}
	/** Send reliably (ordered) to one peer, or to all when peerId is omitted. */
	send(data, peerId) {
		const wire = JSON.stringify({
			t: "d",
			d: data
		});
		const targets = peerId ? [this.peers.get(peerId)] : [...this.peers.values()];
		for (const slot of targets) if (slot?.reliable?.readyState === "open") slot.reliable.send(wire);
	}
	peerList() {
		return [...this.peers.values()].map((s) => ({ ...s.info }));
	}
	schedulePoll(delay) {
		if (this.closed) return;
		if (this.pollTimer) clearTimeout(this.pollTimer);
		this.pollTimer = setTimeout(() => void this.poll(), delay);
	}
	anyPairConnecting() {
		for (const s of this.peers.values()) {
			if (s.terminal) continue;
			if (s.info.connectionState !== "connected") return true;
		}
		return false;
	}
	async pollOnce() {
		const params = new URLSearchParams({
			room: this.opts.room,
			peer: this.opts.selfId,
			name: this.opts.name ?? "",
			since: String(this.cursor)
		});
		const res = await fetch(`/api/rtc?${params}`);
		if (this.closed) return;
		if (!res.ok) throw new Error(`signaling poll failed: ${res.status}`);
		const body = await res.json();
		if (this.closed) return;
		if (!this.everPolled) {
			this.everPolled = true;
			this.opts.onConnected?.();
		}
		this.reconcileRoster(body.peers);
		const roster = new Set(body.peers.map((p) => p.id));
		for (const sig of body.signals) {
			this.cursor = Math.max(this.cursor, sig.id);
			await this.onSignal(sig.from, sig.kind, sig.payload, roster);
			if (this.closed) return;
		}
	}
	async poll() {
		if (this.closed) return;
		try {
			await this.pollOnce();
		} catch {}
		this.schedulePoll(this.anyPairConnecting() ? FAST_POLL_MS : IDLE_POLL_MS);
	}
	reconcileRoster(peers) {
		const alive = new Set(peers.map((p) => p.id));
		for (const p of peers) {
			if (p.id === this.opts.selfId) continue;
			const existing = this.peers.get(p.id);
			if (existing) existing.info.name = p.name;
			else this.connectTo(p.id, p.name, this.opts.selfId > p.id);
		}
		for (const [id, slot] of this.peers) if (!alive.has(id)) {
			slot.pc.close();
			this.peers.delete(id);
		}
		this.emitPeers();
	}
	connectTo(peerId, name, initiator) {
		if (this.closed) return null;
		const pc = new RTCPeerConnection({ iceServers: this.opts.iceServers ?? defaultIceServers() });
		const slot = {
			pc,
			makingOffer: false,
			ignoreOffer: false,
			pendingCandidates: [],
			lastProgressAt: Date.now(),
			recoveryAttempts: 0,
			info: {
				id: peerId,
				name,
				connectionState: pc.connectionState,
				candidateType: null,
				rttMs: null
			}
		};
		this.peers.set(peerId, slot);
		pc.onicecandidate = (e) => {
			if (e.candidate) this.sendSignal(peerId, "ice", e.candidate.toJSON());
		};
		pc.onconnectionstatechange = () => {
			slot.info.connectionState = pc.connectionState;
			if (pc.connectionState === "connecting" || pc.connectionState === "connected") slot.lastProgressAt = Date.now();
			if (pc.connectionState === "connected") {
				slot.recoveryAttempts = 0;
				slot.terminal = false;
				this.readCandidateType(slot);
			}
			this.emitPeers();
			if (pc.connectionState === "failed") pc.restartIce();
			if (pc.connectionState === "failed" || pc.connectionState === "disconnected") this.schedulePoll(FAST_POLL_MS);
		};
		pc.onnegotiationneeded = async () => {
			try {
				slot.makingOffer = true;
				await pc.setLocalDescription();
				await this.sendSignal(peerId, "offer", pc.localDescription.toJSON());
			} catch {} finally {
				slot.makingOffer = false;
			}
		};
		pc.ondatachannel = (e) => this.attachChannel(slot, e.channel);
		if (initiator) {
			this.attachChannel(slot, pc.createDataChannel("state", {
				ordered: false,
				maxRetransmits: 0
			}));
			this.attachChannel(slot, pc.createDataChannel("reliable", { ordered: true }));
		}
		return slot;
	}
	attachChannel(slot, channel) {
		if (channel.label === "state") slot.state = channel;
		else slot.reliable = channel;
		channel.onopen = () => {
			slot.lastProgressAt = Date.now();
		};
		channel.onmessage = (e) => {
			let msg;
			try {
				msg = JSON.parse(e.data);
			} catch {
				return;
			}
			if (msg.t === "ping") {
				if (slot.state?.readyState === "open") slot.state.send(JSON.stringify({ t: "pong" }));
			} else if (msg.t === "pong") {
				if (slot.pingSentAt) {
					slot.info.rttMs = Math.round(performance.now() - slot.pingSentAt);
					slot.pingSentAt = void 0;
					this.emitPeers();
				}
			} else this.opts.onMessage?.(slot.info.id, msg.d, channel.label === "state" ? "state" : "reliable");
		};
	}
	/** Apply buffered ICE candidates once a remote description is in place. */
	async flushPendingCandidates(slot) {
		while (slot.pendingCandidates.length > 0) {
			const candidate = slot.pendingCandidates.shift();
			try {
				await slot.pc.addIceCandidate(candidate);
			} catch (err) {
				if (!slot.ignoreOffer) console.warn("[p2p] addIceCandidate failed:", err);
			}
			if (this.closed) return;
		}
	}
	async onSignal(from, kind, payload, roster) {
		if (this.closed) return;
		let slot = this.peers.get(from);
		if (!slot) {
			if (!roster.has(from)) return;
			const created = this.connectTo(from, "", false);
			if (!created) return;
			slot = created;
		}
		const polite = this.opts.selfId < from;
		try {
			if (kind === "offer" || kind === "answer") {
				const description = payload;
				const collision = kind === "offer" && (slot.makingOffer || slot.pc.signalingState !== "stable");
				slot.ignoreOffer = !polite && collision;
				if (slot.ignoreOffer) return;
				try {
					await slot.pc.setRemoteDescription(description);
				} catch (err) {
					if (kind !== "offer" || slot.recreatedForOffer) throw err;
					const attempts = slot.recoveryAttempts;
					const name = slot.info.name;
					slot.pc.close();
					this.peers.delete(from);
					const fresh = this.connectTo(from, name, false);
					if (!fresh) return;
					fresh.recoveryAttempts = attempts;
					fresh.recreatedForOffer = true;
					slot = fresh;
					await slot.pc.setRemoteDescription(description);
				}
				if (this.closed) return;
				await this.flushPendingCandidates(slot);
				if (this.closed) return;
				if (kind === "offer") {
					await slot.pc.setLocalDescription();
					if (this.closed) return;
					await this.sendSignal(from, "answer", slot.pc.localDescription.toJSON());
				}
			} else if (kind === "ice") {
				const candidate = payload;
				if (!slot.pc.remoteDescription) {
					slot.pendingCandidates.push(candidate);
					return;
				}
				try {
					await slot.pc.addIceCandidate(candidate);
				} catch (err) {
					if (!slot.ignoreOffer) console.warn("[p2p] addIceCandidate failed:", err);
				}
			}
		} catch {}
	}
	/**
	* Signals are serialized per remote peer (a candidate must never overtake
	* its SDP into the DB) and retried on failure with short backoff.
	*/
	sendSignal(to, kind, payload) {
		const next = (this.signalQueues.get(to) ?? Promise.resolve()).then(() => this.postSignal(to, kind, payload));
		this.signalQueues.set(to, next.catch(() => {}));
		return next;
	}
	async postSignal(to, kind, payload) {
		for (let attempt = 0;; attempt++) {
			if (this.closed) return;
			try {
				const res = await fetch("/api/rtc", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						op: "signal",
						room: this.opts.room,
						from: this.opts.selfId,
						to,
						kind,
						payload
					})
				});
				if (res.ok) return;
				throw new Error(`signal POST failed: ${res.status}`);
			} catch (err) {
				if (attempt >= SIGNAL_RETRY_DELAYS_MS.length) {
					console.warn(`[p2p] signal ${kind} to ${to} failed after retries`, err);
					return;
				}
				await new Promise((r) => setTimeout(r, SIGNAL_RETRY_DELAYS_MS[attempt]));
			}
		}
	}
	pingAll() {
		const wire = JSON.stringify({ t: "ping" });
		for (const slot of this.peers.values()) {
			if (slot.state?.readyState !== "open") continue;
			const stale = slot.pingSentAt !== void 0 && performance.now() - slot.pingSentAt > 2 * PING_INTERVAL_MS;
			if (slot.pingSentAt === void 0 || stale) {
				slot.pingSentAt = performance.now();
				slot.state.send(wire);
			}
		}
	}
	/**
	* Stuck-pair recovery, piggybacked on the ping interval. A pair that has
	* made no progress for STALL_MS gets rebuilt by the dialer with a FRESH
	* RTCPeerConnection (new DTLS identity — fixes the suspend/resume
	* fingerprint wedge). After MAX_RECOVERY_ATTEMPTS the pair is terminal:
	* visible to the app as its last connectionState, ignored by fast-poll.
	*/
	watchdog() {
		if (this.closed) return;
		const now = Date.now();
		for (const [peerId, slot] of this.peers) {
			const live = slot.pc.connectionState;
			if (live !== slot.info.connectionState) {
				slot.info.connectionState = live;
				if (live === "connecting" || live === "connected") slot.lastProgressAt = now;
				this.emitPeers();
			}
			if (slot.terminal || live === "connected") continue;
			if (now - slot.lastProgressAt <= STALL_MS) continue;
			if (slot.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
				slot.terminal = true;
				this.emitPeers();
				continue;
			}
			slot.recoveryAttempts += 1;
			slot.lastProgressAt = now;
			if (this.opts.selfId > peerId) {
				const { name } = slot.info;
				const attempts = slot.recoveryAttempts;
				slot.pc.close();
				this.peers.delete(peerId);
				const fresh = this.connectTo(peerId, name, true);
				if (fresh) fresh.recoveryAttempts = attempts;
				this.schedulePoll(FAST_POLL_MS);
			}
		}
	}
	async readCandidateType(slot) {
		try {
			const stats = await slot.pc.getStats();
			let selected;
			stats.forEach((s) => {
				if (s.type === "candidate-pair" && s.nominated) selected = s;
			});
			const localId = selected?.localCandidateId;
			if (localId) {
				const local = stats.get(localId);
				slot.info.candidateType = local?.candidateType ?? null;
				this.emitPeers();
			}
		} catch {}
	}
	emitPeers() {
		const list = this.peerList();
		const fingerprint = JSON.stringify(list.map((p) => [
			p.id,
			p.name,
			p.connectionState,
			p.candidateType,
			p.rttMs
		]));
		if (fingerprint === this.lastPeersFingerprint) return;
		this.lastPeersFingerprint = fingerprint;
		this.opts.onPeersChanged?.(list);
	}
};
var DescentLink = class {
	selfId;
	peers = [];
	status = "offline";
	hostId;
	locked = false;
	clocks = /* @__PURE__ */ new Map();
	room = null;
	electTimer = null;
	fullAt = /* @__PURE__ */ new Map();
	onPacket = () => {};
	onHost = () => {};
	getTime = () => 0;
	constructor(selfId) {
		this.selfId = selfId;
		this.hostId = selfId;
	}
	get auth() {
		return this.hostId === this.selfId;
	}
	async start(room, name) {
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
				this.send({
					k: "clock",
					t: this.getTime()
				});
				if (peers.length === 0) {
					this.hostId = this.selfId;
					this.locked = true;
					return;
				}
				if (this.auth) this.onHost();
				this.scheduleElect();
			},
			onMessage: (from, data) => {
				if (data && typeof data === "object" && data.k === "clock") {
					const t = data.t;
					if (typeof t === "number") this.clocks.set(from, t);
				}
				this.onPacket(from, data);
			}
		});
		this.room = client;
		try {
			await client.join();
			this.status = "live";
		} catch {
			this.status = "failed";
		}
	}
	scheduleElect() {
		if (this.electTimer) clearTimeout(this.electTimer);
		this.electTimer = setTimeout(() => this.elect(), 450);
	}
	elect() {
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
			if (t > bestTime + .35 || Math.abs(t - bestTime) <= .35 && id < best) {
				best = id;
				bestTime = t;
			}
		}
		this.hostId = best;
		this.locked = true;
		if (this.auth) this.onHost();
	}
	offerFull(to) {
		const now = Date.now();
		if (now - (this.fullAt.get(to) ?? 0) < 1500) return;
		this.fullAt.set(to, now);
		this.onHost();
		this.send({
			k: "need-full",
			to
		}, to);
	}
	send(data, to) {
		this.room?.send(data, to);
	}
	broadcast(data) {
		this.room?.broadcast(data);
	}
	close() {
		if (this.electTimer) clearTimeout(this.electTimer);
		this.room?.close();
		this.room = null;
		this.peers = [];
		this.status = "offline";
	}
};
var SeaAudio = class {
	ctx = null;
	master = null;
	music = null;
	sfx = null;
	noise = null;
	nextNote = 0;
	o2Mark = -1;
	muted = false;
	unlock() {
		if (!this.ctx) {
			const ctx = new AudioContext({ latencyHint: "interactive" });
			this.ctx = ctx;
			this.master = ctx.createGain();
			this.music = ctx.createGain();
			this.sfx = ctx.createGain();
			this.music.gain.value = .22;
			this.sfx.gain.value = .5;
			this.master.gain.value = this.muted ? 0 : 1;
			this.music.connect(this.master);
			this.sfx.connect(this.master);
			this.master.connect(ctx.destination);
			const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * .35), ctx.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
			this.noise = buffer;
		}
		if (this.ctx.state === "suspended") this.ctx.resume();
	}
	setMuted(muted) {
		this.muted = muted;
		if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, .03);
	}
	tone(freq, dur, type, gain, bus) {
		if (!this.ctx || !this.master || this.muted) return;
		const osc = this.ctx.createOscillator();
		const amp = this.ctx.createGain();
		osc.type = type;
		osc.frequency.value = freq;
		amp.gain.setValueAtTime(Math.max(1e-4, gain), this.ctx.currentTime);
		amp.gain.exponentialRampToValueAtTime(1e-4, this.ctx.currentTime + dur);
		osc.connect(amp);
		amp.connect(bus === "music" ? this.music : this.sfx);
		osc.start();
		osc.stop(this.ctx.currentTime + dur + .02);
	}
	burst(dur, gain) {
		if (!this.ctx || !this.noise || !this.sfx || this.muted) return;
		const src = this.ctx.createBufferSource();
		src.buffer = this.noise;
		const filter = this.ctx.createBiquadFilter();
		filter.type = "bandpass";
		filter.frequency.value = 420;
		const amp = this.ctx.createGain();
		amp.gain.setValueAtTime(gain, this.ctx.currentTime);
		amp.gain.exponentialRampToValueAtTime(1e-4, this.ctx.currentTime + dur);
		src.connect(filter);
		filter.connect(amp);
		amp.connect(this.sfx);
		src.start();
		src.stop(this.ctx.currentTime + dur);
	}
	tick(time, combat) {
		if (!this.ctx || this.muted) return;
		if (this.ctx.currentTime < this.nextNote) return;
		const scale = [
			73.42,
			87.31,
			98,
			110,
			130.81,
			146.83
		];
		const note = scale[Math.floor(time * (combat ? 2 : .5)) % scale.length] ?? 98;
		this.tone(combat ? note : note / 2, combat ? .2 : 1.1, combat ? "triangle" : "sine", combat ? .045 : .028, "music");
		this.tone(55, 1.6, "sine", .035, "music");
		this.nextNote = this.ctx.currentTime + (combat ? .38 : 1.5);
	}
	react(events, o2, time) {
		if (events.includes("shot")) this.tone(520, .07, "square", .035, "sfx");
		if (events.includes("torpedo")) this.burst(.18, .22);
		if (events.includes("hit") || events.includes("hull")) this.tone(96, .14, "sawtooth", .05, "sfx");
		if (events.includes("hypoxia") || events.includes("bosswarn")) this.tone(156, .28, "sawtooth", .05, "sfx");
		if (events.includes("warn")) this.tone(210, .12, "triangle", .04, "sfx");
		if (events.includes("open")) this.tone(320, .16, "sine", .04, "sfx");
		if (events.includes("board") || events.includes("repair") || events.includes("shield")) this.tone(180, .09, "triangle", .05, "sfx");
		if (events.includes("pickup") || events.includes("upgrade")) this.tone(690, .09, "sine", .05, "sfx");
		if (events.includes("destroy") || events.includes("victory")) this.burst(.35, .28);
		if (events.includes("region")) this.tone(240, .2, "sine", .04, "sfx");
		if (o2 > 0 && o2 < 30) {
			const mark = Math.floor(time * 1.5);
			if (mark !== this.o2Mark) {
				this.o2Mark = mark;
				this.tone(860, .05, "square", .04, "sfx");
			}
		}
	}
};
var DIVER_TOKEN = "abyssal-diver-v1";
async function post(body) {
	const response = await fetch("/api/ocean", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body)
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok || data.ok === false) throw new Error(data.error || "The sea did not answer.");
	return data;
}
var OceanClient = class {
	token = "";
	status = "linking";
	roster = [];
	intent = {
		ax: 0,
		ay: 0,
		aimX: 1,
		aimY: 0,
		fire: false,
		use: false,
		repair: false,
		cycle: false
	};
	onRoster = null;
	sim = null;
	timer = 0;
	sending = false;
	queued = false;
	heard = [];
	callsign = "Unmarked";
	misses = 0;
	async join(sim, callsign) {
		this.sim = sim;
		this.callsign = callsign || "Unmarked";
		const data = await post({
			action: "join",
			token: typeof localStorage !== "undefined" ? localStorage.getItem(DIVER_TOKEN) : null,
			callsign
		});
		if (!data.token || !data.snap) throw new Error("The sea did not answer.");
		this.token = data.token;
		localStorage.setItem(DIVER_TOKEN, data.token);
		this.ingest(sim, data.snap);
		this.status = "live";
		this.timer = window.setInterval(() => void this.flush(), 100);
		return data.token;
	}
	drainEvents() {
		return this.heard.splice(0, this.heard.length);
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
			const data = await post({
				action: "sync",
				token: this.token,
				input
			});
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
				this.flush();
			}
		}
	}
	close() {
		if (this.timer) window.clearInterval(this.timer);
		this.timer = 0;
		this.sim = null;
	}
	async recover() {
		if (!this.sim || !this.token) return;
		try {
			const data = await post({
				action: "join",
				token: this.token,
				callsign: this.callsign
			});
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
	ingest(sim, snap) {
		applyOceanView(sim, this.token, snap);
		this.roster = snap.roster;
		this.heard.push(...snap.events);
		if (this.heard.length > 24) this.heard.splice(0, this.heard.length - 24);
		this.onRoster?.(snap.roster);
	}
};
var PROFILE = "abyssal-profile-v2";
var LEGACY_PROFILE = "abyssal-profile-v1";
var SAVE = "abyssal-save-v1";
function loadProfile() {
	const blank = {
		callsign: "",
		room: `abyss-${Math.random().toString(36).slice(2, 6)}`,
		partner: false,
		soren: false,
		muted: false,
		linkMode: "ocean"
	};
	if (typeof localStorage === "undefined") return blank;
	try {
		const current = localStorage.getItem(PROFILE);
		const raw = current ?? localStorage.getItem(LEGACY_PROFILE);
		if (!raw) return blank;
		const parsed = JSON.parse(raw);
		const fromLegacy = !current;
		const next = {
			...blank,
			...parsed,
			room: parsed.room || blank.room,
			partner: fromLegacy ? false : Boolean(parsed.partner),
			soren: fromLegacy ? false : Boolean(parsed.soren),
			linkMode: parsed.linkMode === "frequency" ? "frequency" : "ocean"
		};
		if (fromLegacy) localStorage.setItem(PROFILE, JSON.stringify(next));
		return next;
	} catch {
		return blank;
	}
}
function saveProfile(profile) {
	localStorage.setItem(PROFILE, JSON.stringify(profile));
}
function hasSave() {
	return typeof localStorage !== "undefined" && !!localStorage.getItem(SAVE);
}
function loadSave() {
	if (typeof localStorage === "undefined") return null;
	try {
		const raw = localStorage.getItem(SAVE);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (parsed.version !== 1) return null;
		return parsed;
	} catch {
		return null;
	}
}
function writeSave(sim, selfId) {
	const you = sim.divers.find((d) => d.id === selfId);
	if (!you) return;
	const file = {
		version: 1,
		time: sim.time,
		you: {
			region: you.region,
			x: you.x,
			y: you.y,
			hp: you.hp,
			o2: you.o2,
			ammo: you.ammo,
			cells: you.cells
		},
		discovered: sim.discovered,
		explored: sim.explored,
		flags: sim.flags,
		taken: sim.pickups.filter((p) => p.taken).map((p) => p.id),
		vehicles: sim.vehicles.map((v) => ({
			id: v.id,
			hull: v.hull,
			energy: v.energy,
			destroyed: v.destroyed,
			region: v.region,
			x: v.x,
			y: v.y
		})),
		creatures: sim.creatures.map((c) => ({
			id: c.id,
			hp: c.hp,
			alive: c.alive,
			x: c.x,
			y: c.y
		}))
	};
	localStorage.setItem(SAVE, JSON.stringify(file));
}
function clearSave() {
	localStorage.removeItem(SAVE);
}
function applySave(sim, selfId, file) {
	sim.time = file.time;
	sim.discovered = [...file.discovered];
	sim.flags = {
		...sim.flags,
		...file.flags
	};
	for (const id of Object.keys(sim.explored)) {
		const incoming = file.explored?.[id];
		if (!incoming) continue;
		const next = sim.explored[id].slice();
		for (let i = 0; i < Math.min(next.length, incoming.length); i += 1) next[i] = incoming[i] ? 1 : 0;
		sim.explored[id] = next;
	}
	for (const id of file.taken) {
		const p = sim.pickups.find((item) => item.id === id);
		if (p) p.taken = true;
	}
	for (const snap of file.vehicles) {
		const v = sim.vehicles.find((item) => item.id === snap.id);
		if (!v) continue;
		v.hull = snap.hull;
		v.energy = snap.energy;
		v.destroyed = snap.destroyed;
		v.region = snap.region;
		v.x = snap.x;
		v.y = snap.y;
		v.netX = snap.x;
		v.netY = snap.y;
	}
	for (const snap of file.creatures) {
		const c = sim.creatures.find((item) => item.id === snap.id);
		if (!c) continue;
		c.hp = snap.hp;
		c.alive = snap.alive;
		c.x = snap.x;
		c.y = snap.y;
		c.netX = snap.x;
		c.netY = snap.y;
	}
	const you = sim.divers.find((d) => d.id === selfId);
	if (!you) return;
	you.region = file.you.region;
	you.x = file.you.x;
	you.y = file.you.y;
	you.netX = file.you.x;
	you.netY = file.you.y;
	you.hp = file.you.hp;
	you.o2 = file.you.o2;
	you.ammo = file.you.ammo;
	you.cells = file.you.cells;
	you.beaconRegion = file.you.region;
	you.beaconX = file.you.x;
	you.beaconY = file.you.y;
	you.alive = you.hp > 0;
}
function loadArt() {
	const load = (src) => {
		const img = new Image();
		img.src = src;
		return img;
	};
	return {
		diver: load("/sprites/diver.png"),
		eel: load("/sprites/eel.png"),
		maw: load("/sprites/maw.png"),
		kite: load("/sprites/kite.png"),
		scooter: load("/sprites/scooter.png"),
		darter: load("/sprites/darter.png"),
		torpedo: load("/sprites/torpedo.png"),
		props: load("/sprites/props.png"),
		barrow: load("/sprites/barrow.png"),
		sentry: load("/sprites/sentry.png"),
		bloom: load("/sprites/bloom.png"),
		breach: load("/bg/breach.jpg"),
		plains: load("/bg/plains.jpg"),
		city: load("/bg/city.jpg"),
		works: load("/bg/works.jpg"),
		reef: load("/bg/reef.jpg")
	};
}
function ready(img) {
	return img.complete && img.naturalWidth > 0;
}
function blit(ctx, img, cols, rows, frame, x, y, w, h, flip) {
	if (!ready(img)) return;
	const fw = img.width / cols;
	const fh = img.height / rows;
	const sx = frame % cols * fw;
	const sy = Math.floor(frame / cols) * fh;
	ctx.save();
	ctx.translate(Math.round(x), Math.round(y));
	if (flip) ctx.scale(-1, 1);
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(img, sx, sy, fw, fh, Math.round(-w / 2), Math.round(-h / 2), w, h);
	ctx.restore();
}
function screen(camX, camY, x, y) {
	return {
		x: x - camX,
		y: y - camY
	};
}
function drawSea(ctx, sim, camX, camY, art, regionId, bubbles, focusId) {
	const region = sim.regions[regionId];
	ctx.imageSmoothingEnabled = false;
	ctx.fillStyle = "#041016";
	ctx.fillRect(0, 0, 512, 288);
	const bg = regionId === "breach" ? art.breach : regionId === "city" ? art.city : regionId === "works" ? art.works : regionId === "reef" ? art.reef : art.plains;
	if (ready(bg)) {
		const w = 691.2;
		const shift = -(camX * .22 % w);
		ctx.drawImage(bg, shift, 0, w, 288);
		ctx.drawImage(bg, shift + w, 0, w, 288);
		ctx.fillStyle = "rgba(2, 8, 12, 0.38)";
		ctx.fillRect(0, 0, 512, 288);
	}
	const x0 = Math.max(0, Math.floor(camX / 32) - 1);
	const x1 = Math.min(region.w - 1, Math.ceil((camX + 512) / 32) + 1);
	const y0 = Math.max(0, Math.floor(camY / 32) - 1);
	const y1 = Math.min(region.h - 1, Math.ceil((camY + 288) / 32) + 1);
	for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
		const t = region.tiles[ty * region.w + tx] ?? 0;
		const x = tx * 32 - camX;
		const y = ty * 32 - camY;
		if (t === 1 || t === 8 && !sim.flags.mawDead) {
			const n = tx * 13 + ty * 7 & 3;
			ctx.fillStyle = n === 0 ? "#10262c" : n === 1 ? "#0c1e24" : n === 2 ? "#16323a" : "#0a181c";
			ctx.fillRect(x, y, 32, 32);
			ctx.fillStyle = "rgba(62, 224, 197, 0.18)";
			ctx.fillRect(x, y, 32, 2);
			if ((tx + ty) % 5 === 0) {
				ctx.fillStyle = "#e7a04a";
				ctx.fillRect(x + 6, y + 8, 2, 2);
			}
		} else if (t === 2 && Math.sin(sim.time * 18 + tx) > .2) {
			ctx.strokeStyle = "rgba(231, 160, 74, 0.85)";
			ctx.strokeRect(x + 4, y + 4, 24, 24);
		} else if (t === 3) {
			ctx.strokeStyle = "rgba(62, 224, 197, 0.45)";
			ctx.beginPath();
			const sway = Math.sin(sim.time * 2 + tx) * 4;
			ctx.moveTo(x + 16, y + 32);
			ctx.quadraticCurveTo(x + sway, y + 8, x + 16 + sway, y);
			ctx.stroke();
		} else if (t === 4 || t === 5) {
			ctx.fillStyle = "rgba(62, 224, 197, 0.08)";
			ctx.fillRect(x, y + 12, 32, 4);
		} else if (t === 6) {
			ctx.fillStyle = "rgba(231, 160, 74, 0.18)";
			ctx.fillRect(x + 12, y + 6 + sim.time * 24 % 16, 8, 10);
		} else if (t === 7 && Math.sin(sim.time * 3 + tx) > 0) {
			ctx.fillStyle = "rgba(210, 180, 60, 0.45)";
			ctx.fillRect(x + 8, y + 10, 4, 4);
			ctx.fillRect(x + 18, y + 18, 3, 3);
		} else if (t === 8 && sim.flags.mawDead) {
			ctx.fillStyle = "rgba(231, 160, 74, 0.15)";
			ctx.fillRect(x, y, 32, 32);
		} else if (t === 9) {
			ctx.fillStyle = "#1a120c";
			ctx.fillRect(x, y, 32, 32);
			ctx.strokeStyle = "rgba(231, 160, 74, 0.7)";
			ctx.strokeRect(x + 4, y + 4, 24, 24);
		}
	}
	for (const marker of sim.markers) {
		if (marker.region !== regionId) continue;
		const p = screen(camX, camY, marker.x, marker.y);
		if (marker.kind === "lore") blit(ctx, art.props, 2, 2, 3, p.x, p.y, 36, 36, false);
		else {
			ctx.strokeStyle = marker.kind === "upgrade" ? "#e7a04a" : "#3ee0c5";
			ctx.strokeRect(p.x - 10, p.y - 10, 20, 20);
		}
	}
	for (const pickup of sim.pickups) {
		if (pickup.taken || pickup.region !== regionId) continue;
		const p = screen(camX, camY, pickup.x, pickup.y);
		const frame = pickup.kind === "o2" ? 0 : pickup.kind === "med" ? 1 : pickup.kind === "ammo" ? 2 : 0;
		const bob = Math.sin(sim.time * 2 + pickup.x) * 2;
		blit(ctx, art.props, 2, 2, frame, p.x, p.y + bob, 28, 28, false);
	}
	for (const vehicle of sim.vehicles) {
		if (vehicle.region !== regionId) continue;
		drawVehicle(ctx, art, vehicle, camX, camY, sim.time);
	}
	for (const creature of sim.creatures) {
		if (!creature.alive || creature.region !== regionId) continue;
		drawCreature(ctx, art, creature, camX, camY, sim.time);
	}
	for (const shot of sim.projectiles) {
		if (shot.region !== regionId) continue;
		const p = screen(camX, camY, shot.x, shot.y);
		ctx.save();
		ctx.translate(p.x, p.y);
		ctx.rotate(Math.atan2(shot.vy, shot.vx));
		if (shot.kind === "torpedo") blit(ctx, art.torpedo, 2, 2, Math.floor(sim.time * 10) % 4, 0, 0, 30, 12, false);
		else {
			ctx.fillStyle = shot.team === "wild" ? "#e7a04a" : "#e6f1ee";
			ctx.fillRect(-6, -1, 12, 2);
		}
		ctx.restore();
	}
	for (const diver of sim.divers) {
		if (diver.region !== regionId || !diver.alive) continue;
		drawDiver(ctx, art, diver, camX, camY, sim.time, diver.id === focusId);
	}
	for (const bubble of bubbles) {
		const p = screen(camX, camY, bubble.x, bubble.y);
		ctx.strokeStyle = `rgba(230, 241, 238, ${Math.max(0, bubble.life)})`;
		ctx.strokeRect(p.x, p.y, bubble.r, bubble.r);
	}
	const you = sim.divers.find((d) => d.id === focusId);
	if (you && you.region === regionId) {
		const p = screen(camX, camY, you.x, you.y);
		const glow = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 150);
		glow.addColorStop(0, "rgba(62, 224, 197, 0.18)");
		glow.addColorStop(1, "rgba(2, 8, 12, 0)");
		ctx.fillStyle = glow;
		ctx.fillRect(0, 0, 512, 288);
	}
	const maw = sim.creatures.find((c) => c.kind === "maw" && c.alive && c.region === regionId && c.aggro);
	if (maw && (maw.state === "warn" || maw.state === "open")) {
		const p = screen(camX, camY, maw.x, maw.y);
		ctx.strokeStyle = maw.state === "open" ? "rgba(231, 160, 74, 0.9)" : "rgba(62, 224, 197, 0.7)";
		ctx.beginPath();
		const m = Math.hypot(maw.aimX, maw.aimY) || 1;
		ctx.moveTo(p.x, p.y);
		ctx.lineTo(p.x + maw.aimX / m * 70, p.y + maw.aimY / m * 50);
		ctx.stroke();
		if (maw.state === "open") {
			ctx.fillStyle = "rgba(231, 160, 74, 0.85)";
			ctx.font = "10px Outfit, sans-serif";
			ctx.fillText("OPEN", p.x - 16, p.y - 28);
		}
	}
	for (const sentry of sim.creatures) {
		if (!sentry.alive || sentry.region !== regionId || sentry.kind !== "sentry" || sentry.state !== "warn") continue;
		const p = screen(camX, camY, sentry.x, sentry.y);
		const m = Math.hypot(sentry.aimX, sentry.aimY) || 1;
		ctx.strokeStyle = "rgba(231, 160, 74, 0.85)";
		ctx.beginPath();
		ctx.moveTo(p.x, p.y);
		ctx.lineTo(p.x + sentry.aimX / m * 64, p.y + sentry.aimY / m * 48);
		ctx.stroke();
	}
	for (const bloom of sim.creatures) {
		if (!bloom.alive || bloom.region !== regionId || bloom.kind !== "bloom") continue;
		if (bloom.state !== "warn" && bloom.state !== "pulse") continue;
		const p = screen(camX, camY, bloom.x, bloom.y);
		ctx.strokeStyle = bloom.state === "pulse" ? "rgba(231, 160, 74, 0.9)" : "rgba(62, 224, 197, 0.55)";
		ctx.strokeRect(p.x - 28, p.y - 22, 56, 44);
	}
	ctx.fillStyle = "rgba(2, 8, 12, 0.45)";
	ctx.fillRect(0, 0, 512, 18);
	ctx.fillRect(0, 266, 512, 22);
}
function drawVehicle(ctx, art, vehicle, camX, camY, time) {
	const p = screen(camX, camY, vehicle.x, vehicle.y);
	const stage = hullStage(vehicle);
	ctx.save();
	if (stage >= 2) ctx.globalAlpha = .85;
	if (vehicle.destroyed) ctx.globalAlpha = .55;
	if (vehicle.kind === "barrow") blit(ctx, art.barrow, 1, 1, 0, p.x, p.y, 176, 72, vehicle.facing < 0);
	else if (vehicle.kind === "kite") blit(ctx, art.kite, 1, 1, 0, p.x, p.y, 148, 78, vehicle.facing < 0);
	else blit(ctx, art.scooter, 1, 1, 0, p.x, p.y, 64, 32, vehicle.facing < 0);
	ctx.restore();
	if (vehicle.shield > 0) {
		ctx.strokeStyle = "rgba(62, 224, 197, 0.9)";
		ctx.strokeRect(p.x - 78, p.y - 28, 156, 56);
	}
	if (stage >= 1 && !vehicle.destroyed && Math.sin(time * 20) > 0) {
		ctx.fillStyle = "#e7a04a";
		ctx.fillRect(p.x + 10, p.y - 8, 3, 3);
	}
}
function drawCreature(ctx, art, creature, camX, camY, time) {
	const p = screen(camX, camY, creature.x, creature.y);
	const flip = creature.facing < 0;
	const frame = creature.kind === "maw" ? creature.state === "warn" ? 1 : creature.state === "dash" || creature.state === "open" ? 2 : Math.floor(time * 3) % 2 === 0 ? 0 : 3 : creature.state === "lunge" ? 2 : creature.state === "warn" ? 1 : Math.floor(time * 4 + creature.x) % 4;
	ctx.save();
	if (creature.hurt > 0) ctx.filter = "brightness(2)";
	if (creature.kind === "darter") blit(ctx, art.darter, 2, 2, frame % 4, p.x, p.y, 36, 18, flip);
	else if (creature.kind === "sentry") blit(ctx, art.sentry, 2, 2, frame % 4, p.x, p.y, 48, 36, flip);
	else if (creature.kind === "bloom") blit(ctx, art.bloom, 2, 2, Math.floor(time * 3) % 4, p.x, p.y, 64, 56, flip);
	else if (creature.kind === "eel") blit(ctx, art.eel, 2, 2, frame % 4, p.x, p.y, 78, 36, flip);
	else if (creature.kind === "hunter") {
		ctx.filter = creature.hurt > 0 ? "brightness(2)" : "hue-rotate(-18deg) saturate(1.3)";
		blit(ctx, art.eel, 2, 2, frame % 4, p.x, p.y, 104, 48, flip);
	} else blit(ctx, art.maw, 2, 2, frame % 4, p.x, p.y, 196, 104, flip);
	ctx.restore();
	if (creature.kind !== "darter") {
		const w = creature.kind === "maw" ? 70 : 28;
		ctx.fillStyle = "rgba(2,8,12,0.7)";
		ctx.fillRect(p.x - w / 2, p.y - (creature.kind === "maw" ? 58 : 28), w, 3);
		ctx.fillStyle = creature.kind === "maw" && creature.state === "open" ? "#e7a04a" : "#c4553a";
		ctx.fillRect(p.x - w / 2, p.y - (creature.kind === "maw" ? 58 : 28), w * Math.max(0, creature.hp / creature.hpMax), 3);
	}
}
function drawDiver(ctx, art, diver, camX, camY, time, focus) {
	const p = screen(camX, camY, diver.x, diver.y);
	const frame = Math.floor(time * 6) % 4;
	ctx.save();
	if (diver.iframe > 0 && Math.sin(time * 40) > 0) ctx.globalAlpha = .45;
	if (diver.tint === "partner") ctx.filter = "hue-rotate(200deg) saturate(0.9)";
	else if (diver.tint === "ai") ctx.filter = "hue-rotate(35deg) saturate(1.15)";
	else if (diver.tint === "remote") ctx.filter = "hue-rotate(90deg)";
	if (!diver.vehicleId) blit(ctx, art.diver, 2, 2, frame, p.x, p.y, 72, 50, diver.facing < 0);
	else blit(ctx, art.diver, 2, 2, frame, p.x, p.y - 6, 28, 20, diver.facing < 0);
	ctx.restore();
	ctx.fillStyle = focus ? "#3ee0c5" : "#e6f1ee";
	ctx.font = "10px Outfit, sans-serif";
	ctx.textAlign = "center";
	ctx.fillText(diver.name, p.x, p.y - (diver.vehicleId ? 22 : 28));
	ctx.textAlign = "left";
	if (focus) {
		const m = Math.hypot(diver.aimX, diver.aimY) || 1;
		const ax = diver.aimX / m;
		const ay = diver.aimY / m;
		ctx.strokeStyle = "#3ee0c5";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(p.x + ax * 14, p.y + ay * 12);
		ctx.lineTo(p.x + ax * 26, p.y + ay * 22);
		ctx.stroke();
	}
}
var BLANK_PROFILE = {
	callsign: "",
	room: "abyss",
	partner: false,
	soren: false,
	muted: false,
	linkMode: "ocean"
};
function makeId() {
	return `d${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}
function cleanRoom(value) {
	return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "abyss";
}
function held(session, code) {
	return session.keys.has(code) || session.probe.has(code);
}
function edge(session, code) {
	const down = held(session, code);
	const was = session.prev.has(code);
	if (down) session.prev.add(code);
	else session.prev.delete(code);
	return down && !was;
}
function axes(session, left, right, up, down) {
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
	return {
		ax,
		ay
	};
}
function installProbe(session) {
	window.__controlsTest = {
		getYaw: () => {
			const v = velocityOf(session.sim, session.selfId);
			return Math.atan2(-v.vy, v.vx);
		},
		getSpeed: () => {
			const v = velocityOf(session.sim, session.selfId);
			return Math.hypot(v.vx, v.vy);
		},
		setKeys: (codes) => {
			session.probe.clear();
			for (const code of codes) session.probe.add(code);
		},
		setSteer: (v) => {
			const you = findDiver(session.sim, session.selfId);
			if (you) you.ax = -v;
		}
	};
	window.__abyssal = {
		nearby: () => {
			const youNow = findDiver(session.sim, session.selfId);
			if (!youNow) return [];
			return session.sim.divers.filter((diver) => diver.alive && diver.id !== session.selfId && diver.region === youNow.region).map((diver) => diver.name);
		},
		warp: (x, y, region) => {
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
				sy: Math.round(diver.netY)
			};
		},
		world: () => {
			const diver = findDiver(session.sim, session.selfId);
			return {
				explored: Object.values(session.sim.explored).reduce((sum, row) => sum + row.reduce((n, cell) => n + (cell ? 1 : 0), 0), 0),
				seen: [...session.sim.discovered],
				others: session.sim.divers.filter((other) => other.alive && other.id !== session.selfId).map((other) => ({
					name: other.name,
					x: Math.round(other.x),
					y: Math.round(other.y),
					hp: Math.round(other.hp),
					o2: Math.round(other.o2),
					region: other.region,
					seat: other.seat,
					vehicle: other.vehicleId
				})),
				creatures: session.sim.creatures.filter((creature) => creature.alive && (!diver || creature.region === diver.region)).map((creature) => ({
					id: creature.id,
					kind: creature.kind,
					hp: Math.round(creature.hp),
					x: Math.round(creature.x),
					y: Math.round(creature.y)
				})),
				roster: (session.ocean?.roster ?? []).filter((row) => row.state === "live").map((row) => ({
					id: row.id,
					divers: row.divers.map((entry) => entry.name)
				}))
			};
		},
		drive: (ax, ay, fire, aimX, aimY) => {
			if (!session.ocean) return;
			const aimYaw = aimX ?? (ax === 0 ? 1 : ax);
			const aimPitch = aimY ?? ay;
			session.hold = {
				ax,
				ay,
				fire,
				aimX: aimYaw,
				aimY: aimPitch
			};
			session.ocean.intent.ax = ax;
			session.ocean.intent.ay = ay;
			session.ocean.intent.aimX = aimYaw;
			session.ocean.intent.aimY = aimPitch;
			session.ocean.intent.fire = fire;
			session.ocean.flush();
		},
		tap: (kind) => {
			if (!session.ocean) return;
			if (kind === "use") session.ocean.intent.use = true;
			if (kind === "repair") session.ocean.intent.repair = true;
			if (kind === "cycle") session.ocean.intent.cycle = true;
			session.ocean.flush();
		}
	};
}
function applyInput(session) {
	const you = findDiver(session.sim, session.selfId);
	if (!you) return;
	if (edge(session, "Escape")) session.overlay = session.overlay === "pause" ? "none" : "pause";
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
		partner.aimY = partner.ay * .35;
	}
	you.fireLatch = held(session, "Space") || held(session, "KeyF") || session.touch.fire;
	const origin = aimOrigin(session, you);
	if (Math.hypot(session.aimStick.x, session.aimStick.y) > .2) {
		you.aimX = session.aimStick.x;
		you.aimY = session.aimStick.y;
	} else if (session.pointer.on) {
		you.aimX = session.pointer.wx - origin.x;
		you.aimY = session.pointer.wy - origin.y;
		if (Math.hypot(you.aimX, you.aimY) < 8) {
			you.aimX = you.facing;
			you.aimY = you.ay * .35;
		}
	} else {
		you.aimX = you.facing;
		you.aimY = you.ay * .35;
	}
	const useYou = edge(session, "KeyE") || session.touch.use;
	session.touch.use = false;
	if (useYou) {
		if (session.ocean) session.ocean.intent.use = true;
		else if (session.link.auth) pressUse(session.sim, you);
		else session.link.send({
			k: "act",
			id: you.id,
			kind: "use"
		});
	}
	if (edge(session, "KeyR")) {
		if (session.ocean) session.ocean.intent.repair = true;
		else if (session.link.auth) pressRepair(session.sim, you);
		else session.link.send({
			k: "act",
			id: you.id,
			kind: "repair"
		});
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
	const hands = move.ax !== 0 || move.ay !== 0 || session.touch.ax !== 0 || session.touch.ay !== 0 || held(session, "Space") || held(session, "KeyF") || session.touch.fire;
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
function aimOrigin(session, diver) {
	const vehicle = findVehicle(session.sim, diver.vehicleId);
	if (vehicle && !vehicle.destroyed) return {
		x: vehicle.x,
		y: vehicle.y
	};
	return {
		x: diver.x,
		y: diver.y
	};
}
function swapSeats(session, you) {
	if (session.ocean) {
		session.ocean.intent.cycle = true;
		return;
	}
	if (!session.link.auth || !you.seat) return;
	cycleSeat(session.sim, you);
}
function readHud(session) {
	const you = findDiver(session.sim, session.selfId);
	const region = you ? session.sim.regions[you.region] : session.sim.regions.breach;
	const vehicle = you ? findVehicle(session.sim, you.vehicleId) : void 0;
	const maw = you && you.region === "plains" ? session.sim.creatures.find((c) => c.kind === "maw" && c.region === "plains") : void 0;
	const ai = session.sim.divers.find((d) => d.kind === "ai");
	const depth = you ? Math.round(region.depth + you.y / (region.h * 32) * 36) : region.depth;
	return {
		name: you?.name ?? "",
		hp: you?.hp ?? 0,
		o2: you?.o2 ?? 0,
		ammo: you?.ammo ?? 0,
		cells: you?.cells ?? 0,
		region: region.name,
		depth: `${depth} m`,
		objective: objective(session.sim, you),
		seat: you?.seat ? `${vehicle?.kind === "barrow" ? "Barrow" : vehicle?.kind === "kite" ? "Kite" : "Scooter"} · ${you.seat}` : "Swimming",
		hull: vehicle ? vehicle.hull / vehicle.hullMax : 0,
		energy: vehicle ? vehicle.energy / vehicle.energyMax : 0,
		stage: vehicle ? hullStage(vehicle) : 0,
		toasts: session.sim.toasts.map((t) => t.text),
		link: session.ocean ? session.ocean.status === "failed" ? "Signal lost · the beacon holds your dive" : session.ocean.status === "linking" ? "Beacon answering" : session.sim.divers.some((diver) => diver.alive && diver.id !== session.selfId) ? "Shared ocean · another diver is here" : "Shared ocean · alone in this sector" : session.link.status === "live" ? session.link.auth ? "Frequency · you hold the depth" : "Frequency · sharing their depth" : session.link.status === "linking" ? "Linking frequency" : session.link.status === "failed" ? "Frequency offline" : "Frequency",
		peers: session.ocean ? session.sim.divers.filter((diver) => diver.alive && diver.id !== session.selfId).length : session.link.peers.filter((peer) => peer.connectionState === "connected").length,
		boss: maw?.hp ?? 0,
		bossMax: maw?.hpMax ?? 1,
		bossState: maw?.alive ? maw.state : "down",
		dead: !!you && !you.alive,
		hypoxia: !!you && you.o2 <= 0 && you.alive,
		soren: ai ? `${ai.name} · ${ai.order} · ${ai.region === you?.region ? "with you" : ai.region}` : ""
	};
}
function Meter({ label, value, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-28",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-1 flex justify-between text-[10px] tracking-[0.16em] text-mist uppercase",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Math.max(0, Math.round(value)), "%"] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-1.5 bg-deep",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `h-full ${tone === "bio" ? "bg-biolume" : tone === "rust" ? "bg-rust" : "bg-amber"}`,
				style: { width: `${Math.max(0, Math.min(100, value))}%` }
			})
		})]
	});
}
function GameApp() {
	const canvasRef = (0, import_react.useRef)(null);
	const sessionRef = (0, import_react.useRef)(null);
	const [profile, setProfile] = (0, import_react.useState)(BLANK_PROFILE);
	const [mode, setMode] = (0, import_react.useState)("menu");
	const [overlay, setOverlay] = (0, import_react.useState)("none");
	const [hud, setHud] = (0, import_react.useState)(null);
	const [resumeOk, setResumeOk] = (0, import_react.useState)(false);
	const [narrow, setNarrow] = (0, import_react.useState)(false);
	const [roster, setRoster] = (0, import_react.useState)(null);
	const [fault, setFault] = (0, import_react.useState)("");
	const [heldBeacon, setHeldBeacon] = (0, import_react.useState)(false);
	const diving = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		setProfile(loadProfile());
		setResumeOk(hasSave());
		setHeldBeacon(typeof localStorage !== "undefined" && !!localStorage.getItem("abyssal-diver-v1"));
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
	(0, import_react.useEffect)(() => {
		if (mode !== "menu") return;
		let stop = false;
		const pull = async () => {
			try {
				const data = await (await fetch("/api/ocean", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ action: "roster" })
				})).json();
				if (!stop && data.ok && data.roster) setRoster(data.roster);
			} catch {}
		};
		pull();
		const id = window.setInterval(() => void pull(), 2e3);
		return () => {
			stop = true;
			window.clearInterval(id);
		};
	}, [mode]);
	(0, import_react.useEffect)(() => {
		const down = (event) => {
			const session = sessionRef.current;
			if (!session || session.mode !== "play") return;
			if ([
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight",
				"Space",
				"Tab"
			].includes(event.code)) event.preventDefault();
			session.keys.add(event.code);
		};
		const up = (event) => sessionRef.current?.keys.delete(event.code);
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
	(0, import_react.useEffect)(() => {
		if (mode !== "play") return;
		let raf = 0;
		let last = performance.now();
		let simAcc = 0;
		const frame = (now) => {
			const session = sessionRef.current;
			const canvas = canvasRef.current;
			if (!session || !canvas) {
				raf = requestAnimationFrame(frame);
				return;
			}
			const frameDt = Math.min(.1, (now - last) / 1e3);
			last = now;
			session.hudAcc += frameDt;
			session.netAcc += frameDt;
			session.saveAcc += frameDt;
			applyInput(session);
			const paused = session.overlay === "map" || session.overlay === "journal" || session.overlay === "pause";
			if (session.ocean) {
				if (!paused) glideOcean(session.sim, frameDt);
				const heard = session.ocean.drainEvents();
				if (heard.some((event) => event === "hit" || event === "impact" || event === "hull" || event === "torpedo")) session.sim.shake = Math.max(session.sim.shake, 6);
				session.sim.shake = Math.max(0, session.sim.shake - frameDt * 18);
				const combat = session.sim.creatures.some((c) => c.alive && c.region === findDiver(session.sim, session.selfId)?.region && c.state !== "patrol" && c.kind !== "darter");
				session.audio.tick(session.sim.time, combat);
				const youNow = findDiver(session.sim, session.selfId);
				session.audio.react(heard, youNow?.o2 ?? 100, session.sim.time);
				if (youNow?.alive && Math.random() < .35) session.bubbles.push({
					x: youNow.x - youNow.facing * 8,
					y: youNow.y,
					r: 2 + Math.random() * 2,
					life: 1,
					vy: -18
				});
			} else if (!paused) {
				simAcc += frameDt;
				const heard = [];
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
				if (simAcc > .2) simAcc = 0;
				const combat = session.sim.creatures.some((c) => c.alive && c.state !== "patrol" && c.kind !== "darter");
				session.audio.tick(session.sim.time, combat);
				const youNow = findDiver(session.sim, session.selfId);
				session.audio.react(heard, youNow?.o2 ?? 100, session.sim.time);
				if (youNow?.alive && Math.random() < .35) session.bubbles.push({
					x: youNow.x - youNow.facing * 8,
					y: youNow.y,
					r: 2 + Math.random() * 2,
					life: 1,
					vy: -18
				});
			}
			if (!session.ocean && session.netAcc > .09) {
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
						tint: d.tint
					}))
				});
				if (session.link.auth) session.link.broadcast({
					k: "snap",
					world: exportWorld(session.sim)
				});
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
					session.camX = you.x - 230.4;
					session.camY = you.y - 144;
				}
				session.seenRegion = you.region;
				const look = you.facing === 1 ? .38 : .62;
				const tx = you.x - 512 * look;
				const ty = you.y - 144;
				const region = session.sim.regions[you.region];
				const maxX = Math.max(0, region.w * 32 - 512);
				const maxY = Math.max(0, region.h * 32 - 288);
				session.camX += (Math.max(0, Math.min(maxX, tx)) - session.camX) * Math.min(1, frameDt * 5);
				session.camY += (Math.max(0, Math.min(maxY, ty)) - session.camY) * Math.min(1, frameDt * 5);
				if (you.alive && session.overlay === "dead") session.overlay = "none";
				if (!you.alive && session.overlay === "none") session.overlay = "dead";
			}
			const ctx = canvas.getContext("2d");
			if (ctx && you) {
				const shake = session.reduced ? 0 : session.sim.shake;
				ctx.save();
				ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
				drawSea(ctx, session.sim, Math.round(session.camX), Math.round(session.camY), session.art, you.region, session.bubbles, session.selfId);
				ctx.restore();
			}
			if (session.hudAcc > .12) {
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
		const audio = sessionRef.current?.audio ?? new SeaAudio();
		audio.unlock();
		audio.setMuted(profile.muted);
		const name = profile.callsign.trim() || "Unmarked";
		const sim = createSim({
			selfId: "pending",
			name,
			partner: false,
			soren: false,
			crew: false
		});
		const ocean = new OceanClient();
		ocean.onRoster = (rows) => setRoster(rows);
		try {
			const token = await ocean.join(sim, name);
			const session = {
				sim,
				selfId: token,
				keys: /* @__PURE__ */ new Set(),
				probe: /* @__PURE__ */ new Set(),
				prev: /* @__PURE__ */ new Set(),
				link: new DescentLink(token),
				audio,
				art: loadArt(),
				overlay: "none",
				touch: {
					ax: 0,
					ay: 0,
					fire: false,
					use: false
				},
				aimStick: {
					x: 0,
					y: 0
				},
				pointer: {
					wx: 0,
					wy: 0,
					on: false
				},
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
				hold: null
			};
			const you = findDiver(sim, token);
			if (you) {
				session.camX = you.x - 230.4;
				session.camY = you.y - 144;
				session.seenRegion = you.region;
			}
			sessionRef.current = session;
			installProbe(session);
			saveProfile({
				...profile,
				linkMode: "ocean",
				partner: false,
				soren: false
			});
			setHeldBeacon(true);
			setMode("play");
			setOverlay("none");
			setHud(readHud(session));
		} catch (err) {
			ocean.close();
			setFault(err instanceof Error ? err.message : "The sea did not answer.");
		} finally {
			diving.current = false;
		}
	}
	function begin(resume) {
		const audio = sessionRef.current?.audio ?? new SeaAudio();
		audio.unlock();
		audio.setMuted(profile.muted);
		const selfId = makeId();
		const sim = createSim({
			selfId,
			name: profile.callsign.trim() || "Unmarked",
			partner: profile.partner,
			soren: profile.soren
		});
		if (resume) {
			const file = loadSave();
			if (file) applySave(sim, selfId, file);
		} else clearSave();
		const link = new DescentLink(selfId);
		link.getTime = () => sim.time;
		link.onHost = () => {
			link.broadcast({
				k: "snap",
				world: exportWorld(sim)
			});
		};
		link.onPacket = (_from, data) => {
			if (!data || typeof data !== "object") return;
			const msg = data;
			if (msg.k === "clock" && link.auth) link.send({
				k: "full",
				world: exportWorld(sim)
			}, _from);
			if ((msg.k === "full" || msg.k === "snap") && msg.world && !link.auth) importWorld(sim, msg.world, selfId);
			if (msg.k === "own" && Array.isArray(msg.divers)) for (const diver of msg.divers) applyOwn(sim, diver, selfId);
			if (msg.k === "hurt" && msg.id && typeof msg.dmg === "number") {
				if (findDiver(sim, msg.id)?.owner === selfId) hurtDiver(sim, msg.id, msg.dmg);
			}
			if (msg.k === "grant" && msg.id && msg.kind && msg.kind !== "use" && msg.kind !== "repair" && msg.amount) applyGrant(sim, msg.id, msg.kind, msg.amount);
			if (msg.k === "act" && link.auth && msg.id) {
				const diver = findDiver(sim, msg.id);
				if (!diver) return;
				if (msg.kind === "use") pressUse(sim, diver);
				if (msg.kind === "repair") pressRepair(sim, diver);
			}
		};
		const session = {
			sim,
			selfId,
			keys: /* @__PURE__ */ new Set(),
			probe: /* @__PURE__ */ new Set(),
			prev: /* @__PURE__ */ new Set(),
			link,
			audio,
			art: loadArt(),
			overlay: "none",
			touch: {
				ax: 0,
				ay: 0,
				fire: false,
				use: false
			},
			aimStick: {
				x: 0,
				y: 0
			},
			pointer: {
				wx: 0,
				wy: 0,
				on: false
			},
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
			hold: null
		};
		sessionRef.current = session;
		installProbe(session);
		saveProfile({
			...profile,
			linkMode: "frequency"
		});
		link.start(cleanRoom(profile.room), profile.callsign || "Unmarked");
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
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "relative min-h-full overflow-hidden bg-deep text-foam",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/bg/breach.jpg",
					alt: "",
					className: "absolute inset-0 h-full w-full object-cover opacity-45"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-linear-to-r from-deep via-deep/80 to-deep/30" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative mx-auto flex min-h-full max-w-5xl flex-col justify-between gap-8 px-5 py-8 md:px-10 md:py-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "max-w-xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs tracking-[0.28em] text-biolume uppercase",
								children: "Descent 01 · shared depth"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display mt-3 text-5xl leading-none text-foam md:text-7xl",
								children: "Abyssal"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display mt-2 text-2xl text-amber",
								children: "The Last Ascent"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-5 max-w-md text-base leading-relaxed text-mist",
								children: "You come to under the torn grid with the air already leaving. The ocean keeps going when you look away. Another diver is in your sector only when your paths meet. The plains can be burning while the breach stays quiet."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "grid max-w-xl gap-4 border border-line bg-abyss/90 p-4 md:p-5",
						onSubmit: (event) => {
							event.preventDefault();
							beginOcean();
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-mist",
									children: "Callsign"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: form.callsign,
									maxLength: 18,
									placeholder: "Unmarked",
									className: "h-11 border border-line bg-deep px-3 text-foam outline-none focus:border-biolume",
									onChange: (event) => setProfile({
										...form,
										callsign: event.target.value
									})
								})]
							}),
							fault ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-amber",
								children: fault
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-12 bg-biolume px-5 font-medium text-deep",
									onClick: () => void beginOcean(),
									children: heldBeacon ? "Return to your dive" : "Enter the ocean"
								}), heldBeacon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-12 border border-line px-5 text-foam",
									onClick: () => {
										localStorage.removeItem(DIVER_TOKEN);
										setHeldBeacon(false);
									},
									children: "Forget this dive"
								}) : null]
							}),
							roster ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "grid gap-1 text-sm text-mist",
								children: roster.filter((row) => row.state !== "sealed").map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex justify-between gap-3 border-b border-line/70 py-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-foam",
										children: row.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [row.state === "live" ? row.divers.map((diver) => diver.name).join(" · ") : "asleep", row.boss?.alive && row.divers.length ? ` · Maw ${Math.round(row.boss.hp)}` : ""] })]
								}, row.id))
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-mist",
								children: "The shared ocean is listening. Empty sectors stay asleep."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm leading-relaxed text-mist",
								children: "WASD swims. A is left, D is right, W rises, S sinks. The mouse aims. Space fires. E boards. Tab cycles seats — the helm steers, the tube fires, and the sea decides who sits where. A dropped signal opens the seat. Coming back finds you where you were."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
								className: "text-sm text-mist",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
										className: "cursor-pointer text-foam",
										children: "Experimental frequency"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2",
										children: "A browser-to-browser room. Useful for trying a hull together. It is not the ocean, and it forgets the world when the host leaves."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "mt-3 grid gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Frequency" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											value: form.room,
											maxLength: 24,
											className: "h-11 border border-line bg-deep px-3 text-foam outline-none focus:border-biolume",
											onChange: (event) => setProfile({
												...form,
												room: event.target.value
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "mt-3 flex min-h-11 items-center gap-3 text-foam",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: form.partner,
											onChange: (event) => setProfile({
												...form,
												partner: event.target.checked
											})
										}), "Imani on arrow keys"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex min-h-11 items-center gap-3 text-foam",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: form.soren,
											onChange: (event) => setProfile({
												...form,
												soren: event.target.checked
											})
										}), "Soren follows"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex flex-wrap gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "h-11 border border-line px-4 text-foam",
											onClick: () => begin(false),
											children: "Open frequency"
										}), resumeOk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "h-11 border border-line px-4 text-foam",
											onClick: () => begin(true),
											children: "Resume frequency"
										}) : null]
									})
								]
							})
						]
					})]
				})
			]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-full min-h-full overflow-hidden bg-deep text-foam",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 grid place-items-center [container-type:size]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
					ref: canvasRef,
					width: 512,
					height: 288,
					className: "bg-deep",
					style: {
						imageRendering: "pixelated",
						touchAction: "none",
						aspectRatio: `512 / 288`,
						width: "min(100cqw, calc(100cqh * 512 / 288))",
						height: "auto"
					},
					onPointerMove: (event) => pointCanvas(event.clientX, event.clientY),
					onPointerDown: (event) => pointCanvas(event.clientX, event.clientY),
					onPointerLeave: () => {
						const session = sessionRef.current;
						if (session) session.pointer.on = false;
					}
				})
			}),
			hud ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto border border-line bg-deep/80 p-3 backdrop-blur-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] tracking-[0.18em] text-biolume uppercase",
								children: hud.region
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex flex-wrap gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
									label: "Hull of you",
									value: hud.hp,
									tone: "rust"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
									label: hud.hypoxia ? "Hypoxia" : "Air",
									value: hud.o2,
									tone: hud.hypoxia ? "amber" : "bio"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-xs text-mist",
								children: [
									hud.depth,
									" · ",
									hud.seat,
									" · darts ",
									hud.ammo,
									" · cells ",
									hud.cells
								]
							}),
							hud.hull > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
									label: `Vehicle ${hud.stage >= 4 ? "critical" : "hull"}`,
									value: hud.hull * 100,
									tone: "amber"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
									label: "Energy",
									value: hud.energy * 100,
									tone: "bio"
								})]
							}) : null
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto flex items-center gap-2 border border-line bg-deep/80 px-3 py-2 text-xs text-mist",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { className: "size-4 text-biolume" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [hud.link, hud.peers ? ` · ${hud.peers}` : ""] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ml-2 grid size-11 place-items-center text-foam",
								"aria-label": profile?.muted ? "Unmute" : "Mute",
								onClick: () => {
									if (!profile || !sessionRef.current) return;
									const muted = !profile.muted;
									setProfile({
										...profile,
										muted
									});
									sessionRef.current.audio.setMuted(muted);
									saveProfile({
										...profile,
										muted
									});
								},
								children: profile?.muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" })
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto mb-1 max-w-lg text-center",
					children: [
						hud.bossState !== "patrol" && hud.bossState !== "down" && hud.boss > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-2 border border-amber/50 bg-deep/80 px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[10px] tracking-[0.2em] text-amber uppercase",
								children: ["Lantern Maw · ", hud.bossState]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 h-1.5 bg-deep",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full bg-amber",
									style: { width: `${hud.boss / hud.bossMax * 100}%` }
								})
							})]
						}) : null,
						hud.toasts[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "bg-deep/75 px-3 py-2 text-sm text-foam",
							children: hud.toasts[0]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-mist",
							children: hud.objective
						}),
						hud.soren ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] tracking-[0.14em] text-amber uppercase",
							children: hud.soren
						}) : null
					]
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute right-3 bottom-3 flex gap-2 md:right-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "grid size-11 place-items-center border border-line bg-deep/85",
					"aria-label": "Map",
					onClick: () => {
						const session = sessionRef.current;
						if (!session) return;
						session.overlay = session.overlay === "map" ? "none" : "map";
						setOverlay(session.overlay);
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map$1, { className: "size-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "grid size-11 place-items-center border border-line bg-deep/85",
					"aria-label": "Journal",
					onClick: () => {
						const session = sessionRef.current;
						if (!session) return;
						session.overlay = session.overlay === "journal" ? "none" : "journal";
						setOverlay(session.overlay);
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-4" })
				})]
			}),
			narrow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-x-0 bottom-16 flex items-end justify-between gap-2 px-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stick, {
						label: "Move",
						onChange: (ax, ay) => {
							const session = sessionRef.current;
							if (session) {
								session.touch.ax = ax;
								session.touch.ay = ay;
							}
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchButton, {
							label: "Fire",
							onDown: () => flag("fire", true),
							onUp: () => flag("fire", false)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchButton, {
							label: "Board",
							onDown: () => flag("use", true),
							onUp: () => void 0
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stick, {
						label: "Aim",
						onChange: (ax, ay) => {
							const session = sessionRef.current;
							if (session) session.aimStick = {
								x: ax,
								y: ay
							};
						}
					})
				]
			}) : null,
			overlay !== "none" && overlay !== "dead" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "absolute inset-0 grid place-items-center bg-deep/72 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-h-[86%] w-full max-w-3xl overflow-auto border border-line bg-abyss p-5",
					children: [
						overlay === "pause" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-3xl",
								children: "Holding breath"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-4 space-y-1 text-sm text-mist",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "WASD swim or helm. A left, D right. W rises, S sinks." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The mouse aims. On a phone the right stick aims. The tick is the shot." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Space harpoon or torpedo. E board or exit. R repair with a cell." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Arrows and L are Imani, if she launched with you. V holds Soren in this sector." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Tab cycles seats. The helm steers. The tube fires. The pumps brace. The sea keeps the booking." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "If your signal drops, the seat opens. Coming back puts you where you left the water." })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 flex gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-11 bg-biolume px-4 text-deep",
									onClick: () => {
										if (sessionRef.current) sessionRef.current.overlay = "none";
										setOverlay("none");
									},
									children: "Continue"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-11 border border-line px-4",
									onClick: leave,
									children: "Surface to menu"
								})]
							})
						] }) : null,
						overlay === "map" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-6",
							children: [sessionRef.current?.ocean ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StageMap, {
								roster,
								flags: sessionRef.current.sim.flags,
								explored: sessionRef.current.sim.explored,
								here: findDiver(sessionRef.current.sim, sessionRef.current.selfId)?.region
							}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chart, {
								sim: sessionRef.current?.sim,
								selfId: sessionRef.current?.selfId ?? ""
							})]
						}) : null,
						overlay === "journal" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Journal, { sim: sessionRef.current?.sim }) : null
					]
				})
			}) : null,
			overlay === "dead" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "absolute inset-0 grid place-items-center bg-deep/70",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border border-line bg-abyss px-6 py-5 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Anchor, { className: "mx-auto size-6 text-amber" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display mt-2 text-3xl",
							children: "Blackout"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-mist",
							children: "The beacon is pulling you back. Discoveries stay."
						})
					]
				})
			}) : null
		]
	});
	function pointCanvas(clientX, clientY) {
		const session = sessionRef.current;
		const canvas = canvasRef.current;
		if (!session || !canvas) return;
		const rect = canvas.getBoundingClientRect();
		if (rect.width < 2 || rect.height < 2) return;
		const sx = (clientX - rect.left) / rect.width * 512;
		const sy = (clientY - rect.top) / rect.height * 288;
		session.pointer.wx = sx + session.camX;
		session.pointer.wy = sy + session.camY;
		session.pointer.on = true;
	}
	function flag(key, value) {
		const session = sessionRef.current;
		if (!session) return;
		session.touch[key] = value;
	}
}
function TouchButton({ label, onDown, onUp }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "h-12 min-w-16 border border-line bg-deep/85 px-3 text-xs tracking-wide text-foam uppercase",
		onPointerDown: (event) => {
			event.preventDefault();
			onDown();
		},
		onPointerUp: onUp,
		onPointerLeave: onUp,
		children: label
	});
}
function Stick({ label, onChange }) {
	const ref = (0, import_react.useRef)(null);
	const [knob, setKnob] = (0, import_react.useState)({
		x: 0,
		y: 0
	});
	function setFrom(clientX, clientY) {
		const rect = ref.current?.getBoundingClientRect();
		if (!rect) return;
		let ax = (clientX - rect.left) / rect.width * 2 - 1;
		let ay = (clientY - rect.top) / rect.height * 2 - 1;
		const mag = Math.hypot(ax, ay);
		if (mag < .18) {
			setKnob({
				x: ax * .5,
				y: ay * .5
			});
			onChange(0, 0);
			return;
		}
		const scale = Math.min(1, mag);
		ax = ax / mag * scale;
		ay = ay / mag * scale;
		setKnob({
			x: ax,
			y: ay
		});
		onChange(ax, ay);
	}
	function release() {
		setKnob({
			x: 0,
			y: 0
		});
		onChange(0, 0);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref,
		className: "relative size-24 border border-line bg-deep/70",
		style: { touchAction: "none" },
		onPointerDown: (event) => {
			event.currentTarget.setPointerCapture(event.pointerId);
			setFrom(event.clientX, event.clientY);
		},
		onPointerMove: (event) => {
			if (event.currentTarget.hasPointerCapture(event.pointerId)) setFrom(event.clientX, event.clientY);
		},
		onPointerUp: release,
		onPointerCancel: release,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "pointer-events-none absolute top-1 left-1/2 -translate-x-1/2 text-[10px] tracking-wide text-mist uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "pointer-events-none absolute size-5 bg-biolume",
			style: {
				left: `calc(50% + ${knob.x * 32}px)`,
				top: `calc(50% + ${knob.y * 32}px)`,
				transform: "translate(-50%, -50%)"
			}
		})]
	});
}
function Chart({ sim, selfId }) {
	if (!sim) return null;
	const you = findDiver(sim, selfId);
	const chain = [
		{
			id: "breach",
			x: 70,
			y: 108
		},
		{
			id: "plains",
			x: 200,
			y: 108
		},
		{
			id: "city",
			x: 330,
			y: 78
		},
		{
			id: "works",
			x: 460,
			y: 138
		},
		{
			id: "reef",
			x: 590,
			y: 78
		}
	];
	const at = (id) => chain.find((node) => node.id === id);
	const link = (a, b, open) => {
		const from = at(a);
		const to = at(b);
		return {
			x1: from.x,
			y1: from.y,
			x2: to.x,
			y2: to.y,
			open
		};
	};
	const routes = [
		link("breach", "plains", true),
		link("plains", "city", sim.flags.mawDead),
		link("city", "works", true),
		link("works", "reef", true)
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-3xl",
			children: "Chart"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-mist",
			children: "The chain is the water you can still reach. You are the bright mark. Amber is a lock. Hulls you have seen sit on their sectors. The trench, the upper ocean, and the surface stay shut."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 760 250",
			className: "mt-3 w-full",
			role: "img",
			"aria-label": "Descent chart",
			children: [
				routes.map((route) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: route.x1,
					y1: route.y1,
					x2: route.x2,
					y2: route.y2,
					stroke: route.open ? "#3ee0c5" : "#e7a04a",
					strokeDasharray: route.open ? void 0 : "5 4",
					strokeWidth: 2
				}, `${route.x1}-${route.x2}`)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: 200,
					y1: 108,
					x2: 200,
					y2: 196,
					stroke: "#8aa4a0",
					strokeDasharray: "4 4",
					strokeWidth: 1.5
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: 590,
					y1: 78,
					x2: 690,
					y2: 42,
					stroke: "#8aa4a0",
					strokeDasharray: "4 4",
					strokeWidth: 1.5
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: 690,
					y1: 42,
					x2: 690,
					y2: 196,
					stroke: "#8aa4a0",
					strokeDasharray: "4 4",
					strokeWidth: 1.5
				}),
				!sim.flags.mawDead ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
					x: 250,
					y: 86,
					fill: "#e7a04a",
					fontSize: 11,
					children: "Maw lock"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
					x: 624,
					y: 58,
					fill: "#8aa4a0",
					fontSize: 11,
					children: "upper lock shut"
				}),
				chain.map((node) => {
					const region = sim.regions[node.id];
					const here = you?.region === node.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: node.x - 52,
							y: node.y - 22,
							width: 104,
							height: 44,
							fill: here ? "#07302c" : "#07141a",
							stroke: here ? "#3ee0c5" : "#24564f"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							x: node.x,
							y: node.y - 4,
							fill: "#e6f1ee",
							fontSize: 11,
							textAnchor: "middle",
							children: region.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("text", {
							x: node.x,
							y: node.y + 12,
							fill: "#8aa4a0",
							fontSize: 10,
							textAnchor: "middle",
							children: [region.depth, " m"]
						})
					] }, node.id);
				}),
				[
					{
						name: "Trench",
						x: 200,
						y: 210
					},
					{
						name: "Upper ocean",
						x: 690,
						y: 28
					},
					{
						name: "Surface",
						x: 690,
						y: 214
					}
				].map((zone) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: zone.x - 46,
					y: zone.y - 14,
					width: 92,
					height: 26,
					fill: "#120e0c",
					stroke: "#6a4a32"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("text", {
					x: zone.x,
					y: zone.y + 4,
					fill: "#c4895a",
					fontSize: 11,
					textAnchor: "middle",
					children: [zone.name, " · sealed"]
				})] }, zone.name)),
				sim.vehicles.filter((vehicle) => vehicle.seen).map((vehicle) => {
					const node = at(vehicle.region);
					const span = sim.regions[vehicle.region].w * 32;
					const t = Math.max(0, Math.min(1, vehicle.x / span));
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: node.x - 40 + t * 72,
						y: node.y + 24,
						width: 8,
						height: 4,
						fill: "#e7a04a"
					}, vehicle.id);
				}),
				(() => {
					const maw = sim.creatures.find((creature) => creature.kind === "maw");
					const known = sim.discovered.includes("beast:maw") || sim.explored.plains.some(Boolean) || sim.flags.mawDead;
					if (!maw || !known) return null;
					const node = at("plains");
					const t = Math.max(0, Math.min(1, maw.x / (sim.regions.plains.w * 32)));
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: node.x - 40 + t * 80,
						cy: node.y + 28,
						r: 4,
						fill: maw.alive ? "#c4553a" : "#3ee0c5"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: node.x - 40 + t * 80 + 7,
						y: node.y + 32,
						fill: "#c4553a",
						fontSize: 10,
						children: maw.alive ? "Maw" : "Maw down"
					})] });
				})(),
				you ? (() => {
					const node = at(you.region);
					const t = Math.max(0, Math.min(1, you.x / (sim.regions[you.region].w * 32)));
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: node.x - 36 + t * 72,
						cy: node.y + 8,
						r: 4,
						fill: "#3ee0c5"
					});
				})() : null
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 space-y-2",
			children: chain.map((node) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex h-1.5 w-full bg-hull",
				children: sim.explored[node.id].map((seen, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-full flex-1 ${seen ? "bg-biolume" : "bg-transparent"}` }, index))
			}) }, node.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-xs text-mist",
			children: [you ? `${you.name} is in ${sim.regions[you.region].name}.` : "You are in the dark.", sim.divers.filter((diver) => diver.alive && diver.id !== selfId).map((diver) => ` ${diver.name} is in ${sim.regions[diver.region].name}.`).join("")]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 space-y-1 text-sm",
			children: ZONES.map((zone) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex justify-between gap-3 border-b border-line py-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: zone.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: zone.state === "live" ? "text-biolume" : "text-mist",
					children: [
						zone.depth,
						" · ",
						zone.state === "live" ? "live" : "sealed"
					]
				})]
			}, zone.id))
		})
	] });
}
function Journal({ sim }) {
	if (!sim) return null;
	const logs = sim.discovered.filter((id) => LOGS[id]);
	const beasts = sim.discovered.filter((id) => id.startsWith("beast:"));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-3xl",
			children: "Journal"
		}),
		logs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-mist",
			children: "Nothing written down yet. Swim into the glowing desks."
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 space-y-4",
			children: logs.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-amber",
				children: LOGS[id]?.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm leading-relaxed text-mist",
				children: LOGS[id]?.body
			})] }, id))
		}),
		beasts.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-xs tracking-[0.16em] text-biolume uppercase",
				children: "Seen"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 space-y-2 text-sm text-mist",
				children: beasts.map((id) => {
					const key = id.slice(6);
					const entry = BESTIARY[key];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-foam",
							children: [entry?.name ?? key, "."]
						}),
						" ",
						entry?.note
					] }, id);
				})
			})]
		}) : null
	] });
}
var SplitComponent = GameApp;
//#endregion
export { SplitComponent as component };
