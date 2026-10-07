"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Opening from "@/components/Opening";
import Hero from "@/components/Hero";
import FriendCards from "@/components/FriendCards";
import Stats from "@/components/Stats";
import WhoIsMost from "@/components/WhoIsMost";
import Roast from "@/components/Roast";
import Memes from "@/components/Memes";
import Gallery from "@/components/Gallery";
import Secret from "@/components/Secret";
import Finale from "@/components/Finale";
import SystemError from "@/components/SystemError";
import MusicPlayer from "@/components/MusicPlayer";
import FxCanvas from "@/components/FxCanvas";
import Marquee from "@/components/Marquee";
import { fx } from "@/lib/fx";
import { music } from "@/lib/music";

export default function Home() {
  const [phase, setPhase] = useState<"opening" | "main">("opening");
  const [flash, setFlash] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const shake = useCallback(() => {
    const el = rootRef.current; if (!el) return;
    el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 700);
  }, []);

  const enter = useCallback(() => {
    void music.play(); // user gesture → music allowed
    fx.confetti(innerWidth / 2, innerHeight * 0.65, 220);
    fx.fireworks(7);
    shake(); setFlash(true);
    setTimeout(() => { setPhase("main"); window.scrollTo(0, 0); }, 650);
    setTimeout(() => setFlash(false), 1100);
  }, [shake]);

  useEffect(() => { if (phase === "opening") document.body.style.overflow = "hidden"; else document.body.style.overflow = ""; }, [phase]);

  return (
    <div ref={rootRef}>
      <FxCanvas />
      {phase === "opening" && <Opening onEnter={enter} />}
      <AnimatePresence>{flash && <motion.div key="f" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1 }} className="pointer-events-none fixed inset-0 z-[100] bg-white" />}</AnimatePresence>
      {phase === "main" && (
        <main data-testid="main" className="overflow-x-clip">
          <Hero />
          <Marquee />
          <FriendCards />
          <Stats />
          <Marquee reverse />
          <WhoIsMost />
          <Roast />
          <Memes />
          <Gallery />
          <Secret />
          <Finale />
        </main>
      )}
      <MusicPlayer />
      <SystemError active={phase === "main"} onShake={shake} />
    </div>
  );
}
