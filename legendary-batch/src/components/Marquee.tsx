import { teluguPhrases } from "@/data/content";
export default function Marquee({ reverse = false }: { reverse?: boolean }) {
  const row = [...teluguPhrases, ...teluguPhrases];
  return (
    <div aria-hidden className="overflow-hidden border-y border-stage/40 bg-stage/10 py-3">
      <div className="flex w-max gap-10 whitespace-nowrap font-display text-2xl text-amber/90" style={{ animation: `marquee 28s linear infinite ${reverse ? "reverse" : ""}` }}>
        {[...row, ...row].map((p, i) => <span key={i}>{p} <span className="text-stage">✦</span></span>)}
      </div>
    </div>
  );
}
