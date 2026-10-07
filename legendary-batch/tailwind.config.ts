import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#0b0705", ink: "#150d09", sepia: "#e9d3a8",
        stage: "#ff2a3d", amber: "#ffb43a", neon: "#33f0ff", gym: "#c6ff3d", violet: "#a66bff",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        hand: ["var(--font-hand)", "cursive"],
      },
    },
  },
  plugins: [],
};
export default config;
