"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Lang } from "@/i18n/translations";

const LANGUAGES = [
  { code: "fr" as Lang, label: "Français",   flag: "🇫🇷" },
  { code: "en" as Lang, label: "English",    flag: "🇬🇧" },
  { code: "de" as Lang, label: "Deutsch",    flag: "🇩🇪" },
  { code: "pt" as Lang, label: "Português",  flag: "🇵🇹" },
  { code: "nl" as Lang, label: "Nederlands", flag: "🇳🇱" },
  { code: "zh" as Lang, label: "中文",        flag: "🇨🇳" },
  { code: "ko" as Lang, label: "한국어",       flag: "🇰🇷" },
  { code: "ja" as Lang, label: "日本語",       flag: "🇯🇵" },
];

export default function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const { lang, setLang } = useLanguage();
  const selected = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (l: typeof LANGUAGES[0]) => {
    setLang(l.code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-medium tracking-wide transition-all rounded-full px-3 py-1.5"
        style={{
          border: "1px solid var(--lang-btn-border)",
          color: "var(--lang-btn-color)",
          background: "var(--lang-btn-bg)",
        }}
      >
        <span className="text-sm leading-none">{selected.flag}</span>
        <span>{selected.code.toUpperCase()}</span>
        <ChevronDown
          size={10}
          strokeWidth={2.5}
          className="transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50"
            style={{
              width: 156,
              background: "var(--lang-dropdown-bg)",
              border: "1px solid var(--lang-dropdown-border)",
              boxShadow: "var(--lang-dropdown-shadow)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {LANGUAGES.map((l) => {
              const isActive = selected.code === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => handleSelect(l)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs transition-colors"
                  style={{
                    color: isActive ? "#d4a843" : "var(--lang-item-color)",
                    background: isActive ? "rgba(212,168,67,0.06)" : "transparent",
                  }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "var(--lang-item-hover-bg)"; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <span className="text-base leading-none">{l.flag}</span>
                  <span className="font-medium">{l.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#d4a843]" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
