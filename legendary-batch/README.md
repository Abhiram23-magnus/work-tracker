# THE LEGENDARY BATCH 😂🔥 — Abhi × Yogesh × Shiva

Telugu mass-movie friendship website. Next.js 14 · React · TypeScript · Tailwind · Framer Motion · Lucide.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Make it yours
| What | Where |
|---|---|
| **Main group photo** | save as `public/images/group-photo.jpg` (hero, cards, finale). A placeholder shows until then. |
| More gallery photos | drop in `public/images/`, add one line in `src/data/memories.ts` |
| Friends, roasts, titles | `src/data/friends.ts` (`photoX` = where each friend stands in the group photo, 0–100, left→right; swap if the order differs) |
| Memes | `src/data/memes.ts` (original text+emoji meme cards) |
| Quiz / stats / Telugu phrases | `src/data/content.ts` |
| **Song** | put your legally obtained file at `public/music/friendship-song.mp3`. Without it, an original built-in synth loop plays so the controls always work. |

Music never autoplays: it starts on the **ENTER CHEYYI RA** click. Suggested vibe for the real track: an energetic Telugu college/friendship mass number — pick any you own the rights to.

## Notes
- The "system error" popup appears once at random ~14–24s after entering.
- Missing photo/mp3 show up as expected 404s in the console until you add them.
- Needs TypeScript 5.x (Next 14 does not work with TS 7).
