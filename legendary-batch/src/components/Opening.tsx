"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const LINES = ["3 IDIOTS.", "1 FRIENDSHIP.", "INFINITE PROBLEMS. 💀", "PRESENTING..."];

export default function Opening({ onEnter }: { onEnter: () => void }) {
  const [step, setStep] = useState(-1);
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    [600, 2100, 3600, 5400, 6800].forEach((t, i) => timers.push(setTimeout(() => setStep((s) => Math.max(s, i)), t)));
    return () => timers.forEach(clearTimeout);
  }, []);
  const showTitle = step >= 4;
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden bg-black px-4 text-center" data-testid="opening">
      <button onClick={() => setStep(4)} className="absolute right-3 top-3 text-xs text-sepia/50 underline hover:text-sepia" data-testid="skip-intro">skip intro</button>
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 50% 55%, #ff2a3d22, transparent 60%)" }} />
      <AnimatePresence mode="wait">
        {step >= 0 && step < 4 && (
          <motion.h2 key={step} initial={{ opacity: 0, scale: 1.6, filter: "blur(12px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }} transition={{ duration: 0.5 }}
            className={`font-display text-5xl sm:text-7xl md:text-8xl ${step === 2 ? "neon-red text-stage" : "text-sepia"}`}>{LINES[step]}</motion.h2>
        )}
      </AnimatePresence>
      {showTitle && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-4 text-sm tracking-[0.5em] text-sepia/70">PRESENTING...</motion.p>
          <motion.h1 initial={{ scale: 3, opacity: 0, rotateX: 70 }} animate={{ scale: 1, opacity: 1, rotateX: 0 }} transition={{ type: "spring", stiffness: 90, damping: 14, delay: 0.2 }}
            className="font-display text-5xl leading-none text-amber sm:text-7xl md:text-9xl" style={{ textShadow: "0 0 20px #ff2a3d, 0 0 60px #ff2a3d88, 4px 4px 0 #ff2a3d" }}>
            THE LEGENDARY<br />BATCH <span aria-hidden>😂🔥</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-6 text-lg text-sepia sm:text-2xl">Abhi × Yogesh × Shiva</motion.p>
          <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
            onClick={onEnter} data-testid="enter-btn" className="mt-10 rounded-full bg-stage px-8 py-4 font-display text-xl text-white shadow-[0_0_40px_#ff2a3d] sm:text-2xl">
            ENTER CHEYYI RA 😂
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
