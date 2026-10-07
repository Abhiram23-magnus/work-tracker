export type FriendId = "abhi" | "yogesh" | "shiva";

export interface Friend {
  id: FriendId;
  name: string;
  nickname: string;
  title: string; // funny title
  emoji: string;
  personality: string[];
  description: string; // funny description
  role: string;
  tagline: string; // intro card quote
  badges: string[];
  /** Individual photo (optional). Falls back to the group photo. */
  photo: string;
  accent: string; // css color
  /** Horizontal position (0-100) of this friend in the group photo; used to crop their face for the cards. Swap values if the order differs. */
  photoX: number;
  roasts: string[];
}

export const GROUP_PHOTO = "/images/group-photo.jpg";
export const GROUP_PHOTO_FALLBACK = "/images/group-photo.svg";

export const friends: Friend[] = [
  {
    id: "abhi",
    name: "Abhi",
    nickname: "The Minister",
    title: "ABHI — THE GYM & FOOD MINISTER 💪🍗",
    emoji: "💪",
    personality: ["Gym guy 💪", "Food guy 🍗", "Fitness obsessed", "Always thinking about food"],
    description: "Gym lo 2 hours... food gurinchi 5 hours. 😂",
    role: "Minister of Gym & Food",
    tagline: "Protein kosam life... biryani kosam soul.",
    badges: ["💪 GYM GUY", "🍗 FOOD GUY"],
    photo: GROUP_PHOTO,
    accent: "#c6ff3d",
    photoX: 27,
    roasts: [
      "Bro joined gym to build muscles but accidentally built a food review channel. 😂",
      "Abhi counts macros... mostly the ones on the biryani menu. 🍗",
      "Orey babu, the only thing he skips is leg day and a diet. 💀",
      "Gym lo 2 hours, food gurinchi 5 hours. Math is mathing. 😂",
      "His pre-workout is a plate of biryani. His post-workout is... also biryani. 🍗",
      "Abhi doesn't count reps. He counts how many hours until lunch. ⏰",
      "Ayyayyo! He said 'last set' and then ordered a full meal. 😭",
      "Protein shaker in one hand, restaurant menu in the other. Balanced. ⚖️",
    ],
  },
  {
    id: "yogesh",
    name: "Yogesh",
    nickname: "Nani",
    title: "YOGESH (NANI) — THE SLEEPY PSYCHO 😴💀",
    emoji: "😴",
    personality: ["Sleepy guy 😴", "Crazy guy 🤪", "Random behavior", "Can sleep anywhere"],
    description: "Wake him up and you unlock his final form. 😂",
    role: "Chief Chaos Officer",
    tagline: "Sleep mode → Crazy mode → Sleep mode.",
    badges: ["😴 SLEEPY GUY", "🤪 CRAZY GUY"],
    photo: GROUP_PHOTO,
    accent: "#a66bff",
    photoX: 53,
    roasts: [
      "Yogesh doesn't sleep 8 hours. He sleeps 8 business days. 💀",
      "Nani can fall asleep standing, sitting, walking, and mid-sentence. Full damage. 😴",
      "His alarm has filed for emotional damages. 🚨",
      "Aapu ra ayya — he said 'five minutes' and the sun came back up. 🌅",
      "Sleep mode → Crazy mode → Sleep mode. No middle setting installed. 🤪",
      "Em ra idi? Bro is plugged in at 1% and still creates 100% chaos. 🔋",
      "Wake him up at your own risk. Terms and conditions apply. 💀",
      "Yogesh isn't lazy. He's just saving energy for random nonsense. ⚡",
    ],
  },
  {
    id: "shiva",
    name: "Shiva",
    nickname: "The Hero",
    title: "SHIVA — THE ACTOR & PARTY DEPARTMENT 🎬🍻",
    emoji: "🎬",
    personality: ["Actor guy 🎬", "Hero vibes", "Dramatic", "Party-department guy 🍻"],
    description: "Every conversation needs a cinematic performance. 😂",
    role: "Head of Drama & Party Dept.",
    tagline: "Every scene deserves a hero entry.",
    badges: ["🎬 ACTOR GUY", "🍻 PARTY DEPARTMENT"],
    photo: GROUP_PHOTO,
    accent: "#ff2a3d",
    photoX: 78,
    roasts: [
      "Bro doesn't enter a room. He makes a cinematic entry. 😂",
      "Shiva asked for water and delivered a 3-minute monologue with background score. 🎬",
      "Even his 'ok' comes with slow motion and a punch dialogue. 🔥",
      "Ordering tea? Intermission scene. Paying the bill? Climax twist. 💀",
      "He thinks the group chat is his audition tape. 📹",
      "Orey babu, nobody asked for a flashback, Shiva. 😭",
      "Party department says he's on duty — mostly for the dramatic toast and the dialogues. 🥤",
      "He doesn't walk. He has a tracking shot. 🎥",
    ],
  },
];

export const friendById = (id: FriendId) => friends.find((f) => f.id === id)!;
