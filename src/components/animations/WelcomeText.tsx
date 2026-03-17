"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WELCOME_LANGUAGES } from "@/types";

interface WelcomeTextProps {
  lang?: string; // if provided, locks to this language (no cycling)
}

export default function WelcomeText({ lang }: WelcomeTextProps) {
  const [index, setIndex] = useState(0);

  // Auto-cycle only when no language is forced
  useEffect(() => {
    if (lang) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % WELCOME_LANGUAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [lang]);

  // When lang prop changes, snap to that language
  useEffect(() => {
    if (!lang) return;
    const idx = WELCOME_LANGUAGES.findIndex((l) => l.lang === lang);
    if (idx !== -1) setIndex(idx);
  }, [lang]);

  const current = WELCOME_LANGUAGES[index];
  const isCJK = ["zh", "ko", "ja"].includes(current.lang);

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="text-[10px] font-light tracking-[0.3em] text-[#D4AF37]/80 uppercase"
      >
        Orion Logistics
      </motion.p>

      {/* Main welcome text — taille réduite */}
      <div
        className="relative flex items-center justify-center"
        style={{ height: "4.5rem", width: "100%", overflow: "hidden" }}
      >
        <AnimatePresence mode="wait">
          <motion.h1
            key={current.lang}
            initial={{ opacity: 0, filter: "blur(12px)", y: 18 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, filter: "blur(12px)", y: -18 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute whitespace-nowrap text-4xl md:text-5xl font-thin select-none uppercase text-shimmer"
            style={{
              letterSpacing: isCJK ? "0.05em" : "0.2em",
            }}
          >
            {current.text}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* Language indicator dots */}
      <div className="flex items-center gap-1.5">
        {WELCOME_LANGUAGES.map((_, i) => (
          <motion.div
            key={i}
            animate={{ width: i === index ? 20 : 4, opacity: i === index ? 1 : 0.2 }}
            transition={{ duration: 0.35 }}
            className="h-[2px] rounded-full bg-[#D4AF37]"
          />
        ))}
      </div>
    </div>
  );
}
