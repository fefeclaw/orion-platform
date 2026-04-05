"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WELCOME_LANGUAGES } from "@/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";

export default function WelcomeText() {
  const [index, setIndex] = useState(0);
  const { lang } = useLanguage();
  const t = useTranslation();

  // When context lang changes, snap to that language immediately
  useEffect(() => {
    const idx = WELCOME_LANGUAGES.findIndex((l) => l.lang === lang);
    if (idx !== -1) setIndex(idx);
  }, [lang]);

  // Auto-cycle only when lang is "fr" (no explicit selection yet)
  useEffect(() => {
    if (lang !== "fr") return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % WELCOME_LANGUAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [lang]);

  const current = WELCOME_LANGUAGES[index];
  const isCJK = ["zh", "ko", "ja"].includes(current.lang);

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="text-[10px] font-light tracking-[0.3em] text-[#F59E0B]/80 uppercase"
      >
        Orion Logistics
      </motion.p>

      {/* Main welcome text */}
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
            style={{ letterSpacing: isCJK ? "0.05em" : "0.2em" }}
          >
            {current.text}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* Tagline — changes with language, proves switching works */}
      <AnimatePresence mode="wait">
        <motion.p
          key={`tagline-${lang}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4 }}
          className="text-[11px] font-light tracking-widest uppercase"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          {t("tagline")}
        </motion.p>
      </AnimatePresence>

      {/* Language indicator dots */}
      <div className="flex items-center gap-1.5 mt-1">
        {WELCOME_LANGUAGES.map((_, i) => (
          <motion.div
            key={i}
            animate={{ width: i === index ? 20 : 4, opacity: i === index ? 1 : 0.2 }}
            transition={{ duration: 0.35 }}
            className="h-[2px] rounded-full bg-[#F59E0B]"
          />
        ))}
      </div>
    </div>
  );
}
