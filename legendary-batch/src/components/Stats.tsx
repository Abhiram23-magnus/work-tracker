"use client";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";
import { friendById } from "@/data/friends";
import { stats } from "@/data/content";
import Section from "./Section";

function Counter({ to, run }: { to: number; run: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => { if (!run) return; const c = animate(0, to, { duration: 2, ease: "easeOut", onUpdate: (x) => setV(Math.round(x)) }); return () => c.stop(); }, [run, to]);
  return <span data-testid="stat-value">{v}%</span>;
}

function Bar({ label, value, color, run }: { label: string; value: number; color: string; run: boolean }) {
  const over = value > 100;
  const blocks = Math.round(value / 10);
  return (
    <div className="mb-4">
      <div className="mb-1 flex justify-between text-sm sm:text-base"><span>{label}</span><span className="font-display text-lg" style={{ color }}><Counter to={value} run={run} /></span></div>
      <div className="flex gap-[3px]" role="img" aria-label={`${label} ${value}%`}>
        {Array.from({ length: blocks }, (_, i) => (
          <motion.span key={i} initial={{ scaleY: 0, opacity: 0 }} animate={run ? { scaleY: 1, opacity: 1 } : {}} transition={{ delay: i * 0.08, type: "spring", stiffness: 300 }}
            className="h-5 flex-1 rounded-[2px]" style={{ background: i >= 10 ? "#ff2a3d" : color, boxShadow: `0 0 10px ${i >= 10 ? "#ff2a3d" : color}` }} />
        ))}
      </div>
      {over && <p className="mt-1 text-xs text-stage">⚠ scale exceeded. chart cried.</p>}
    </div>
  );
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <Section id="stats" title="FRIENDSHIP REPORT 📊" subtitle="Scientifically calculated by absolutely nobody.">
      <div ref={ref} className="grid gap-6 md:grid-cols-3">
        {stats.map((s) => { const f = friendById(s.who); return (
          <div key={s.who} className="glass rounded-2xl p-5">
            <h3 className="mb-4 font-display text-2xl" style={{ color: f.accent }}>{f.name}</h3>
            {s.rows.map((r) => <Bar key={r.label} {...r} color={f.accent} run={inView} />)}
          </div>
        ); })}
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="glass rounded-2xl p-6 text-center"><p className="text-sepia/80">Group brain cells:</p><p className="font-display text-6xl text-neon neon-cyan">{inView ? <Counter to={3} run={inView} /> : "0%"} 😂</p></div>
        <div className="glass rounded-2xl p-6 text-center"><p className="text-sepia/80">Group bakchodi:</p><motion.p animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="neon-red font-display text-6xl text-stage">∞% 💀</motion.p></div>
      </div>
    </Section>
  );
}
