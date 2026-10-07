"use client";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { friends, type FriendId } from "@/data/friends";
import { fx } from "@/lib/fx";
import Section from "./Section";

export default function Roast() {
  const [cur, setCur] = useState<{ id: FriendId; text: string; n: number } | null>(null);
  const seen = useRef<Record<string, number[]>>({});
  const roast = (id: FriendId, e: React.MouseEvent) => {
    const f = friends.find((x) => x.id === id)!;
    let used = seen.current[id] ?? [];
    if (used.length >= f.roasts.length) used = [];
    const pool = f.roasts.map((_, i) => i).filter((i) => !used.includes(i));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    seen.current[id] = [...used, pick];
    setCur({ id, text: f.roasts[pick], n: (cur?.n ?? 0) + 1 });
    const r = e.currentTarget.getBoundingClientRect();
    fx.sparkle(r.left + r.width / 2, r.top, ["🔥", "💀", "😂", "🎤"]);
  };
  const f = cur && friends.find((x) => x.id === cur.id)!;
  return (
    <Section id="roast" title="ROAST THE BATCH 🔥" subtitle="Friendly fire only. Nobody was harmed (ego maybe).">
      <div className="flex flex-col items-stretch justify-center gap-4 sm:flex-row">
        {friends.map((x) => (
          <motion.button key={x.id} data-testid={`roast-${x.id}`} onClick={(e) => roast(x.id, e)} whileHover={{ scale: 1.06, rotate: -1 }} whileTap={{ scale: 0.9 }}
            className="rounded-xl px-6 py-4 font-display text-xl text-black sm:text-2xl" style={{ background: x.accent, boxShadow: `0 0 30px ${x.accent}88` }}>
            ROAST {x.name.toUpperCase()} {x.emoji}
          </motion.button>
        ))}
      </div>
      <div className="mx-auto mt-10 min-h-[200px] max-w-2xl" aria-live="polite">
        <AnimatePresence mode="wait">
          {cur && f ? (
            <motion.div key={cur.n} data-testid="roast-output" initial={{ opacity: 0, y: 40, scale: 0.8, rotate: -3 }} animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className="glass rounded-2xl p-6 text-center sm:p-8" style={{ borderColor: f.accent }}>
              <p className="font-hand text-2xl" style={{ color: f.accent }}>{f.name} got roasted 🔥</p>
              <p className="mt-3 text-xl font-medium sm:text-2xl">{cur.text}</p>
            </motion.div>
          ) : <p className="text-center text-sepia/60">Pick a victim. Mercy is not available. 😈</p>}
        </AnimatePresence>
      </div>
    </Section>
  );
}
