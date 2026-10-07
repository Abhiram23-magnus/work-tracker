"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { quiz } from "@/data/content";
import { fx } from "@/lib/fx";
import Section from "./Section";

export default function WhoIsMost() {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const reveal = (i: number, e: React.MouseEvent) => {
    if (open.has(i)) return;
    const n = new Set(open); n.add(i); setOpen(n);
    const r = e.currentTarget.getBoundingClientRect();
    fx.sparkle(r.left + r.width / 2, r.top + r.height / 2, quiz[i].answer === "nobody" ? ["🍗", "🍛", "😂"] : undefined);
    if (n.size === quiz.length) setTimeout(() => fx.confetti(innerWidth / 2, innerHeight / 2, 200), 400);
  };
  return (
    <Section id="mostlikely" title="WHO IS MOST LIKELY TO... 🎯" subtitle="Tap a card. Face the truth. No appeals.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {quiz.map((q, i) => {
          const isOpen = open.has(i);
          return (
            <motion.button key={q.q} data-testid={`quiz-${i}`} onClick={(e) => reveal(i, e)} aria-pressed={isOpen} whileHover={{ y: -6, rotate: i % 2 ? 1 : -1 }} whileTap={{ scale: 0.96 }}
              className={`glass relative min-h-[170px] overflow-hidden rounded-2xl p-5 text-left ${i === quiz.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""}`}>
              <p className="text-lg font-medium">{q.q}</p>
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div key="a" initial={{ opacity: 0, scale: 0.2, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 12 }} className="mt-4">
                    <p className="neon-red font-display text-4xl text-amber" data-testid={`answer-${i}`}>→ {q.label}</p>
                    <p className="mt-1 text-sm text-sepia/80">{q.reaction}</p>
                  </motion.div>
                ) : (
                  <motion.p key="q" exit={{ opacity: 0 }} className="mt-6 font-display text-2xl text-stage">TAP TO REVEAL 👀</motion.p>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
      <p className="mt-6 text-center text-sepia/70" aria-live="polite">{open.size}/{quiz.length} truths revealed {open.size === quiz.length && "— Full damage. 💥"}</p>
    </Section>
  );
}
