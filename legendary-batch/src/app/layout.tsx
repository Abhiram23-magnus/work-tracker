import type { Metadata, Viewport } from "next";
import { Anton, Hind, Caveat } from "next/font/google";
import "./globals.css";

const display = Anton({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const body = Hind({ subsets: ["latin", "devanagari"], weight: ["400", "500", "700"], variable: "--font-body" });
const hand = Caveat({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-hand" });

export const metadata: Metadata = {
  title: "The Legendary Batch — Abhi × Yogesh × Shiva",
  description: "3 idiots. 1 friendship. Infinite problems. A Telugu mass-movie website for the batch.",
};
export const viewport: Viewport = { themeColor: "#0b0705", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${hand.variable}`}>
      <body className="grain scanlines font-body antialiased">{children}</body>
    </html>
  );
}
