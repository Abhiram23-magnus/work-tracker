"use client";
import { useRef } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { GROUP_PHOTO } from "@/data/friends";
import Photo from "./Photo";
import FloatingEmojis from "./FloatingEmojis";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1, 1], [8, -8]), { stiffness: 80, damping: 15 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-10, 10]), { stiffness: 80, damping: 15 });
  return (
    <section ref={ref} id="hero" data-testid="hero" className="relative flex min-h-screen items-center overflow-hidden px-4 py-20"
      onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set(((e.clientX - r.left) / r.width) * 2 - 1); my.set(((e.clientY - r.top) / r.height) * 2 - 1); }}>
      <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 40%, #ff2a3d33, transparent 55%), radial-gradient(ellipse at 20% 80%, #ffb43a22, transparent 50%), #0b0705" }} />
      <div aria-hidden className="absolute -left-1/4 top-0 h-full w-1/2 bg-gradient-to-r from-amber/40 to-transparent blur-3xl" style={{ animation: "lightleak 7s ease-in-out infinite" }} />
      <FloatingEmojis emojis={["✨", "🎬", "💪", "🍗", "😴", "🔥"]} count={12} />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-2">
        <motion.div style={{ y: textY }} className="order-2 text-center md:order-1 md:text-left">
          <motion.p initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="font-hand text-5xl text-amber sm:text-6xl">Mana Batch ❤️</motion.p>
          <motion.p initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7, duration: 0.8 }} className="mt-2 text-xl text-sepia/90 sm:text-2xl">Friends kaadu ra...</motion.p>
          <motion.h2 initial={{ opacity: 0, scale: 1.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.3, type: "spring", stiffness: 120 }}
            className="neon-red mt-3 font-display text-6xl leading-[0.95] text-stage sm:text-7xl lg:text-8xl"><span className="glitch" data-text="FULL-TIME HEADACHE 😂">FULL-TIME HEADACHE 😂</span></motion.h2>
          <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }} className="glass mt-8 inline-block rounded-full px-5 py-2 text-sm text-sepia sm:text-base">
            3 Members • 0 Brain Cells • Unlimited Memories
          </motion.span>
        </motion.div>
        <div className="order-1 mx-auto w-full max-w-[15rem] sm:max-w-sm [perspective:1200px] md:order-2">
          <motion.div style={{ y, rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }} initial={{ opacity: 0, scale: 0.8, rotate: -6 }} animate={{ opacity: 1, scale: 1, rotate: -2 }} transition={{ duration: 1.2 }}
            className="relative rounded-sm bg-[#e9d3a8] p-3 pb-12 shadow-[0_0_80px_#ff2a3d66,0_30px_60px_#000]">
            <div className="relative aspect-[3/4] overflow-hidden bg-black">
              <Photo src={GROUP_PHOTO} alt="Abhi, Yogesh and Shiva at a night event" className="kenburns h-full w-full object-cover [filter:sepia(.25)_contrast(1.08)_saturate(1.2)]" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-tr from-stage/25 via-transparent to-amber/25 mix-blend-screen" style={{ animation: "lightleak 6s ease-in-out infinite" }} />
              <div aria-hidden className="absolute inset-0 shadow-[inset_0_0_80px_#000]" />
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center font-hand text-2xl text-[#2a170c]">Evidence #001 💀</p>
            <div aria-hidden className="absolute -inset-1 -z-10 rounded bg-stage/40 blur-2xl" style={{ transform: "translateZ(-40px)" }} />
          </motion.div>
        </div>
      </div>
      <motion.div aria-hidden className="absolute bottom-6 left-1/2 text-sepia/60" animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>scroll ↓</motion.div>
    </section>
  );
}
