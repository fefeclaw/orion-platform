"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Lang } from "./translations";

const VALID_LANGS: Lang[] = ["fr", "en", "de", "pt", "nl", "zh", "ko", "ja"];
const STORAGE_KEY = "orion-lang";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "fr",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  // After hydration: read persisted language from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && VALID_LANGS.includes(saved)) {
        setLangState(saved);
      }
    } catch {
      // localStorage unavailable (SSR, incognito with restrictions, etc.)
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    if (!VALID_LANGS.includes(l)) return;
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", l);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
