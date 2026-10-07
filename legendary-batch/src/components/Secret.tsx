"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { secretMemories } from "@/data/memories";
import { fx } from "@/lib/fx";

export default function Secret() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0); // 0 closed, 1 why, 2 congrats, 3 memory
  const [mem, setMem] = useState(secretMemories[0]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pick = () => setMem((cur) => { let n = cur; while (n === cur && secretMemories.length > 1) n = secretMemories[Math.floor(Math.random() * secretMemories.length)]; return n; });
  const start = () => { timers.current.forEach(clearTimeout); pick(); setStep(1); timers.current = [setTimeout(() => setStep(2), 2200), setTimeout(() => { setStep(3); fx.confetti(innerWidth / 2, innerHeight / 2, 120); }, 5200)]; };
  const close = () => { timers.current.forEach(clearTimeout); setStep(0); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return (
    <section id="secret" className="relative px-4 py-20 text-center">
      <motion.button data-testid="secret-btn" onClick={start} whileHover={{ scale: 1.1, rotate: [0, -3, 3, 0] }} whileTap={{ scale: 0.85 }} className="rounded-full border-4 border-dashed border-stage px-8 py-5 font-display text-2xl text-stage shadow-[0_0_40px_#ff2a3d66] sm:text-3xl">DO NOT CLICK 👀</motion.button>
      <AnimatePresence>
        {step > 0 && (
          <motion.div key="s" data-testid="secret-overlay" role="dialog" aria-modal="true" aria-label="Secret" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[96] flex flex-col items-center justify-center bg-black px-6 text-center">
            <AnimatePresence mode="wait">
              {step === 1 && <motion.h2 key="1" data-testid="secret-why" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="font-display text-4xl text-stage sm:text-6xl">Why did you click it ra? 😂</motion.h2>}
              {step === 2 && <motion.h2 key="2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl font-display text-3xl text-amber sm:text-5xl">Congratulations. You have unlocked the stupidest friendship memory.</motion.h2>}
              {step === 3 && (
                <motion.div key="3" initial={{ opacity: 0, rotate: -6, scale: 0.7 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} className="max-w-xl">
                  <div className="rounded-lg bg-[#efe3c8] p-6 text-[#2a170c] shadow-[0_0_60px_#ff2a3d]"><p className="font-hand text-3xl sm:text-4xl" data-testid="secret-memory">{mem}</p></div>
                  <div className="mt-8 flex justify-center gap-3">
                    <button onClick={pick} data-testid="secret-another" className="rounded bg-stage px-5 py-3 font-display text-white">ANOTHER ONE 😂</button>
                    <button onClick={close} data-testid="secret-close" className="rounded border border-sepia/40 px-5 py-3 font-display">CLOSE</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
