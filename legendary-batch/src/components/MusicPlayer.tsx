"use client";
import { useSyncExternalStore } from "react";
import { Music2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { music } from "@/lib/music";

const snap = () => `${music.playing}|${music.muted}|${music.volume}|${music.source}|${music.mood}`;

export default function MusicPlayer() {
  useSyncExternalStore((l) => music.subscribe(l), snap, snap);
  return (
    <div className="glass fixed bottom-3 right-3 z-[95] flex items-center gap-2 rounded-full px-3 py-2 text-sm shadow-[0_0_30px_#ff2a3d44]" role="group" aria-label="Music controls">
      <Music2 className={`h-4 w-4 text-amber ${music.playing ? "animate-pulse" : ""}`} aria-hidden />
      <button aria-label={music.playing ? "Pause music" : "Play music"} data-testid="music-toggle" onClick={() => void music.toggle()} className="rounded-full bg-stage p-2 text-white transition hover:scale-110 active:scale-95">
        {music.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <button aria-label={music.muted ? "Unmute" : "Mute"} data-testid="music-mute" onClick={() => music.toggleMute()} className="p-1 hover:text-neon">
        {music.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
      <input aria-label="Volume" data-testid="music-volume" type="range" min={0} max={1} step={0.05} value={music.muted ? 0 : music.volume} onChange={(e) => music.setVolume(Number(e.target.value))} className="hidden w-20 accent-[#ff2a3d] sm:block" />
      <span className="hidden text-xs text-sepia/70 md:inline" data-testid="music-source">{music.source === "file" ? "friendship-song.mp3" : music.source === "synth" ? "built-in loop" : "tap play"}</span>
    </div>
  );
}
