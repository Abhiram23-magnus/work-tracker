import type { FriendId } from "./friends";

export const quiz: { q: string; answer: FriendId | "nobody"; label: string; reaction: string }[] = [
  { q: "Who is most likely to sleep during an important moment?", answer: "yogesh", label: "Yogesh 😴", reaction: "ZZZ... mic drop. Oh wait, he's asleep." },
  { q: "Who is most likely to talk about gym?", answer: "abhi", label: "Abhi 💪", reaction: "Bro it's been 2 hours. We changed topic." },
  { q: "Who is most likely to ask what's for food?", answer: "abhi", label: "Abhi 🍗", reaction: "Pre-ordered before the question was asked." },
  { q: "Who is most likely to turn everything into a movie scene?", answer: "shiva", label: "Shiva 🎬", reaction: "Camera. Light. Action. Orey babu!" },
  { q: "Who is most likely to create a random problem?", answer: "yogesh", label: "Yogesh 💀", reaction: "Problem solved? No. Problem created." },
  { q: "Who is most likely to give a hero entry?", answer: "shiva", label: "Shiva 🔥", reaction: "Slow motion + background score. Mass!" },
  { q: "Who is most likely to disappear when food arrives?", answer: "nobody", label: "Nobody. 😂", reaction: "Everyone. Present. Instantly." },
];

export const stats: { who: FriendId; rows: { label: string; value: number }[] }[] = [
  { who: "abhi", rows: [{ label: "Gym obsession", value: 100 }, { label: "Food obsession", value: 100 }] },
  { who: "yogesh", rows: [{ label: "Sleep level", value: 150 }, { label: "Crazy level", value: 100 }] },
  { who: "shiva", rows: [{ label: "Acting level", value: 100 }, { label: "Drama level", value: 200 }] },
];

export const teluguPhrases = [
  "Orey babu 😂", "Em ra idi?", "Aapu ra ayya 💀", "Full damage.", "Mana batch vere level.",
  "Life lo peace ledu ra.", "Idhi friendship aa punishment aa?", "Ayyayyo 😂",
];
