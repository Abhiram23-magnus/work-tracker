"use client";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { memories } from "@/data/memories";
import { fx } from "@/lib/fx";
import Photo from "./Photo";
import Section from "./Section";

const rot = (i: number) => [-5, 3, -2, 6, -4, 2, -6, 4][i % 8];

export default function Gallery() {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + memories.length) % memories.length)), []);
  useEffect(() => {
    if (open === null) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); };
    addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, close, step]);

  return (
    <Section id="gallery" title="EVIDENCE LOCKER 📸" subtitle="Tap any photo. Add more in src/data/memories.ts.">
      <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {memories.map((m, i) => {
          const film = i % 2 === 1;
          return (
            <div key={m.id} className="floaty mx-auto w-full max-w-xs" style={{ ["--r" as string]: "0deg", animationDelay: `${i * 0.7}s` }}>
            <motion.button data-testid={`photo-${i}`} initial={{ opacity: 0, scale: 0.7, rotate: rot(i) * 3 }} whileInView={{ opacity: 1, scale: 1, rotate: rot(i) }} viewport={{ once: true, margin: "-40px" }}
              whileHover={{ scale: 1.08, rotate: 0, zIndex: 10 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 120, damping: 12 }}
              onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); fx.sparkle(r.left + r.width / 2, r.top + r.height / 2); setOpen(i); }}
              className="block w-full" aria-label={`Open photo: ${m.caption}`}>
              {film ? (
                <div className="film-edge shadow-[0_20px_40px_#000]"><div className="aspect-[4/5] overflow-hidden"><Photo src={m.src} alt={m.caption} className="h-full w-full object-cover [filter:sepia(.35)_contrast(1.1)]" /></div>
                  <p className="px-3 pt-3 text-center font-mono text-xs text-amber">{m.caption}</p></div>
              ) : (
                <div className="bg-[#efe3c8] p-3 pb-4 shadow-[0_20px_40px_#000]"><div className="aspect-[4/5] overflow-hidden bg-black"><Photo src={m.src} alt={m.caption} className="h-full w-full object-cover [filter:sepia(.2)_contrast(1.05)]" /></div>
                  <p className="mt-3 text-center font-hand text-2xl leading-tight text-[#2a170c]">{m.caption}</p></div>
              )}
            </motion.button>
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {open !== null && (
          <motion.div key="lb" data-testid="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] flex items-center justify-center bg-black/95 p-4" onClick={close}>
            <button aria-label="Close" data-testid="lightbox-close" onClick={close} className="absolute right-4 top-4 rounded-full bg-white/10 p-3 hover:bg-white/20"><X /></button>
            <button aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-2 rounded-full bg-white/10 p-3 hover:bg-white/20 sm:left-6"><ChevronLeft /></button>
            <button aria-label="Next photo" onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-2 rounded-full bg-white/10 p-3 hover:bg-white/20 sm:right-6"><ChevronRight /></button>
            <motion.figure key={open} initial={{ scale: 0.6, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} className="max-h-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <Photo src={memories[open].src} alt={memories[open].caption} className="max-h-[75vh] w-auto rounded border-8 border-[#efe3c8] object-contain [filter:sepia(.2)]" />
              <figcaption className="mt-3 text-center font-hand text-3xl text-amber">{memories[open].caption}{memories[open].date ? ` — ${memories[open].date}` : ""}</figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}
