"use client";
import { useEffect, useState } from "react";

export default function FloatingEmojis({ emojis, count = 14, className = "" }: { emojis: string[]; count?: number; className?: string }) {
  const [items, setItems] = useState<{ e: string; l: number; d: number; s: number; t: number }[]>([]);
  useEffect(() => {
    setItems(Array.from({ length: count }, (_, i) => ({ e: emojis[i % emojis.length], l: Math.random() * 100, d: 8 + Math.random() * 10, s: 18 + Math.random() * 26, t: -Math.random() * 14 })));
  }, [count, emojis]);
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {items.map((it, i) => (
        <span key={i} className="absolute bottom-0 select-none" style={{ left: `${it.l}%`, fontSize: it.s, animation: `rise ${it.d}s linear ${it.t}s infinite` }}>{it.e}</span>
      ))}
    </div>
  );
}
