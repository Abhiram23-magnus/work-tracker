"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { fx } from "@/lib/fx";

const LINES = ["Too much bakchodi detected.", "Yogesh sleeping. 😴", "Abhi searching for food. 🍗", "Shiva preparing his next movie scene. 🎬", "System unable to continue normally."];

export default function SystemError({ active, onShake }: { active: boolean; onShake: () => void }) {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<"idle" | "fixing" | "done">("idle");
  const [result, setResult] = useState("");
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setShow(true), 14000 + Math.random() * 10000);
    return () => clearTimeout(t);
  }, [active]);
  const fix = () => { setPhase("fixing"); setTimeout(() => { setResult("Fixed! ...Just kidding. Yogesh is still sleeping. 😴"); setPhase("done"); fx.confetti(innerWidth / 2, innerHeight / 2); setTimeout(dismiss, 2200); }, 2200); };
  const ignore = () => { onShake(); setResult("Ignored. Like everyone ignores Abhi's diet. 💀"); setPhase("done"); fx.fireworks(3); setTimeout(dismiss, 1800); };
  const dismiss = () => { setShow(false); setPhase("idle"); setResult(""); };
  return (
    <AnimatePresence>
      {show && (
        <motion.div key="err" data-testid="system-error" role="alertdialog" aria-labelledby="se-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.2 }} className="fixed inset-0 z-[88] flex items-center justify-center bg-black/80 p-4">
          <motion.div initial={{ scale: 0.5, x: -20 }} animate={{ scale: 1, x: [0, -8, 8, -4, 0] }} transition={{ duration: 0.5 }} className="w-full max-w-md rounded-lg border-2 border-stage bg-[#1a0507] p-6 shadow-[0_0_80px_#ff2a3d]">
            <h3 id="se-title" className="glitch flex items-center gap-2 font-display text-2xl text-stage sm:text-3xl" data-text="⚠️ FRIENDSHIP SYSTEM ERROR"><AlertTriangle className="h-7 w-7" aria-hidden /> ⚠️ FRIENDSHIP SYSTEM ERROR</h3>
            <ul className="mt-4 space-y-1 font-mono text-sm text-sepia">{LINES.map((l, i) => <motion.li key={l} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.25 }}>&gt; {l}</motion.li>)}</ul>
            {phase === "fixing" && <div className="mt-5 h-3 overflow-hidden rounded bg-white/10" data-testid="fixing"><motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2.1 }} className="h-full bg-gym" /></div>}
            {phase === "done" && <p className="mt-5 text-amber" data-testid="se-result">{result}</p>}
            {phase === "idle" && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button data-testid="fix-btn" onClick={fix} className="flex-1 rounded bg-gym px-4 py-3 font-display text-lg text-black hover:brightness-110">FIX FRIENDSHIP 😂</button>
                <button data-testid="ignore-btn" onClick={ignore} className="flex-1 rounded bg-stage px-4 py-3 font-display text-lg text-white hover:brightness-110">IGNORE PROBLEM 💀</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
