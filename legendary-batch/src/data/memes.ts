import type { FriendId } from "./friends";

export interface Meme {
  id: string;
  who: FriendId | "all";
  theme: string;
  /** Panels: each is a caption line. `big` = emoji/visual for the panel. */
  panels: { text: string; emoji: string }[];
  /** Optional custom image from /public/memes/ */
  image?: string;
}

export const memes: Meme[] = [
  {
    id: "me1", who: "abhi", theme: "Gym friends",
    panels: [
      { text: "Me after saying I'm on a diet...", emoji: "🥗" },
      { text: "Biryani entered the chat.", emoji: "🍗🔥" },
    ],
  },
  {
    id: "me2", who: "yogesh", theme: "Sleepy friends",
    panels: [
      { text: "Everyone: Let's go out.", emoji: "🚶‍♂️🚶🚶‍♀️" },
      { text: "Yogesh: 5 minutes...", emoji: "😴" },
      { text: "6 hours later", emoji: "💤💤💤" },
    ],
  },
  {
    id: "me3", who: "shiva", theme: "Movie / actor behaviour",
    panels: [
      { text: "Normal conversation", emoji: "💬" },
      { text: "Shiva: Let's make this cinematic.", emoji: "🎬🔥" },
    ],
  },
  {
    id: "me4", who: "all", theme: "Indian college life",
    panels: [
      { text: "Teacher: Any doubts?", emoji: "👩‍🏫" },
      { text: "Whole batch: Attendance maatrame doubt sir.", emoji: "😶" },
    ],
  },
  {
    id: "me5", who: "abhi", theme: "Food lovers",
    panels: [
      { text: "Abhi: 'Just one bite.'", emoji: "🍽️" },
      { text: "The plate: ceases to exist.", emoji: "💀" },
    ],
  },
  {
    id: "me6", who: "all", theme: "Group friendship",
    panels: [
      { text: "Plan: 10 minutes meeting", emoji: "⏱️" },
      { text: "Reality: 5 hours bakchodi", emoji: "🤡🔥" },
    ],
  },
];
