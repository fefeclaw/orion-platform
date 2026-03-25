"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Lang } from "./translations";

const VALID_LANGS: Lang[] = ["fr", "en", "de", "pt", "nl", "zh", "ko", "ja"];
const STORAGE_KEY = "orion-lang";

// ── Module-level store — bypasses React Context limitations ──────────────────
let _lang: Lang = "fr";
const _listeners = new Set<() => void>();

function _notify() {
  _listeners.forEach((fn) => fn());
}

function _subscribe(listener: () => void) {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

function _getSnapshot(): Lang {
  return _lang;
}

function _getServerSnapshot(): Lang {
  return "fr";
}

// Initialize from localStorage (client only)
if (typeof window !== "undefined") {
  const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved && VALID_LANGS.includes(saved)) {
    _lang = saved;
  }
}

export function setGlobalLang(l: Lang) {
  if (!VALID_LANGS.includes(l) || l === _lang) return;
  _lang = l;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.setAttribute("lang", l);
  }
  _notify();
}

// ── React hook — any component can call this directly ────────────────────────
export function useLanguage() {
  const lang = useSyncExternalStore(_subscribe, _getSnapshot, _getServerSnapshot);
  const setLang = useCallback((l: Lang) => setGlobalLang(l), []);
  return { lang, setLang };
}

// ── LanguageProvider — kept for layout.tsx compatibility (pass-through) ──────
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
