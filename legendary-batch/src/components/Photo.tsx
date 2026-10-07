"use client";
import { useState } from "react";
import { GROUP_PHOTO_FALLBACK } from "@/data/friends";

/** <img> that falls back to the placeholder illustration when the real photo is missing. */
export default function Photo({ src, alt, className, style, draggable = false }: { src: string; alt: string; className?: string; style?: React.CSSProperties; draggable?: boolean }) {
  const [s, setS] = useState(src);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={s} alt={alt} className={className} style={style} draggable={draggable} onError={() => s !== GROUP_PHOTO_FALLBACK && setS(GROUP_PHOTO_FALLBACK)} />;
}
