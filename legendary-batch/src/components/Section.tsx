"use client";
import { motion } from "framer-motion";

export default function Section({ id, title, subtitle, children, className = "" }: { id: string; title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`relative mx-auto max-w-6xl overflow-x-clip px-4 py-20 sm:py-28 ${className}`}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }} className="mb-12 text-center">
        <h2 className="font-display text-4xl text-amber sm:text-6xl" style={{ textShadow: "3px 3px 0 #ff2a3d" }}>{title}</h2>
        {subtitle && <p className="mt-3 text-sepia/80 sm:text-lg">{subtitle}</p>}
      </motion.div>
      {children}
    </section>
  );
}
