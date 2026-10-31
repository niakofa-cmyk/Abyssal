export class SeaAudio {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private nextNote = 0;
  private o2Mark = -1;
  muted = false;

  unlock() {
    if (!this.ctx) {
      const ctx = new AudioContext({ latencyHint: "interactive" });
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.music = ctx.createGain();
      this.sfx = ctx.createGain();
      this.music.gain.value = 0.22;
      this.sfx.gain.value = 0.5;
      this.master.gain.value = this.muted ? 0 : 1;
      this.music.connect(this.master);
      this.sfx.connect(this.master);
      this.master.connect(ctx.destination);
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.35), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buffer;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.03);
    }
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, bus: "music" | "sfx") {
    if (!this.ctx || !this.master || this.muted) return;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(Math.max(0.0001, gain), this.ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    osc.connect(amp);
    amp.connect(bus === "music" ? this.music! : this.sfx!);
    osc.start();
    osc.stop(this.ctx.currentTime + dur + 0.02);
  }

  private burst(dur: number, gain: number) {
    if (!this.ctx || !this.noise || !this.sfx || this.muted) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 420;
    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(gain, this.ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(this.sfx);
    src.start();
    src.stop(this.ctx.currentTime + dur);
  }

  tick(time: number, combat: boolean) {
    if (!this.ctx || this.muted) return;
    if (this.ctx.currentTime < this.nextNote) return;
    const scale = [73.42, 87.31, 98.0, 110.0, 130.81, 146.83];
    const note = scale[Math.floor(time * (combat ? 2 : 0.5)) % scale.length] ?? 98;
    this.tone(combat ? note : note / 2, combat ? 0.2 : 1.1, combat ? "triangle" : "sine", combat ? 0.045 : 0.028, "music");
    this.tone(55, 1.6, "sine", 0.035, "music");
    this.nextNote = this.ctx.currentTime + (combat ? 0.38 : 1.5);
  }

  react(events: string[], o2: number, time: number) {
    if (events.includes("shot")) this.tone(520, 0.07, "square", 0.035, "sfx");
    if (events.includes("torpedo")) this.burst(0.18, 0.22);
    if (events.includes("hit") || events.includes("hull")) this.tone(96, 0.14, "sawtooth", 0.05, "sfx");
    if (events.includes("hypoxia") || events.includes("bosswarn")) this.tone(156, 0.28, "sawtooth", 0.05, "sfx");
    if (events.includes("warn")) this.tone(210, 0.12, "triangle", 0.04, "sfx");
    if (events.includes("open")) this.tone(320, 0.16, "sine", 0.04, "sfx");
    if (events.includes("board") || events.includes("repair") || events.includes("shield")) this.tone(180, 0.09, "triangle", 0.05, "sfx");
    if (events.includes("pickup") || events.includes("upgrade")) this.tone(690, 0.09, "sine", 0.05, "sfx");
    if (events.includes("destroy") || events.includes("victory")) this.burst(0.35, 0.28);
    if (events.includes("region")) this.tone(240, 0.2, "sine", 0.04, "sfx");
    if (o2 > 0 && o2 < 30) {
      const mark = Math.floor(time * 1.5);
      if (mark !== this.o2Mark) {
        this.o2Mark = mark;
        this.tone(860, 0.05, "square", 0.04, "sfx");
      }
    }
  }
}
