"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { memes, type Meme } from "@/data/memes";
import { friendById } from "@/data/friends";
import Section from "./Section";

function MemeCard({ m, i }: { m: Meme; i: number }) {
  const [run, setRun] = useState(0);
  const color = m.who === "all" ? "#33f0ff" : friendById(m.who).accent;
  return (
    <motion.button data-testid={`meme-${m.id}`} onClick={() => setRun((r) => r + 1)} aria-label={`Replay meme: ${m.panels.map((p) => p.text).join(" ")}`}
      initial={{ opacity: 0, y: 40, rotate: i % 2 ? 2 : -2 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} whileHover={{ rotate: 0, scale: 1.03 }}
      className="overflow-hidden rounded-xl border-4 bg-black text-left shadow-[6px_6px_0_#000]" style={{ borderColor: color }}>
      <div className="flex items-center justify-between px-3 py-1 text-xs font-bold text-black" style={{ background: color }}><span>{m.theme}</span><span>tap to replay ↻</span></div>
      <div key={run} className="divide-y-2 divide-white/20">
        {m.panels.map((p, j) => (
          <motion.div key={j} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 + j * 0.8 }}
            className="relative flex items-center gap-3 bg-gradient-to-br from-[#241309] to-[#0b0705] p-4">
            <span className="text-5xl" aria-hidden>{p.emoji}</span>
            <p className="font-display text-xl uppercase leading-tight text-white sm:text-2xl" style={{ WebkitTextStroke: "1px #000", textShadow: "2px 2px 0 #000" }}>{p.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.button>
  );
}

export default function Memes() {
  return (
    <Section id="memes" title="MEMORIES THAT SHOULD NEVER LEAK 💀" subtitle="Original meme-style cards. Zero copyrighted templates. Maximum damage.">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{memes.map((m, i) => <MemeCard key={m.id} m={m} i={i} />)}</div>
    </Section>
  );
}
