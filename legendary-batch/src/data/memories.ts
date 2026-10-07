import { GROUP_PHOTO } from "./friends";

export interface Memory {
  id: string;
  src: string;
  caption: string;
  date?: string;
}

/**
 * ADD NEW PHOTOS HERE.
 * 1. Drop the file in /public/images/  (e.g. trip.jpg)
 * 2. Add one line below:  { id: "m6", src: "/images/trip.jpg", caption: "Evidence #006 💀" },
 * Missing files automatically fall back to the placeholder.
 */
export const memories: Memory[] = [
  { id: "m1", src: GROUP_PHOTO, caption: "Evidence #001 💀", date: "OCT 26 1985" },
  { id: "m2", src: GROUP_PHOTO, caption: "Before the brain cells disappeared." },
  { id: "m3", src: GROUP_PHOTO, caption: "Peak friendship." },
  { id: "m4", src: GROUP_PHOTO, caption: "Three legends. Zero supervision." },
  { id: "m5", src: GROUP_PHOTO, caption: "This photo should never reach parents. 😂" },
];

export const secretMemories: string[] = [
  "That time Yogesh said 'five minutes' and the plan became 'tomorrow'. 😴",
  "Abhi opened the menu 'just to see' and ordered for the whole table. 🍗",
  "Shiva narrated the bill payment like a climax scene. 🎬",
  "The group photo took 47 retakes because Shiva wanted a better 'entry'. 📸",
  "Abhi: 'One more rep.' Also Abhi, 3 minutes later: 'Where is the food?' 💀",
  "Yogesh woke up mid-conversation and answered a question from yesterday. 🤪",
  "Shiva said 'Let me explain the scene' and nobody could escape. 🎥",
];
