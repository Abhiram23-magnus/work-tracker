"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Camera, Dumbbell } from "lucide-react";
import { friends, GROUP_PHOTO, type Friend } from "@/data/friends";
import { fx } from "@/lib/fx";
import Photo from "./Photo";
import Section from "./Section";

function Tilt({ children, accent }: { children: React.ReactNode; accent: string }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 150, damping: 15 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 150, damping: 15 });
  return (
    <div className="[perspective:1000px]" onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX - r.left) / r.width - 0.5); y.set((e.clientY - r.top) / r.height - 0.5); }} onPointerLeave={() => { x.set(0); y.set(0); }}>
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d", boxShadow: `0 0 50px ${accent}44` }} className="glass relative overflow-hidden rounded-2xl">{children}</motion.div>
    </div>
  );
}

function Avatar({ f, className = "" }: { f: Friend; className?: string }) {
  return (
    <div className={`relative aspect-square w-full overflow-hidden rounded-xl border-2 ${className}`} style={{ borderColor: f.accent }}>
      <Photo src={f.photo || GROUP_PHOTO} alt={`${f.name}`} className="h-full w-full object-cover [filter:sepia(.2)_contrast(1.1)]" style={{ objectPosition: "50% 40%", transform: "scale(2.6)", transformOrigin: `${f.photoX}% 46%` }} />
    </div>
  );
}

function AbhiFx() {
  return (
    <>
      <div aria-hidden className="absolute right-3 top-3 text-5xl" style={{ animation: "pump 1.4s ease-in-out infinite", transformOrigin: "bottom right" }}>🏋️</div>
      <div aria-hidden className="absolute left-3 top-3 text-3xl" style={{ animation: "sweep 2s ease-in-out infinite" }}>🥤</div>
      {["🍗", "🍔", "🍕", "🥚"].map((e, i) => <span aria-hidden key={e} className="absolute text-2xl" style={{ left: `${15 + i * 22}%`, bottom: 0, animation: `rise ${5 + i}s linear ${i}s infinite` }}>{e}</span>)}
    </>
  );
}
function YogeshFx({ asleep }: { asleep: boolean }) {
  return (
    <>
      {asleep && [0, 1, 2].map((i) => <span aria-hidden key={i} className="absolute right-8 top-16 font-display text-3xl text-violet" style={{ animation: `zzz 3s ease-out ${i}s infinite` }}>Z</span>)}
      <div aria-hidden className="absolute left-3 top-3 text-3xl">{asleep ? "😴" : "🤪"}</div>
    </>
  );
}
function ShivaFx() {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute -top-10 left-1/2 h-72 w-40 origin-top bg-gradient-to-b from-white/50 to-transparent blur-md" style={{ clipPath: "polygon(40% 0,60% 0,100% 100%,0 100%)", animation: "sweep 4s ease-in-out infinite" }} />
      <Camera aria-hidden className="absolute right-3 top-3 h-9 w-9 text-stage" />
    </>
  );
}

export default function FriendCards() {
  const [yAsleep, setYAsleep] = useState(true);
  const glitchRef = useRef<HTMLSpanElement>(null);
  useEffect(() => { const t = setInterval(() => setYAsleep((a) => !a), 3500); return () => clearInterval(t); }, []);
  const crazy = () => { const r = glitchRef.current?.getBoundingClientRect(); fx.sparkle(r ? r.left + r.width / 2 : innerWidth / 2, r ? r.top : innerHeight / 2, ["🤪", "💀", "😵‍💫", "🤡", "⚡", "🔥"]); };

  return (
    <Section id="crew" title="MEET THE CRIMINALS" subtitle="Three personalities. Zero filters. (tap the cards 👇)">
      <div className="grid gap-8 md:grid-cols-3">
        {friends.map((f, i) => (
          <motion.div key={f.id} data-testid={`friend-${f.id}`} initial={{ opacity: 0, x: i === 0 ? -120 : i === 2 ? 120 : 0, y: i === 1 ? 120 : 0, rotate: i - 1 ? (i - 1) * 8 : 0 }}
            whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }} viewport={{ once: true, margin: "-60px" }}
            transition={i === 2 ? { duration: 1.8, ease: [0.16, 1, 0.3, 1] } : { type: "spring", stiffness: 70, damping: 13, delay: i * 0.1 }}
            onClick={() => { if (f.id === "yogesh") crazy(); else fx.sparkle(innerWidth / 2, innerHeight / 2, f.id === "abhi" ? ["💪", "🍗", "🔥", "🥤"] : ["🎬", "🍿", "⭐", "🔥"]); }}>
            <Tilt accent={f.accent}>
              <div className="relative p-5">
                {f.id === "abhi" && <AbhiFx />}
                {f.id === "yogesh" && <YogeshFx asleep={yAsleep} />}
                {f.id === "shiva" && <ShivaFx />}
                <div className="relative mt-10">
                  <Avatar f={f} className={f.id === "yogesh" && !yAsleep ? "translate-x-[2px] [filter:hue-rotate(40deg)]" : ""} />
                </div>
                <h3 className="mt-4 font-display text-3xl" style={{ color: f.accent }}>
                  {f.id === "yogesh" ? <span ref={glitchRef} className="glitch" data-text={`${f.name} (${f.nickname})`}>{f.name} ({f.nickname})</span> : f.name}
                </h3>
                <p className="text-sm text-sepia/70">{f.role}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {f.badges.map((b) => <span key={b} className="rounded-full px-3 py-1 text-xs font-bold text-black" style={{ background: f.accent }}>{b}</span>)}
                </div>
                <p className="mt-4 text-lg font-medium">😂 &ldquo;{f.tagline}&rdquo;</p>
                <p className="mt-2 text-sm text-sepia/80">{f.description}</p>
                {f.id === "abhi" && <Dumbbell aria-hidden className="mt-3 h-6 w-6 text-gym" />}
              </div>
            </Tilt>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
