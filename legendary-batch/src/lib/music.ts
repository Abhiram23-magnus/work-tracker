export const SONG_PATH = "/music/friendship-song.mp3";
export type Mood = "fun" | "emotional";

type Listener = () => void;

class MusicController {
  playing = false;
  muted = false;
  volume = 0.7;
  mood: Mood = "fun";
  source: "none" | "file" | "synth" = "none";
  private audio: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private listeners = new Set<Listener>();

  subscribe(l: Listener) { this.listeners.add(l); return () => { this.listeners.delete(l); }; }
  private emit() { this.listeners.forEach((l) => l()); }

  private effVol() { return this.muted ? 0 : this.volume * (this.mood === "emotional" ? 0.55 : 1); }

  async play() {
    if (this.playing) return;
    if (this.source === "none") {
      let hasFile = false;
      try { const r = await fetch(SONG_PATH, { method: "HEAD" }); hasFile = r.ok && (r.headers.get("content-type") ?? "").includes("audio"); } catch { /* none */ }
      if (hasFile) {
        this.audio = new Audio(SONG_PATH);
        this.audio.loop = true;
        this.audio.addEventListener("error", () => { this.audio = null; this.source = "synth"; this.playing = false; void this.play(); });
        this.source = "file";
      } else this.source = "synth";
    }
    if (this.source === "file" && this.audio) {
      this.audio.volume = this.effVol();
      try { await this.audio.play(); } catch { this.source = "synth"; }
    }
    if (this.source === "synth") this.startSynth();
    this.playing = true;
    this.emit();
  }

  pause() {
    if (!this.playing) return;
    this.audio?.pause();
    this.stopSynth();
    this.playing = false;
    this.emit();
  }

  toggle() { return this.playing ? this.pause() : this.play(); }
  toggleMute() { this.muted = !this.muted; this.applyVolume(); this.emit(); }
  setVolume(v: number) { this.volume = v; if (v > 0) this.muted = false; this.applyVolume(); this.emit(); }
  setMood(m: Mood) { this.mood = m; this.applyVolume(); this.emit(); }

  private applyVolume() {
    if (this.audio) this.audio.volume = Math.min(1, this.effVol());
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.effVol() * 0.5, this.ctx.currentTime, 0.1);
  }

  // ---- original synth fallback: a bouncy Telugu-mass-ish loop in D minor pentatonic ----
  private startSynth() {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
    }
    void this.ctx.resume();
    this.master!.gain.value = this.effVol() * 0.5;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.step = 0;
    this.timer = window.setInterval(() => this.schedule(), 40);
  }
  private stopSynth() { if (this.timer) { clearInterval(this.timer); this.timer = null; } void this.ctx?.suspend(); }

  private schedule() {
    if (!this.ctx) return;
    const bpm = this.mood === "emotional" ? 74 : 150;
    const stepLen = 60 / bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.15) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += stepLen;
      this.step = (this.step + 1) % 128; // 8 bars
    }
  }
  private tone(freq: number, t: number, dur: number, type: OscillatorType, gain: number, detune = 0) {
    const c = this.ctx!; const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master!); o.start(t); o.stop(t + dur + 0.05);
  }
  private noise(t: number, dur: number, gain: number) {
    const c = this.ctx!; const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = buf; const g = c.createGain(); g.gain.value = gain;
    s.connect(g); g.connect(this.master!); s.start(t);
  }
  private sweep(f0: number, f1: number, t: number, dur: number, type: OscillatorType, gain: number) {
    const c = this.ctx!; const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.02);
    o.connect(g); g.connect(this.master!); o.start(t); o.stop(t + dur + 0.05);
  }
  private playStep(s: number, t: number) {
    if (this.mood === "emotional") return this.playEmotional(s, t);
    const bar = Math.floor(s / 16); // 0..7
    const st = s % 16;
    const drop = bar === 7; // build-up bar before the loop restarts
    const roots = [146.83, 146.83, 116.54, 130.81, 146.83, 146.83, 110, 130.81]; // D D Bb C D D A C
    const root = roots[bar];
    // thumping kick (four-on-floor, doubled in the build-up)
    if (st % 4 === 0 || (drop && st % 2 === 0)) this.sweep(160, 38, t, 0.14, "sine", 0.9);
    // dappu (tamate drum) pattern: tha-tha-dhin-ka
    if ([2, 3, 6, 7, 10, 11, 14].includes(st)) this.sweep(300, 120, t, 0.07, "triangle", 0.4), this.noise(t, 0.04, 0.22);
    if (st === 4 || st === 12) this.noise(t, 0.14, 0.4); // clap
    if (st % 2 === 1) this.noise(t, 0.025, 0.1); // hat
    // rolling bass
    if (st % 2 === 0) this.tone(root / 2, t, 0.16, "sawtooth", 0.24);
    // brass stabs (detuned saws: root, minor third, fifth)
    if ([0, 3, 6, 10].includes(st) && !drop) [1, 1.189, 1.498].forEach((r, i) => this.tone(root * 2 * r, t, 0.2, "sawtooth", 0.08, i * 7 - 7));
    // siren / shehnai-style lead in D harmonic minor
    const scale = [293.66, 329.63, 349.23, 392, 440, 466.16, 554.37, 587.33];
    const lead = [7, -1, 6, 7, -1, 5, 4, -1, 7, 7, 6, -1, 4, 5, 4, 2];
    const idx = lead[st];
    if (idx >= 0 && bar % 4 >= 2 && !drop) { this.tone(scale[idx], t, 0.18, "square", 0.07); this.tone(scale[idx] * 2.005, t, 0.18, "sawtooth", 0.03); }
    // riser + snare roll through the final bar, drop on the downbeat of bar 0
    if (drop && st === 0) this.sweep(200, 2400, t, (60 / 150) * 4, "sawtooth", 0.1);
    if (drop && st >= 8) this.noise(t, 0.05, 0.1 + st * 0.02);
    if (s === 0) { this.sweep(90, 30, t, 0.5, "sine", 1); this.noise(t, 0.3, 0.45); }
    // hype shout beep on every 4th bar
    if (st === 8 && bar % 4 === 3) { this.tone(880, t, 0.1, "square", 0.08); this.tone(1318.5, t + 0.12, 0.12, "square", 0.08); }
  }
  private playEmotional(s: number, t: number) {
    const roots = [146.83, 146.83, 116.54, 130.81];
    const bar = Math.floor(s / 16) % 4;
    const root = roots[bar];
    if (s % 16 === 0) { this.tone(root, t, 1.8, "sine", 0.3); this.tone(root * 1.5, t, 1.8, "sine", 0.18); }
    const scale = [293.66, 349.23, 392, 440, 523.25, 587.33];
    const pattern = [0, -1, 2, -1, 3, 2, -1, 4, 3, -1, 2, 0, -1, 2, 1, -1];
    const idx = pattern[(s + bar * 3) % 16];
    if (idx >= 0 && s % 4 === 0) this.tone(scale[idx], t, 0.9, "triangle", 0.14);
  }
}

export const music = new MusicController();
