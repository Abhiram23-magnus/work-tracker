"use client";
import { useEffect, useRef } from "react";
import { registerFx } from "@/lib/fx";

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; kind: "conf" | "spark" | "emoji"; rot: number; vr: number; g: number; text?: string }
const COLORS = ["#ff2a3d", "#ffb43a", "#33f0ff", "#c6ff3d", "#a66bff", "#ffffff", "#ff7ad9"];

/** Full-screen canvas for confetti, fireworks and click sparkles. Pointer-events none. */
export default function FxCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!; const ctx = cv.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener("resize", resize);
    const ps: P[] = []; let raf = 0; let last = performance.now();
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const confetti = (x = innerWidth / 2, y = innerHeight * 0.6, n = 140) => {
      if (reduced) n = Math.floor(n / 4);
      for (let i = 0; i < n; i++) { const a = rnd(-Math.PI, 0); const s = rnd(5, 16);
        ps.push({ x, y, vx: Math.cos(a) * s * rnd(0.4, 1.3), vy: Math.sin(a) * s, life: 0, max: rnd(2, 3.6), color: COLORS[i % COLORS.length], size: rnd(5, 10), kind: "conf", rot: rnd(0, 6), vr: rnd(-8, 8), g: 14 }); }
    };
    const burst = (x: number, y: number) => {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (let i = 0; i < 70; i++) { const a = (i / 70) * Math.PI * 2; const s = rnd(60, 260) / 60;
        ps.push({ x, y, vx: Math.cos(a) * s * 60, vy: Math.sin(a) * s * 60, life: 0, max: rnd(0.9, 1.6), color, size: rnd(1.5, 3), kind: "spark", rot: 0, vr: 0, g: 160 }); }
    };
    const fireworks = (count = 6) => { for (let i = 0; i < count; i++) setTimeout(() => burst(rnd(innerWidth * 0.1, innerWidth * 0.9), rnd(innerHeight * 0.1, innerHeight * 0.5)), i * 260); };
    const sparkle = (x: number, y: number, emoji?: string[]) => {
      for (let i = 0; i < 12; i++) { const a = rnd(0, Math.PI * 2); const s = rnd(60, 220);
        ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0, max: rnd(0.8, 1.4), color: "#fff", size: rnd(16, 26), kind: "emoji", rot: 0, vr: 0, g: 200, text: (emoji ?? ["✨", "💀", "😂", "🔥"])[i % (emoji?.length ?? 4)] }); }
    };
    registerFx({ confetti, fireworks, sparkle });

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]; p.life += dt;
        if (p.life > p.max) { ps.splice(i, 1); continue; }
        p.vy += p.g * (p.kind === "conf" ? 1 : 1) * dt * (p.kind === "conf" ? 6 : 1);
        if (p.kind === "conf") { p.vx *= 0.985; p.vy *= 0.985; }
        p.x += p.vx * dt * (p.kind === "conf" ? 60 : 1); p.y += p.vy * dt * (p.kind === "conf" ? 60 : 1); p.rot += p.vr * dt;
        const a = Math.max(0, 1 - p.life / p.max); ctx.globalAlpha = a;
        if (p.kind === "conf") { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore(); }
        else if (p.kind === "spark") { ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
        else { ctx.font = `${p.size}px serif`; ctx.fillText(p.text ?? "✨", p.x, p.y); }
      }
      ctx.globalAlpha = 1; raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); registerFx(null); };
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[90]" />;
}
