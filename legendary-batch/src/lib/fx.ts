type Handler = {
  confetti: (x?: number, y?: number, n?: number) => void;
  fireworks: (count?: number) => void;
  sparkle: (x: number, y: number, emoji?: string[]) => void;
};
let handler: Handler | null = null;
export const registerFx = (h: Handler | null) => { handler = h; };
export const fx = {
  confetti: (x?: number, y?: number, n?: number) => handler?.confetti(x, y, n),
  fireworks: (count?: number) => handler?.fireworks(count),
  sparkle: (x: number, y: number, emoji?: string[]) => handler?.sparkle(x, y, emoji),
};
