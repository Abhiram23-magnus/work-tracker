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
    const bpm = this.mood === "emotional" ? 74 : 132;
    const stepLen = 60 / bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.15) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += stepLen;
      this.step = (this.step + 1) % 64;
    }
  }
  private tone(freq: number, t: number, dur: number, type: OscillatorType, gain: number) {
    const c = this.ctx!; const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
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
  private playStep(s: number, t: number) {
    const emo = this.mood === "emotional";
    const bassRoots = [146.83, 146.83, 116.54, 130.81]; // D, D, Bb, C
    const bar = Math.floor(s / 16) % 4;
    const root = bassRoots[bar];
    if (!emo) {
      if (s % 4 === 0) { // kick
        const c = this.ctx!; const o = c.createOscillator(); const g = c.createGain();
        o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
        g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        o.connect(g); g.connect(this.master!); o.start(t); o.stop(t + 0.2);
      }
      if (s % 8 === 4) this.noise(t, 0.12, 0.35); // clap
      if (s % 2 === 1) this.noise(t, 0.03, 0.12); // hat
      if (s % 2 === 0) this.tone(root / 2, t, 0.2, "sawtooth", 0.22);
    } else if (s % 16 === 0) {
      this.tone(root, t, 1.8, "sine", 0.3);
      this.tone(root * 1.5, t, 1.8, "sine", 0.18);
    }
    const scale = [293.66, 349.23, 392, 440, 523.25, 587.33]; // D F G A C D
    const pattern = [0, -1, 2, -1, 3, 2, -1, 4, 3, -1, 2, 0, -1, 2, 1, -1];
    const idx = pattern[(s + bar * 3) % 16];
    if (idx >= 0 && (!emo || s % 4 === 0)) this.tone(scale[idx], t, emo ? 0.9 : 0.16, emo ? "triangle" : "square", emo ? 0.14 : 0.09);
  }
}

export const music = new MusicController();
