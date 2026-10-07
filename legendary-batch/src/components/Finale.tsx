"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { GROUP_PHOTO } from "@/data/friends";
import { music } from "@/lib/music";
import Photo from "./Photo";

const SCRIPT: { t: string; big?: boolean; wait: number }[] = [
  { t: "Okay... jokes apart.", wait: 3200 },
  { t: "These idiots made life a little more fun. ❤️", wait: 4200 },
  { t: "Different personalities.", wait: 2600 },
  { t: "Different problems.", wait: 2600 },
  { t: "Same friendship.", wait: 3600 },
  { t: "FRIENDS TODAY.\nMEMORIES FOREVER. ❤️", big: true, wait: 4500 },
];

export default function Finale() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [i, setI] = useState(-1);
  const [started, setStarted] = useState(false);
  const [dust, setDust] = useState<{ l: number; d: number; s: number; t: number }[]>([]);
  useEffect(() => { setDust(Array.from({ length: 24 }, () => ({ l: Math.random() * 100, d: 14 + Math.random() * 16, s: 2 + Math.random() * 4, t: -Math.random() * 20 }))); }, []);
  useEffect(() => { music.setMood(inView ? "emotional" : "fun"); if (inView) setStarted(true); }, [inView]);
  useEffect(() => {
    if (!started) return;
    let idx = 0; let t: ReturnType<typeof setTimeout>;
    const next = () => { setI(idx); const w = SCRIPT[idx].wait; idx++; if (idx < SCRIPT.length) t = setTimeout(next, w); else t = setTimeout(() => setI(SCRIPT.length), w); };
    t = setTimeout(next, 800);
    return () => clearTimeout(t);
  }, [started]);
  const done = i >= SCRIPT.length;
  return (
    <section ref={ref} id="finale" data-testid="finale" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-24 text-center" style={{ background: "linear-gradient(#0b0705, #000 25%, #000 85%, #0b0705)" }}>
      <motion.div className="absolute inset-0" animate={{ opacity: started ? 0.38 : 0 }} transition={{ duration: 4 }}>
        <Photo src={GROUP_PHOTO} alt="" className="h-full w-full object-cover blur-[2px] [filter:grayscale(.6)_sepia(.4)_brightness(.7)]" style={{ animation: "kenburns 60s ease-in-out infinite alternate" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />
      </motion.div>
      {dust.map((p, k) => <span key={k} aria-hidden className="absolute bottom-0 rounded-full bg-amber/70" style={{ left: `${p.l}%`, width: p.s, height: p.s, boxShadow: "0 0 8px #ffb43a", animation: `rise ${p.d}s linear ${p.t}s infinite` }} />)}
      <div className="relative z-10 min-h-[300px] w-full max-w-3xl">
        <AnimatePresence mode="wait">
          {i >= 0 && i < SCRIPT.length && (
            <motion.p key={i} data-testid="finale-line" initial={{ opacity: 0, y: 14, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, filter: "blur(6px)" }} transition={{ duration: 1.6 }}
              className={`whitespace-pre-line font-hand ${SCRIPT[i].big ? "font-display text-5xl leading-tight text-amber sm:text-7xl" : "text-4xl text-sepia sm:text-6xl"}`} style={SCRIPT[i].big ? { textShadow: "0 0 30px #ffb43a88" } : undefined}>{SCRIPT[i].t}</motion.p>
          )}
          {done && (
            <motion.div key="end" data-testid="finale-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}>
              <p className="whitespace-pre-line font-display text-5xl leading-tight text-amber sm:text-7xl" style={{ textShadow: "0 0 30px #ffb43a88" }}>{"FRIENDS TODAY.\nMEMORIES FOREVER. ❤️"}</p>
              <p className="mt-10 font-display text-2xl tracking-[0.3em] text-sepia sm:text-4xl">ABHI × YOGESH × SHIVA</p>
              <button onClick={() => document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })} className="mt-10 text-sm text-sepia/60 underline hover:text-sepia">watch again ↑</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
